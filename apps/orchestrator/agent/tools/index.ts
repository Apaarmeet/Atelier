import { readFileTool } from "./readFile";
import { writeFileTool } from "./writeFile";
import { editFileTool } from "./editFile";
import { bashTool } from "./bash";

// Map tool names to their implementation functions (supports both tool_file and short names)
export const toolRegistry: Record<string, (args: any, podName: string) => Promise<string>> = {
  Read_file: readFileTool,
  read_file: readFileTool,
  read: readFileTool,
  
  write_file: writeFileTool,
  write: writeFileTool,

  edit_file: editFileTool,
  edit: editFileTool,

  bash: bashTool,
};

/**
 * Central tool executor called by the agent loop
 */
export async function executeTool(name: string, args: any, podName: string): Promise<string> {
  const toolFn = toolRegistry[name];

  if (!toolFn) {
    return JSON.stringify({ error: `Tool '${name}' is not supported in the tool registry.` });
  }

  try {
    return await toolFn(args, podName);
  } catch (err: any) {
    return JSON.stringify({ error: `Execution error in tool '${name}': ${err.message}` });
  }
}
