import type { ChatCompletionTool } from "openai/resources";

export const tools : ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "Read_file",
            description: "Reads the content in the file at a given path",
            parameters: {
                type: "object",
                properties: {
                    file_path:{
                        type: "string",
                        description: "Absolute path to the file to read"
                    }
                },
                required: ["file_path"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "write_file",
            description: "Write the content in the file at a given path (create or overwrites)",
            parameters: {
                type: "object",
                properties: {
                    file_path: {
                        type: "string",
                        description:"Absolute path to the file to write",
                    },
                    content: {
                        type: "string",
                        description: "Content to write to the file"
                    }
                },
                required: ["file_path", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "bash",
            description: "Executes a bash command in the terminal and returns the output for example- ls, cd, pwd etcetra",
            parameters: {
                type: "object",
                properties: {
                    command: {
                        type: "string",
                        description: "The bash command to execute (e.g.: ls, pwd, mkdir, grep, npm run dev, git commands)"
                    },
                    workdir: {
                        type: "string",
                        description: "Working directory for the command"
                    }
                },
                required: ["command","workdir"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "edit_file",
            description: "Perform the precise text replacement in a file. Finds the exact old_string and replaces with new_string.",
            parameters: {
                type: "object",
                properties:{
                    file_path: {
                        type: "string",
                        description: "Absolute path to the file to edit",
                    },
                    old_string: {
                        type: "string",
                        description: "The exact text to search for (must be unique in the file)",
                    },
                    new_string: {
                        type: "string",
                        description: "The replacement text",
                    },
                },
                required: ["file_path", "old_string", "new_string"]
            }
        }
    }
]
