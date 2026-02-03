import { z } from "zod";
/**
 * Run Command Tool
 * Execute shell commands for testing
 */
export declare const runCommandTool: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    command: z.ZodString;
    cwd: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, {
    command: string;
    cwd?: string | undefined;
}, {
    command: string;
    cwd?: string | undefined;
}, string, "run_command">;
/**
 * Run Tests Tool
 * Specifically for running test suites
 */
export declare const runTestsTool: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    testPath: z.ZodOptional<z.ZodString>;
    framework: z.ZodDefault<z.ZodEnum<{
        jest: "jest";
        vitest: "vitest";
        playwright: "playwright";
        mocha: "mocha";
    }>>;
}, z.core.$strip>, {
    framework: "jest" | "vitest" | "playwright" | "mocha";
    testPath?: string | undefined;
}, {
    testPath?: string | undefined;
    framework?: "jest" | "vitest" | "playwright" | "mocha" | undefined;
}, string, "run_tests">;
export declare const testTools: (import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    command: z.ZodString;
    cwd: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, {
    command: string;
    cwd?: string | undefined;
}, {
    command: string;
    cwd?: string | undefined;
}, string, "run_command"> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    testPath: z.ZodOptional<z.ZodString>;
    framework: z.ZodDefault<z.ZodEnum<{
        jest: "jest";
        vitest: "vitest";
        playwright: "playwright";
        mocha: "mocha";
    }>>;
}, z.core.$strip>, {
    framework: "jest" | "vitest" | "playwright" | "mocha";
    testPath?: string | undefined;
}, {
    testPath?: string | undefined;
    framework?: "jest" | "vitest" | "playwright" | "mocha" | undefined;
}, string, "run_tests">)[];
//# sourceMappingURL=testing.d.ts.map