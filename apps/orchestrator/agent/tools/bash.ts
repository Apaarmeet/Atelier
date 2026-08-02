import { execCommandInPod } from "../k8s";

/**
 * Tool: bash
 * Description: Executes a bash command in the Kubernetes Sandbox pod.
 */
export async function bashTool(args: { command: string }, podName: string): Promise<string> {
  try {
    const { command } = args;

    // Block long-running server commands as they freeze the agent loop
    const blockedCommands = ["npm run dev", "bun run dev", "yarn dev", "npm start", "vite"];
    if (blockedCommands.some(cmd => command.includes(cmd))) {
      return JSON.stringify({
        error: `Action blocked: '${command}'. The development server is already running in the background. You do not need to start it.`,
      });
    }

    // Execute the command inside the Kubernetes Pod
    // Adding a timeout via standard bash timeout command if desired, but 
    // the K8s exec API streams the output. We wrap it in a timeout wrapper:
    const result = await execCommandInPod(podName, ["/bin/sh", "-c", command]);

    return JSON.stringify({
      command,
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
    });
  } catch (err: any) {
    return JSON.stringify({
      error: `Command execution failed in Pod: ${err.message}`,
    });
  }
}
