/**
 * Tool: Read_file
 * Description: Reads content from a file at a given file path.
 */
export async function readFileTool(args: { file_path: string }): Promise<string> {
  try {
    const { file_path } = args;
    let content: string;

    if (typeof Bun !== "undefined") {
      content = await Bun.file(file_path).text();
    } else {
      const fs = await import("node:fs/promises");
      content = await fs.readFile(file_path, "utf-8");
    }

    return JSON.stringify({ file_path, content });
  } catch (err: any) {
    return JSON.stringify({ error: `Failed to read file: ${err.message}` });
  }
}
