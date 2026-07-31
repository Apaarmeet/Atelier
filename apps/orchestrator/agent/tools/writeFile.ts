/**
 * Tool: write_file
 * Description: Write content to a file (creates or overwrites).
 */
export async function writeFileTool(args: { file_path: string; content: string }): Promise<string> {
  try {
    const { file_path, content } = args;

    if (typeof Bun !== "undefined") {
      await Bun.write(file_path, content);
    } else {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      await fs.mkdir(path.dirname(file_path), { recursive: true });
      await fs.writeFile(file_path, content, "utf-8");
    }

    return JSON.stringify({ success: true, file_path, message: "File written successfully." });
  } catch (err: any) {
    return JSON.stringify({ error: `Failed to write file: ${err.message}` });
  }
}
