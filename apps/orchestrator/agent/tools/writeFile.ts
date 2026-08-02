import { writeFileToPod } from "../k8s";

/**
 * Tool: write_file
 * Description: Writes content to a file inside the Kubernetes Sandbox pod.
 */
export async function writeFileTool(args: { file_path: string; content: string }, podName: string): Promise<string> {
  try {
    const { file_path, content } = args;

    // Write the file directly to the Pod
    await writeFileToPod(podName, file_path, content);

    return JSON.stringify({
      success: true,
      file_path,
      message: "File written successfully in the Pod.",
    });
  } catch (err: any) {
    return JSON.stringify({ error: `Failed to write file in Pod: ${err.message}` });
  }
}
