import { Sandbox } from 'e2b';

// Keep track of active sandboxes in memory for the orchestrator
const activeSandboxes = new Map<string, Sandbox>();

/**
 * Creates a new E2B Sandbox for the session
 */
export async function createSandboxPod(sessionId: string): Promise<string> {
  const sandboxId = `workspace-${sessionId.toLowerCase()}`;
  
  try {
    console.log(`Starting E2B sandbox for session ${sessionId}...`);
    // Create an E2B Sandbox with a 1 hour timeout (default is 5 minutes which is too short for agent loops)
    const sandbox = await Sandbox.create('base', {
      metadata: { sessionId },
      timeoutMs: 1000 * 60 * 60, // 1 hour
    });
    
    // Store in our map
    activeSandboxes.set(sandboxId, sandbox);

    console.log(`Sandbox ${sandbox.sandboxId} created. Setting up React template...`);
    
    // Set up the React application using Vite
    // We clone/create it into /home/user/app
    await sandbox.commands.run('mkdir -p /home/user/app');
    
    // Create a new React app with Vite inside /home/user/app without prompting
    // Using create-vite@5 because the default E2B base image has Node 20.9.0, and Vite 6 requires 20.19.0+
    await sandbox.commands.run('npx -y create-vite@5 . --template react', { cwd: '/home/user/app' });
    await sandbox.commands.run('npm install', { cwd: '/home/user/app' });
    
    // Get the exact hostname that Vite will be accessed from
    const sandboxHost = sandbox.getHost(5173);
    
    // Update vite.config.js to allow the specific E2B host
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['${sandboxHost}'],
    host: '0.0.0.0'
  }
})`
    await sandbox.files.write('/home/user/app/vite.config.js', viteConfig);
    
    // Start the dev server in the background
    // Vite defaults to port 5173. We use --host so it's accessible.
    sandbox.commands.run('npm run dev -- --host 0.0.0.0', { 
      cwd: '/home/user/app',
      background: true 
    });

    return sandboxId;
  } catch (err) {
    console.error("Error creating E2B sandbox:", err);
    throw err;
  }
}

/**
 * Retrieves the preview URL for the sandbox's dev server (port 5173).
 * E2B provides a direct public URL for any exposed port.
 */
export async function forwardPodPort(sandboxId: string): Promise<{ url: string }> {
  const sandbox = activeSandboxes.get(sandboxId);
  if (!sandbox) {
    throw new Error(`Sandbox ${sandboxId} not found in memory`);
  }
  
  // Wait a moment to ensure the Vite server has started
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // E2B exposes ports automatically. getHost returns the URL to access it.
  const previewUrl = `https://${sandbox.getHost(5173)}`;
  console.log(`Preview available at: ${previewUrl}`);
  
  return { url: previewUrl };
}

/**
 * Executes a bash command inside the specified E2B Sandbox
 */
export async function execCommandInPod(sandboxId: string, command: string[]): Promise<{ stdout: string, stderr: string }> {
  const sandbox = activeSandboxes.get(sandboxId);
  if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`);

  // E2B commands.run takes a string, so we join the command array
  const cmdString = command.map(c => `"${c.replace(/"/g, '\\"')}"`).join(' ');
  const result = await sandbox.commands.run(cmdString, { cwd: '/home/user/app' });
  
  if (result.exitCode !== 0) {
    throw new Error(`Command failed: ${result.stderr}`);
  }
  
  return { stdout: result.stdout, stderr: result.stderr };
}

/**
 * Reads a file from the Sandbox
 */
export async function readFileFromPod(sandboxId: string, filePath: string): Promise<string> {
  const sandbox = activeSandboxes.get(sandboxId);
  if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`);

  return await sandbox.files.read(filePath);
}

/**
 * Writes a file to the Sandbox
 */
export async function writeFileToPod(sandboxId: string, filePath: string, content: string): Promise<void> {
  const sandbox = activeSandboxes.get(sandboxId);
  if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`);

  await sandbox.files.write(filePath, content);
}

/**
 * Deletes the Sandbox when the session ends
 */
export async function deleteSandboxPod(sandboxId: string): Promise<void> {
  const sandbox = activeSandboxes.get(sandboxId);
  if (sandbox) {
    await sandbox.kill();
    activeSandboxes.delete(sandboxId);
    console.log(`Sandbox ${sandboxId} deleted.`);
  }
}
