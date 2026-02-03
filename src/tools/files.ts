import { tool } from "@langchain/core/tools";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";

// ============================================================================
// WORKSPACE CONFIGURATION
// ============================================================================

/**
 * Get the configured workspace directory.
 * Files are restricted to this directory for safety.
 */
const WORKSPACE = process.env.HIVE_WORKSPACE || process.cwd();

/**
 * Resolve a file path within the workspace.
 * Prevents path traversal attacks.
 */
function resolveSafePath(filePath: string): { safe: boolean; resolved: string; error?: string } {
    // If absolute path, validate it's within workspace
    const resolved = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(WORKSPACE, filePath);

    // Check if resolved path is within workspace
    if (!resolved.startsWith(WORKSPACE)) {
        return {
            safe: false,
            resolved,
            error: `Path '${filePath}' is outside workspace '${WORKSPACE}'`
        };
    }

    return { safe: true, resolved };
}

// ============================================================================
// FILE TOOLS
// ============================================================================

/**
 * File Read Tool
 * Allows agents to read file contents within workspace
 */
export const readFileTool = tool(
    async ({ filePath }) => {
        const { safe, resolved, error } = resolveSafePath(filePath);
        if (!safe) {
            return `Error: ${error}`;
        }

        try {
            const content = await fs.readFile(resolved, "utf-8");
            return `File contents of ${resolved}:\n\n${content}`;
        } catch (err) {
            return `Error reading file: ${err instanceof Error ? err.message : "Unknown error"}`;
        }
    },
    {
        name: "read_file",
        description: `Read the contents of a file. Files are relative to workspace: ${WORKSPACE}`,
        schema: z.object({
            filePath: z.string().describe("Path to the file (relative to workspace or absolute)"),
        }),
    }
);

/**
 * File Write Tool
 * Allows agents to write file contents within workspace
 */
export const writeFileTool = tool(
    async ({ filePath, content }) => {
        const { safe, resolved, error } = resolveSafePath(filePath);
        if (!safe) {
            return `Error: ${error}`;
        }

        try {
            // Ensure directory exists
            const dir = path.dirname(resolved);
            await fs.mkdir(dir, { recursive: true });

            await fs.writeFile(resolved, content, "utf-8");
            return `Successfully wrote ${content.length} characters to ${resolved}`;
        } catch (err) {
            return `Error writing file: ${err instanceof Error ? err.message : "Unknown error"}`;
        }
    },
    {
        name: "write_file",
        description: `Write content to a file. Files are relative to workspace: ${WORKSPACE}`,
        schema: z.object({
            filePath: z.string().describe("Path to the file (relative to workspace or absolute)"),
            content: z.string().describe("The content to write to the file"),
        }),
    }
);

/**
 * List Directory Tool
 * Allows agents to explore file structure within workspace
 */
export const listDirectoryTool = tool(
    async ({ dirPath }) => {
        const { safe, resolved, error } = resolveSafePath(dirPath || ".");
        if (!safe) {
            return `Error: ${error}`;
        }

        try {
            const entries = await fs.readdir(resolved, { withFileTypes: true });
            const formatted = entries.map(entry => {
                const type = entry.isDirectory() ? "📁" : "📄";
                return `${type} ${entry.name}`;
            }).join("\n");
            return `Contents of ${resolved}:\n\n${formatted}`;
        } catch (err) {
            return `Error listing directory: ${err instanceof Error ? err.message : "Unknown error"}`;
        }
    },
    {
        name: "list_directory",
        description: `List contents of a directory. Defaults to workspace: ${WORKSPACE}`,
        schema: z.object({
            dirPath: z.string().optional().describe("Path to directory (relative to workspace, defaults to workspace root)"),
        }),
    }
);

// Export all file tools
export const fileTools = [readFileTool, writeFileTool, listDirectoryTool];

// Export workspace for reference
export { WORKSPACE };

