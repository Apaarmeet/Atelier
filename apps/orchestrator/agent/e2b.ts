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
    await sandbox.commands.run('mkdir -p /home/user/app/src /home/user/app/public').catch(() => {});

    // Check if /home/user/app/package.json exists; if missing (default 'base' sandbox), populate template
    try {
      const pkgCheck = await sandbox.commands.run('test -f /home/user/app/package.json && echo "exists" || echo "missing"');
      if (pkgCheck.stdout.trim() !== "exists") {
        console.log("Populating React + Vite + Tailwind template in default sandbox...");
        
        const packageJson = {
          name: "react-app",
          private: true,
          version: "0.0.0",
          type: "module",
          scripts: {
            "dev": "vite --host 0.0.0.0 --port 5173",
            "build": "vite build",
            "preview": "vite preview"
          },
          dependencies: {
            "react": "^18.3.1",
            "react-dom": "^18.3.1",
            "lucide-react": "^0.460.0"
          },
          devDependencies: {
            "@types/react": "^18.3.1",
            "@types/react-dom": "^18.3.1",
            "@vitejs/plugin-react": "^4.3.3",
            "autoprefixer": "^10.4.20",
            "postcss": "^8.4.47",
            "tailwindcss": "^3.4.14",
            "vite": "^5.4.10"
          }
        };
        await sandbox.files.write('/home/user/app/package.json', JSON.stringify(packageJson, null, 2));

        const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    allowedHosts: true
  }
})`;
        await sandbox.files.write('/home/user/app/vite.config.js', viteConfig);

        const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lovable Application</title>
  </head>
  <body class="bg-slate-900 text-white min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
        await sandbox.files.write('/home/user/app/index.html', indexHtml);

        const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;
        await sandbox.files.write('/home/user/app/src/main.jsx', mainJsx);

        const appJsx = `import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-3">
          Sandbox Ready
        </h1>
        <p className="text-slate-400 text-sm">
          Your React application sandbox is active and running. The AI agent will update this app based on your prompts!
        </p>
      </div>
    </div>
  )
}`;
        await sandbox.files.write('/home/user/app/src/App.jsx', appJsx);

        const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;`;
        await sandbox.files.write('/home/user/app/src/index.css', indexCss);

        const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
        await sandbox.files.write('/home/user/app/tailwind.config.js', tailwindConfig);

        const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
        await sandbox.files.write('/home/user/app/postcss.config.js', postcssConfig);
      }
    } catch (err: any) {
      console.warn("Template verification warning:", err.message);
    }

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

  const targetDir = (!cwd || cwd === '.' || cwd === './') 
    ? '/home/user/app' 
    : resolveAppPath(cwd);
  
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
 * Helper to guarantee all file paths target /home/user/app
 */
function resolveAppPath(filePath: string): string {
  if (filePath.startsWith('/home/user/app')) {
    return filePath;
  }
  const cleanPath = filePath.replace(/^(\.\/|\/)/, '');
  return `/home/user/app/${cleanPath}`;
}

/**
 * Reads a file from the Sandbox
 */
export async function readFileFromPod(sandboxId: string, filePath: string): Promise<string> {
  const sandbox = await getOrConnectSandbox(sandboxId);
  const targetPath = resolveAppPath(filePath);
  return await sandbox.files.read(targetPath);
}

/**
 * Writes a file to the Sandbox
 */
export async function writeFileToPod(sandboxId: string, filePath: string, content: string): Promise<void> {
  const sandbox = await getOrConnectSandbox(sandboxId);
  const targetPath = resolveAppPath(filePath);

  // If writing App.tsx, clean up old template App.jsx to prevent Vite resolution ambiguity
  if (targetPath.endsWith('/src/App.tsx')) {
    await sandbox.commands.run('rm -f /home/user/app/src/App.jsx').catch(() => {});
  }

  await sandbox.files.write(targetPath, content);
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

