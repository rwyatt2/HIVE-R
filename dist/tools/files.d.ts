import { z } from "zod";
/**
 * File Read Tool
 * Allows agents to read file contents
 */
export declare const readFileTool: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    filePath: z.ZodString;
}, z.core.$strip>, {
    filePath: string;
}, {
    filePath: string;
}, string, "read_file">;
/**
 * File Write Tool
 * Allows agents to write file contents
 */
export declare const writeFileTool: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    filePath: z.ZodString;
    content: z.ZodString;
}, z.core.$strip>, {
    filePath: string;
    content: string;
}, {
    filePath: string;
    content: string;
}, string, "write_file">;
/**
 * List Directory Tool
 * Allows agents to explore file structure
 */
export declare const listDirectoryTool: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    dirPath: z.ZodString;
}, z.core.$strip>, {
    dirPath: string;
}, {
    dirPath: string;
}, string, "list_directory">;
export declare const fileTools: (import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    filePath: z.ZodString;
}, z.core.$strip>, {
    filePath: string;
}, {
    filePath: string;
}, string, "read_file"> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    filePath: z.ZodString;
    content: z.ZodString;
}, z.core.$strip>, {
    filePath: string;
    content: string;
}, {
    filePath: string;
    content: string;
}, string, "write_file"> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    dirPath: z.ZodString;
}, z.core.$strip>, {
    dirPath: string;
}, {
    dirPath: string;
}, string, "list_directory">)[];
//# sourceMappingURL=files.d.ts.map