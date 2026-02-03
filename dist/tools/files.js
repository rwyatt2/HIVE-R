import { tool } from "@langchain/core/tools";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
/**
 * File Read Tool
 * Allows agents to read file contents
 */
export const readFileTool = tool(async ({ filePath }) => {
    try {
        const content = await fs.readFile(filePath, "utf-8");
        return `File contents of ${filePath}:\n\n${content}`;
    }
    catch (error) {
        return `Error reading file: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
}, {
    name: "read_file",
    description: "Read the contents of a file at the given path",
    schema: z.object({
        filePath: z.string().describe("The absolute path to the file to read"),
    }),
});
/**
 * File Write Tool
 * Allows agents to write file contents
 */
export const writeFileTool = tool(async ({ filePath, content }) => {
    try {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, content, "utf-8");
        return `Successfully wrote ${content.length} characters to ${filePath}`;
    }
    catch (error) {
        return `Error writing file: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
}, {
    name: "write_file",
    description: "Write content to a file at the given path. Creates directories if needed.",
    schema: z.object({
        filePath: z.string().describe("The absolute path to the file to write"),
        content: z.string().describe("The content to write to the file"),
    }),
});
/**
 * List Directory Tool
 * Allows agents to explore file structure
 */
export const listDirectoryTool = tool(async ({ dirPath }) => {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const formatted = entries.map(entry => {
            const type = entry.isDirectory() ? "📁" : "📄";
            return `${type} ${entry.name}`;
        }).join("\n");
        return `Contents of ${dirPath}:\n\n${formatted}`;
    }
    catch (error) {
        return `Error listing directory: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
}, {
    name: "list_directory",
    description: "List the contents of a directory",
    schema: z.object({
        dirPath: z.string().describe("The absolute path to the directory to list"),
    }),
});
// Export all file tools
export const fileTools = [readFileTool, writeFileTool, listDirectoryTool];
//# sourceMappingURL=files.js.map