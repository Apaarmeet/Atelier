import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

/**
 * Tool: bash
 * Description: Executes a bash command in the specified working directory.
 */
export async function bashTool(args: { command: string; workdir?: string }): Promise<string> {
  try {
    const { command, workdir } = args;
    const cwd = workdir || process.cwd();

    // Block long-running server commands
    const blockedCommands = ["npm run dev", "bun run dev", "yarn dev", "npm start", "vite"];
    if (blockedCommands.some(cmd => command.includes(cmd))) {
      return JSON.stringify({
        error: `Action blocked: '${command}'. The development server is already running in the background. You do not need to start it.`,
      });
    }

    // Add a timeout of 15 seconds to prevent hanging
    const { stdout, stderr } = await execAsync(command, { cwd, timeout: 15000 });

    return JSON.stringify({
      command,
      cwd,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    });
  } catch (err: any) {
    return JSON.stringify({
      error: `Command execution failed: ${err.message}`,
      stdout: err.stdout ? err.stdout.trim() : "",
      stderr: err.stderr ? err.stderr.trim() : "",
    });
  }
}
