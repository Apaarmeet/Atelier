import { readFileFromPod } from "../k8s";

/**
 * Tool: Read_file
 * Description: Reads content from a file inside the Kubernetes Sandbox pod.
 */
export async function readFileTool(args: { file_path: string }, podName: string): Promise<string> {
  try {
    const { file_path } = args;
    
    // Read the file directly from the Pod
    const content = await readFileFromPod(podName, file_path);

    return JSON.stringify({ file_path, content });
  } catch (err: any) {
    return JSON.stringify({ error: `Failed to read file in Pod: ${err.message}` });
  }
}
