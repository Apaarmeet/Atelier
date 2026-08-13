import { Sandbox } from 'e2b';
import { prisma } from "@repo/db";

// Keep track of active sandboxes in memory for the orchestrator
const activeSandboxes = new Map<string, Sandbox>();
const sandboxIdToE2bIdMap = new Map<string, string>();

/**
 * Retrieves an active Sandbox instance from memory, reconnects via E2B SDK using real E2B ID
 */
export async function getOrConnectSandbox(sandboxId: string): Promise<Sandbox> {
  let sandbox = activeSandboxes.get(sandboxId);
  if (sandbox) return sandbox;

  // Extract real E2B sandbox ID or lookup from DB if needed
  let e2bId = sandboxIdToE2bIdMap.get(sandboxId) || sandboxId.replace(/^workspace-/, '');
  
  if (!activeSandboxes.has(e2bId)) {
    const rawSessionId = sandboxId.replace(/^workspace-/, '');
    try {
      const session = await prisma.session.findUnique({ where: { id: rawSessionId } });
      if (session?.sandboxId) {
        e2bId = session.sandboxId;
      }
    } catch (dbErr) {
      console.warn("Database lookup in getOrConnectSandbox failed:", dbErr);
    }
  }

  try {
    console.log(`Reconnecting to active E2B sandbox container (${e2bId})...`);
    sandbox = await Sandbox.connect(e2bId);
    activeSandboxes.set(sandboxId, sandbox);
    activeSandboxes.set(sandbox.sandboxId, sandbox);
    return sandbox;
  } catch (err: any) {
    console.warn(`Could not reconnect to E2B sandbox ${e2bId}: ${err.message}`);
    throw new Error(`Sandbox ${sandboxId} (E2B ID: ${e2bId}) could not be reached via E2B SDK. Please check your E2B API key or dashboard.`);
  }
}

/**
 * Creates a new E2B Sandbox for the session
 */
export async function createSandboxPod(sessionId: string): Promise<string> {
  const customWorkspaceId = `workspace-${sessionId.toLowerCase()}`;
  
  try {
    console.log(`Starting E2B sandbox for session ${sessionId}...`);
    // Create an E2B Sandbox with a 1 hour timeout
    const sandbox = await Sandbox.create('base', {
      metadata: { sessionId },
      timeoutMs: 1000 * 60 * 60, // 1 hour
    });
    
    const realE2bId = sandbox.sandboxId;

    // Store in DB session record for persistence across restarts
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: { sandboxId: realE2bId },
      });
    } catch (err) {
      console.warn(`Could not save sandboxId to DB for session ${sessionId}:`, err);
    }

    // Store in our maps under both custom workspaceId, sessionId, and real E2B sandboxId
    activeSandboxes.set(customWorkspaceId, sandbox);
    activeSandboxes.set(sessionId, sandbox);
    activeSandboxes.set(realE2bId, sandbox);

    sandboxIdToE2bIdMap.set(customWorkspaceId, realE2bId);
    sandboxIdToE2bIdMap.set(sessionId, realE2bId);
    sandboxIdToE2bIdMap.set(realE2bId, realE2bId);

    console.log(`E2B Sandbox created with real E2B ID [${realE2bId}] for session [${sessionId}]. Setting up React template...`);
    
    // Set up the React application using Vite
    await sandbox.commands.run('mkdir -p /home/user/app');
    
    // Ensure Bun is installed in container if missing
    await sandbox.commands.run('command -v bun >/dev/null 2>&1 || (curl -fsSL https://bun.sh/install | bash)');

    // Create a new React app with Vite inside /home/user/app using Bun
    await sandbox.commands.run('export PATH="$HOME/.bun/bin:$PATH" && bun create vite . --template react', { cwd: '/home/user/app' });
    
    // Remove existing vite.config.ts if created by template to avoid duplicate config conflicts
    await sandbox.commands.run('rm -f /home/user/app/vite.config.ts');
    
    await sandbox.commands.run('export PATH="$HOME/.bun/bin:$PATH" && bun install', { cwd: '/home/user/app' });
    
    // Update vite.config.js to allow host and lock port 5173
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true
  }
})`
    await sandbox.files.write('/home/user/app/vite.config.js', viteConfig);
    
    // Start the dev server in the background using Bun
    sandbox.commands.run('export PATH="$HOME/.bun/bin:$PATH" && bun run dev --host 0.0.0.0 --port 5173', { 
      cwd: '/home/user/app',
      background: true 
    });

    return realE2bId;
  } catch (err) {
    console.error("Error creating E2B sandbox:", err);
    throw err;
  }
}

/**
 * Retrieves the preview URL for the sandbox's dev server (port 5173).
 */
export async function forwardPodPort(sandboxId: string): Promise<{ url: string }> {
  const sandbox = await getOrConnectSandbox(sandboxId);
  
  const rawHost = sandbox.getHost(5173);
  const previewUrl = rawHost.startsWith("http://") || rawHost.startsWith("https://")
    ? rawHost
    : `https://${rawHost}`;

  console.log(`Preview available at: ${previewUrl}`);
  
  return { url: previewUrl };
}

/**
 * Executes a bash command inside the specified E2B Sandbox
 */
export async function execCommandInPod(sandboxId: string, command: string | string[], cwd?: string): Promise<{ stdout: string, stderr: string }> {
  const sandbox = await getOrConnectSandbox(sandboxId);

  const cmdString = typeof command === "string"
    ? command
    : command.map(c => `"${c.replace(/"/g, '\\"')}"`).join(' ');

  const targetDir = cwd || '/home/user/app';
  const result = await sandbox.commands.run(cmdString, { cwd: targetDir });
  
  if (result.exitCode !== 0) {
    throw new Error(`Command failed (exit code ${result.exitCode}): ${result.stderr || result.stdout}`);
  }
  
  return { stdout: result.stdout, stderr: result.stderr };
}

/**
 * Reads a file from the Sandbox
 */
export async function readFileFromPod(sandboxId: string, filePath: string): Promise<string> {
  const sandbox = await getOrConnectSandbox(sandboxId);

  return await sandbox.files.read(filePath);
}

/**
 * Writes a file to the Sandbox
 */
export async function writeFileToPod(sandboxId: string, filePath: string, content: string): Promise<void> {
  const sandbox = await getOrConnectSandbox(sandboxId);

  await sandbox.files.write(filePath, content);
}

/**
 * Deletes the Sandbox when the session ends
 */
export async function deleteSandboxPod(sandboxId: string): Promise<void> {
  try {
    const sandbox = await getOrConnectSandbox(sandboxId);
    await sandbox.kill();
    activeSandboxes.delete(sandboxId);
    sandboxIdToE2bIdMap.delete(sandboxId);
    console.log(`Sandbox ${sandboxId} deleted.`);
  } catch (err) {
    console.warn(`Error deleting sandbox ${sandboxId}:`, err);
  }
}

