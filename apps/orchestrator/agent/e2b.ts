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

    console.log(`E2B Sandbox created with real E2B ID [${realE2bId}] for session [${sessionId}]. Setting up application...`);
    
    // Ensure working directory exists
    await sandbox.commands.run('mkdir -p /home/user/app').catch(() => {});

    // Install dependencies if node_modules is missing
    try {
      console.log("Checking dependencies in sandbox...");
      await sandbox.commands.run('test -d /home/user/app/node_modules || npm install', { cwd: '/home/user/app' });
    } catch (err: any) {
      console.warn("npm install warning:", err.message);
    }
    
    // Start Vite dev server with infinite auto-restart daemon in background
    console.log("Starting persistent Vite dev server daemon in sandbox on port 5173...");
    const daemonCmd = "nohup sh -c 'while true; do npx vite --host 0.0.0.0 --port 5173; sleep 1; done' > /home/user/vite.log 2>&1 &";
    sandbox.commands.run(daemonCmd, { 
      cwd: '/home/user/app',
      background: true 
    }).catch(err => {
      console.warn("Dev server start warning:", err.message);
    });

    return realE2bId;
  } catch (err: any) {
    console.error("Error creating E2B sandbox:", err);
    throw new Error(err.message || "Failed to initialize E2B sandbox pod");
  }
}

/**
 * Retrieves the preview URL for the sandbox's dev server (port 5173).
 * Automatically verifies if Vite dev server daemon is active, restarting if necessary.
 */
export async function forwardPodPort(sandboxId: string): Promise<{ url: string }> {
  const sandbox = await getOrConnectSandbox(sandboxId);
  
  // Verify if Vite dev server daemon is running inside container; if not, launch supervisor loop!
  try {
    const pCheck = await sandbox.commands.run('pgrep -f vite || true', { cwd: '/home/user/app' });
    if (!pCheck.stdout.trim()) {
      console.log("Vite dev server daemon is inactive on port 5173. Auto-launching persistent supervisor...");
      const daemonCmd = "nohup sh -c 'while true; do npx vite --host 0.0.0.0 --port 5173; sleep 1; done' > /home/user/vite.log 2>&1 &";
      sandbox.commands.run(daemonCmd, {
        cwd: '/home/user/app',
        background: true
      }).catch(err => console.warn("Dev server restart warning:", err.message));
      
      // Brief pause to allow port binding
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (err: any) {
    console.warn("Dev server health check warning:", err.message);
  }

  const rawHost = sandbox.getHost(5173);
  const previewUrl = rawHost.startsWith("http://") || rawHost.startsWith("https://")
    ? rawHost
    : `https://${rawHost}`;

  console.log(`Preview available at: ${previewUrl}`);
  
  return { url: previewUrl };
}

/**
 * Executes a bash command inside the specified E2B Sandbox without throwing on non-zero exit code
 */
export async function execCommandInPod(sandboxId: string, command: string | string[], cwd?: string): Promise<{ stdout: string, stderr: string, exitCode: number }> {
  const sandbox = await getOrConnectSandbox(sandboxId);

  const cmdString = typeof command === "string"
    ? command
    : command.map(c => `"${c.replace(/"/g, '\\"')}"`).join(' ');

  const targetDir = cwd || '/home/user/app';
  
  try {
    const result = await sandbox.commands.run(cmdString, { cwd: targetDir });
    return { 
      stdout: result.stdout || "", 
      stderr: result.stderr || "", 
      exitCode: result.exitCode ?? 0 
    };
  } catch (err: any) {
    // E2B SDK throws an Error ("exit status 1") when exitCode != 0
    return {
      stdout: err.stdout || "",
      stderr: err.stderr || err.message || "",
      exitCode: err.exitCode || 1,
    };
  }
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

