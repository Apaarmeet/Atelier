import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources";
import { config } from "dotenv";
import { tools } from "./toolsRef";
import { executeTool } from "./tools";

// Load environment variables from .env
config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

import { prisma } from "@repo/db";

import fs from "fs";
import path from "path";

// Read system prompt from soul.md
let systemPrompt = "";
const possibleSoulPaths = [
  path.resolve(process.cwd(), "agent/soul.md"),
  path.resolve(process.cwd(), "apps/orchestrator/agent/soul.md"),
  path.join(process.cwd(), "soul.md"),
];

for (const p of possibleSoulPaths) {
  if (fs.existsSync(p)) {
    try {
      systemPrompt = fs.readFileSync(p, "utf-8");
      console.log(`✅ System prompt loaded from: ${p}`);
      break;
    } catch (e) {
      // Continue to next path
    }
  }
}

/**
 * Runs the agent loop programmatically for a session.
 */
export async function agentLoop(sessionId: string, podName: string) {
  // 1. Load history from DB
  const dbMessages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: systemPrompt || `You are Forge, an AI software engineer that builds and modifies web applications in an E2B sandbox. Working directory: /home/user/app.`,
    },
  ];

  // Map DB messages to OpenAI format
  for (const msg of dbMessages) {
    if (msg.role === "user" || msg.role === "system") {
      messages.push({ role: msg.role as any, content: msg.content });
    } else if (msg.role === "assistant") {
      const assistantMsg: any = { 
        role: "assistant", 
        content: msg.content || null 
      };
      if (msg.toolCalls) {
        assistantMsg.tool_calls = msg.toolCalls;
      }
      messages.push(assistantMsg);
    } else if (msg.role === "tool") {
      const toolData = msg.toolCalls as any;
      messages.push({
        role: "tool",
        tool_call_id: toolData?.tool_call_id || "call_unknown",
        content: msg.content,
      });
    }
  }

  console.log(`🤖 Agent loop resuming for session: ${sessionId} in Pod: ${podName}\n`);

  const modelName = process.env.MODEL_NAME || "deepseek/deepseek-chat";
  const MAX_STEPS = 20;
  let stepCount = 0;

  while (stepCount < MAX_STEPS) {
    stepCount++;
    console.log(`⏳ Thinking (Step ${stepCount}/${MAX_STEPS})...`);

    try {
      const response = await openai.chat.completions.create({
        model: modelName,
        messages,
        tools,
      });

      const message = response.choices[0]?.message;
      if (!message) break;

      // Add assistant message to history and DB
      messages.push(message);
      await prisma.message.create({
        data: {
          sessionId,
          role: "assistant",
          content: message.content || "",
          toolCalls: message.tool_calls ? (message.tool_calls as any) : null,
        }
      });

      // Check if LLM called any tool
      const toolCalls = message.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          if (toolCall.type === "function" && toolCall.function) {
            const name = toolCall.function.name;
            const rawArgs = toolCall.function.arguments;
            let args: any = {};
            try {
              args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
            } catch (pErr) {
              console.error("Failed to parse tool arguments:", rawArgs);
            }

            console.log(`🛠️ Calling Tool: ${name}(${JSON.stringify(args)})`);

            const toolResult = await executeTool(name, args, podName);
            console.log(`📤 Tool Result: ${toolResult}\n`);

            // Pass tool output back to LLM and DB
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: toolResult,
            });
            
            await prisma.message.create({
              data: {
                sessionId,
                role: "tool",
                content: toolResult,
                toolCalls: { tool_call_id: toolCall.id },
              }
            });
          }
        }
        // Continue loop so LLM can process tool results
      } else {
        // No tool calls -> Output final response and return
        console.log(`\n🤖 Assistant:\n${message.content}\n`);
        return message.content;
      }
    } catch (err: any) {
      console.error(`Error in agent loop for session ${sessionId}:`, err);
      const errorMessage = `⚠️ **Agent Error**: ${err.message || "An unexpected error occurred during execution."}`;
      
      await prisma.message.create({
        data: {
          sessionId,
          role: "assistant",
          content: errorMessage,
        }
      });
      return errorMessage;
    }
  }

  if (stepCount >= MAX_STEPS) {
    const stepLimitMessage = "⚠️ **Agent Step Limit Reached**: Maximum execution steps reached for this request.";
    await prisma.message.create({
      data: {
        sessionId,
        role: "assistant",
        content: stepLimitMessage,
      }
    });
    return stepLimitMessage;
  }
}
