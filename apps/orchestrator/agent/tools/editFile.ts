/**
 * Tool: edit_file
 * Description: Replaces old_string with new_string in a specified file.
 */
export async function editFileTool(args: { file_path: string; old_string: string; new_string: string }): Promise<string> {
  try {
    const { file_path, old_string, new_string } = args;

    let content: string;
    if (typeof Bun !== "undefined") {
      content = await Bun.file(file_path).text();
    } else {
      const fs = await import("node:fs/promises");
      content = await fs.readFile(file_path, "utf-8");
    }

    if (!content.includes(old_string)) {
      return JSON.stringify({ error: `Could not find target text 'old_string' in ${file_path}` });
    }

    const updatedContent = content.replace(old_string, new_string);

    if (typeof Bun !== "undefined") {
      await Bun.write(file_path, updatedContent);
    } else {
      const fs = await import("node:fs/promises");
      await fs.writeFile(file_path, updatedContent, "utf-8");
    }

    return JSON.stringify({ success: true, file_path, message: "File edited successfully." });
  } catch (err: any) {
    return JSON.stringify({ error: `Failed to edit file: ${err.message}` });
  }
}
