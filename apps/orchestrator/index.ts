import "./env";
import express from "express";
import cors from "cors";
import { agentLoop } from "./agent/loop";
import { prisma } from "@repo/db";
import { createSandboxPod, forwardPodPort } from "./agent/e2b";

// Load environment variables
const PORT = process.env.PORT || 3001;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize new session and start agent
app.post("/api/session", async (req, res) => {
  try {
    const { initialPrompt, userId } = req.body;
    
    if (!initialPrompt || !userId) {
      return res.status(400).json({ error: "initialPrompt and userId are required" });
    }

    // Generate a random workspace ID
    const workspaceId = `workspace-${Date.now()}`;
    
    // Create session in DB
    const session = await prisma.session.create({
      data: {
        userId: userId,
        workspaceId: workspaceId,
      },
    });

    // Save initial prompt to DB
    await prisma.message.create({
      data: {
        sessionId: session.id,
        role: "user",
        content: initialPrompt,
      }
    });

    console.log(`Spinning up E2B Sandbox for session ${session.id}...`);
    // Create the Sandbox
    const podName = await createSandboxPod(session.id);
    
    // Expose the pod's port
    const portData = await forwardPodPort(podName);
    const previewUrl = portData.url;
    console.log(`Sandbox exposed at ${previewUrl}`);

    // Run the agent loop in the background, passing the sessionId and podName
    agentLoop(session.id, podName).catch(err => {
      console.error(`Agent error for session ${session.id}:`, err);
    });

    return res.json({
      sessionId: session.id,
      workspaceId: workspaceId,
      podName: podName,
      previewUrl: previewUrl,
      message: "Sandbox initialized and agent started.",
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Send a new message to an existing session
app.post("/api/session/:id/message", async (req, res) => {
  try {
    const { content, podName } = req.body;
    const sessionId = req.params.id;

    if (!content || !podName) {
      return res.status(400).json({ error: "content and podName are required" });
    }

    // Save user message to DB
    await prisma.message.create({
      data: {
        sessionId,
        role: "user",
        content,
      }
    });

    // Run the agent loop in the background
    agentLoop(sessionId, podName).catch(err => {
      console.error(`Agent error for session ${sessionId}:`, err);
    });

    return res.json({ success: true, message: "Message queued and agent started." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Get user's sessions
app.get("/api/users/:id/sessions", async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'asc' } // Get the first message as a summary
        }
      }
    });
    return res.json({ sessions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Get messages for a session
app.get("/api/sessions/:id/messages", async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { sessionId: req.params.id },
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ messages });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Re-establish or fetch the preview URL for a session
app.get("/api/sessions/:id/preview", async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id }
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    
    // Check if pod exists
    const podName = `workspace-${session.id.toLowerCase()}`;
    const portData = await forwardPodPort(podName);
    return res.json({ previewUrl: portData.url, podName });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Auth endpoints
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await prisma.user.create({
      data: { name, email, password }
    });
    return res.json({ user });
  } catch (err: any) {
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