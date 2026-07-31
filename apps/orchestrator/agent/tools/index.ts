import { readFileTool } from "./readFile";
import { writeFileTool } from "./writeFile";
import { editFileTool } from "./editFile";
import { bashTool } from "./bash";

// Map tool names to their implementation functions
export const toolRegistry: Record<string, (args: any) => Promise<string>> = {
  Read_file: readFileTool,
  read_file: readFileTool,
  write_file: writeFileTool,
  edit_file: editFileTool,
  bash: bashTool,
};

/**
 * Central tool executor called by the agent loop
 */
export async function executeTool(name: string, args: any): Promise<string> {
  const toolFn = toolRegistry[name];

  if (!toolFn) {
    return JSON.stringify({ error: `Tool '${name}' is not supported in the tool registry.` });
  }

  try {
    return await toolFn(args);
  } catch (err: any) {
    return JSON.stringify({ error: `Execution error in tool '${name}': ${err.message}` });
  }
}
