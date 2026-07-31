import { config } from "dotenv";
import express from "express";
import cors from "cors";
import { agentLoop } from "./agent/loop";
import { prisma } from "@repo/db";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

// Load environment variables
config();

const execAsync = promisify(exec);
const PORT = process.env.PORT || 3001;
let nextDevPort = 5173; // Starting port for Vite servers

const workspacesDir = path.join(process.cwd(), "workspaces");

// Ensure workspaces directory exists
fs.mkdir(workspacesDir, { recursive: true }).catch(() => {});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize new session and start agent
app.post("/api/session", async (req, res) => {
  try {
    const { initialPrompt } = req.body;
    
    if (!initialPrompt) {
      return res.status(400).json({ error: "initialPrompt is required" });
    }

    // Get or create a dummy user
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        },
      });
    }

    // Generate a random workspace ID
    const workspaceId = `workspace-${Date.now()}`;
    
    // Create session in DB
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        workspaceId: workspaceId,
      },
    });

    const targetDir = path.join(workspacesDir, workspaceId);

    // Copy the base template to the new workspace directory
    const baseTemplateDir = path.join(process.cwd(), "base-template");
    await execAsync(`cp -R ${baseTemplateDir} ${targetDir}`);

    // Start the dev server on a unique port
    const devPort = nextDevPort++;
    console.log(`Starting dev server for ${workspaceId} on port ${devPort}...`);
    
    // Spawn the dev server process
    const proc = Bun.spawn(["bun", "run", "dev", "--port", devPort.toString()], {
      cwd: targetDir,
      stdout: "ignore", 
      stderr: "ignore",
    });

    // Run the agent loop in the background
    agentLoop(initialPrompt, targetDir).catch(err => {
      console.error(`Agent error for session ${session.id}:`, err);
    });

    return res.json({
      sessionId: session.id,
      workspaceId: workspaceId,
      previewUrl: `http://localhost:${devPort}`,
      message: "Session initialized and agent started.",
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Simple endpoint to get session count for the frontend chart
app.get("/api/sessions/count", async (req, res) => {
  try {
    const count = await prisma.session.count();
    return res.json({ count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`🚀 Lovable Orchestrator (Express) running on http://localhost:${PORT}`);
});