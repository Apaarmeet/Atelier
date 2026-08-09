import { readFileFromPod, writeFileToPod } from "../e2b";

/**
 * Tool: edit_file
 * Description: Replaces old_string with new_string in a specified file inside the Kubernetes Sandbox pod.
 */
export async function editFileTool(args: { file_path: string; old_string: string; new_string: string }, podName: string): Promise<string> {
  try {
    const { file_path, old_string, new_string } = args;

    // Read file from pod
    const content = await readFileFromPod(podName, file_path);

    if (!content.includes(old_string)) {
      return JSON.stringify({ error: `Could not find target text 'old_string' in ${file_path}` });
    }

    const updatedContent = content.replace(old_string, new_string);

    // Write file back to pod
    await writeFileToPod(podName, file_path, updatedContent);

    return JSON.stringify({ success: true, file_path, message: "File edited successfully in Pod." });
  } catch (err: any) {
    return JSON.stringify({ error: `Failed to edit file in Pod: ${err.message}` });
  }
}
