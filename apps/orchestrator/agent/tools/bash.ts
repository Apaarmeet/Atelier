import { execCommandInPod } from "../e2b";

/**
 * Tool: bash
 * Description: Executes a bash command in the Kubernetes Sandbox pod.
 */
export async function bashTool(args: { command: string; workdir?: string }, podName: string): Promise<string> {
  try {
    const { command, workdir } = args;

    // Block long-running server commands as they freeze the agent loop
    const blockedCommands = ["npm run dev", "bun run dev", "yarn dev", "npm start", "vite"];
    if (blockedCommands.some(cmd => command.includes(cmd))) {
      return JSON.stringify({
        error: `Action blocked: '${command}'. The development server is already running in the background. You do not need to start it.`,
      });
    }

    // Execute the command inside the E2B Sandbox
    const result = await execCommandInPod(podName, command, workdir);

    return JSON.stringify({
      command,
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
      exitCode: result.exitCode,
    });
  } catch (err: any) {
    return JSON.stringify({
      error: `Command execution failed in Pod: ${err.message}`,
    });
  }
}
