import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Run Command Tool
 * Execute shell commands for testing
 */
export const runCommandTool = tool(
    async ({ command, cwd }) => {
        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: cwd || process.cwd(),
                timeout: 30000, // 30 second timeout
            });

            let result = "";
            if (stdout) result += `stdout:\n${stdout}\n`;
            if (stderr) result += `stderr:\n${stderr}\n`;
            return result || "Command completed with no output";
        } catch (error) {
            if (error instanceof Error) {
                return `Command failed: ${error.message}`;
            }
            return "Command failed with unknown error";
        }
    },
    {
        name: "run_command",
        description: "Execute a shell command. Use for running tests, linting, or build commands.",
        schema: z.object({
            command: z.string().describe("The shell command to execute"),
            cwd: z.string().optional().describe("Working directory for the command"),
        }),
    }
);

/**
 * Run Tests Tool
 * Specifically for running test suites
 */
export const runTestsTool = tool(
    async ({ testPath, framework }) => {
        const commands: Record<string, string> = {
            jest: `npx jest ${testPath || ""} --passWithNoTests`,
            vitest: `npx vitest run ${testPath || ""}`,
            playwright: `npx playwright test ${testPath || ""}`,
            mocha: `npx mocha ${testPath || ""}`,
        };

        const selectedFramework = framework ?? "jest";
        const command = commands[selectedFramework] ?? commands.jest;

        try {
            const { stdout, stderr } = await execAsync(command as string, {
                timeout: 60000, // 60 second timeout for tests
            });
            return `Test Results:\n${stdout}\n${stderr}`;
        } catch (error) {
            if (error instanceof Error) {
                // Test failures come as errors, but we want the output
                const execError = error as { stdout?: string; stderr?: string };
                return `Test Results (with failures):\n${execError.stdout || ""}\n${execError.stderr || ""}`;
            }
            return "Tests failed with unknown error";
        }
    },
    {
        name: "run_tests",
        description: "Run automated tests using a specified framework",
        schema: z.object({
            testPath: z.string().optional().describe("Path to specific test file or directory"),
            framework: z.enum(["jest", "vitest", "playwright", "mocha"]).default("jest")
                .describe("The test framework to use"),
        }),
    }
);

// Export all test tools
export const testTools = [runCommandTool, runTestsTool];
