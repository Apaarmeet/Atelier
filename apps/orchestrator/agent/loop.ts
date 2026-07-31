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

/**
 * Runs the agent loop programmatically with a user prompt.
 */
export async function agentLoop(userPrompt: string, workdir: string) {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are a helpful coding assistant equipped with tools to read files, write files, edit files, and execute bash commands to assist the user.
Your current working directory for the user's React project is: ${workdir}
Always use this directory as the base path or working directory when manipulating files or running bash commands.`,
    },
    {
      role: "user",
      content: userPrompt,
    },
  ];

  console.log(`🤖 Agent running prompt: "${userPrompt}"\n`);

  while (true) {
    console.log("⏳ Thinking...");

    const response = await openai.chat.completions.create({
      model: "nvidia/nemotron-3-ultra-550b-a55b:free",
      messages,
      tools,
    });

    const message = response.choices[0]?.message;
    if (!message) break;

    // Add assistant message to history
    messages.push(message);

    // Check if LLM called any tool
    const toolCalls = message.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        if (toolCall.type === "function" && toolCall.function) {
          const name = toolCall.function.name;
          const rawArgs = toolCall.function.arguments;
          const args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;

          console.log(`🛠️ Calling Tool: ${name}(${JSON.stringify(args)})`);

          const toolResult = await executeTool(name, args);
          console.log(`📤 Tool Result: ${toolResult}\n`);

          // Pass tool output back to LLM
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult,
          });
        }
      }
      // Continue loop so LLM can process tool results
    } else {
      // No tool calls -> Output final response and return
      console.log(`\n🤖 Assistant:\n${message.content}\n`);
      return message.content;
    }
  }
}
