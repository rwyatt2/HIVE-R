import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
import { HIVE_PREAMBLE, CONTEXT_PROTOCOL } from "../lib/prompts.js";
import { readFileTool, writeFileTool, listDirectoryTool } from "../tools/files.js";
import { runCommandTool } from "../tools/testing.js";

const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.2,
});

// Create a tools array for binding to the LLM
const tools = [readFileTool, writeFileTool, listDirectoryTool, runCommandTool];
const llmWithTools = llm.bindTools(tools);

const MAX_RETRIES = 3;

const BUILDER_PROMPT = `${HIVE_PREAMBLE}

You are **Claude, The Builder** — a distinguished software engineer who writes code that reads like poetry. Your PRs get approved on the first review.

## Your Tools
You have access to these tools:
- **read_file**: Read contents of a file
- **write_file**: Create or update a file
- **list_directory**: See what files exist
- **run_command**: Execute shell commands (tests, linting, etc.)

Use these tools to actually implement code AND verify it works.

## Self-Loop Protocol
After implementing code:
1. Run tests or a verification command
2. If tests fail, analyze the error and fix the code
3. Repeat until tests pass or you've tried ${MAX_RETRIES} times

## Your Expertise
- Writing production-ready code that works the first time
- TypeScript, JavaScript, Python, Go, and modern frameworks
- SOLID principles applied pragmatically, not dogmatically
- API design that's intuitive and hard to misuse  
- Database schemas that won't need migration in 6 months
- Error handling that actually handles errors
- Self-documenting code with strategic comments

## Your Voice
You write code that is:
- **Correct**: It works exactly as specified
- **Clear**: A junior dev can understand it at 2am during an incident
- **Concise**: No unnecessary abstraction, no premature optimization
- **Complete**: Edge cases, errors, and validation handled

When given a spec, you implement it fully using your tools. If something is ambiguous, you make a reasonable choice and note your assumption explicitly.

## Your Output
When producing code:
1. **Approach**: Brief explanation of key decisions
2. **Implementation**: Use write_file to create the actual files
3. **Verification**: Use run_command to verify the code works
4. **Status**: Report SUCCESS or NEEDS_RETRY with reason

${CONTEXT_PROTOCOL}`;

/**
 * Detects if tool results indicate a failure that needs retry
 */
function detectFailure(toolResults: string[]): { failed: boolean; error: string | null } {
    const failurePatterns = [
        /error:/i,
        /failed:/i,
        /exception:/i,
        /FAIL/,
        /ERR!/,
        /Cannot find/i,
        /not found/i,
        /syntax error/i,
        /TypeError/i,
        /ReferenceError/i,
    ];

    for (const result of toolResults) {
        for (const pattern of failurePatterns) {
            if (pattern.test(result)) {
                return { failed: true, error: result };
            }
        }
    }

    return { failed: false, error: null };
}

export const builderNode = async (state: typeof AgentState.State) => {
    const messages = state.messages;
    const currentRetries = state.agentRetries?.["Builder"] ?? 0;
    const lastError = state.lastError;

    // Check if we've exceeded retries
    if (currentRetries >= MAX_RETRIES) {
        console.log(`⚠️ Builder: Max retries (${MAX_RETRIES}) reached, handing off`);
        return {
            messages: [
                new HumanMessage({
                    content: `**[Builder]**: I've attempted to fix the code ${MAX_RETRIES} times but am still encountering issues. Here's the last error:\n\n${lastError}\n\nI recommend manual review or additional guidance.`,
                    name: "Builder",
                }),
            ],
            contributors: ["Builder"],
            needsRetry: false,
            agentRetries: { Builder: 0 }, // Reset for next task
        };
    }

    // If retrying, add context about the previous failure
    const retryContext = currentRetries > 0 && lastError
        ? `\n\n**RETRY CONTEXT (Attempt ${currentRetries + 1}/${MAX_RETRIES})**:\nPrevious attempt failed with:\n${lastError}\n\nPlease analyze and fix the issue.`
        : "";

    try {
        const response = await llmWithTools.invoke([
            new SystemMessage(BUILDER_PROMPT + retryContext),
            ...messages,
        ]);

        // Handle tool calls if present
        if (response.tool_calls && response.tool_calls.length > 0) {
            const toolResults: string[] = [];

            for (const toolCall of response.tool_calls) {
                let result: string;

                try {
                    switch (toolCall.name) {
                        case "read_file":
                            result = await readFileTool.invoke(toolCall.args as { filePath: string });
                            break;
                        case "write_file":
                            result = await writeFileTool.invoke(toolCall.args as { filePath: string; content: string });
                            break;
                        case "list_directory":
                            result = await listDirectoryTool.invoke(toolCall.args as { dirPath: string });
                            break;
                        case "run_command":
                            result = await runCommandTool.invoke(toolCall.args as { command: string; cwd?: string });
                            break;
                        default:
                            result = `Unknown tool: ${toolCall.name}`;
                    }
                } catch (toolError) {
                    result = `Tool error: ${toolError instanceof Error ? toolError.message : "Unknown error"}`;
                }

                toolResults.push(`Tool ${toolCall.name}: ${result}`);
            }

            // Check if any tool result indicates failure
            const { failed, error } = detectFailure(toolResults);

            if (failed) {
                console.log(`🔄 Builder: Detected failure, retry ${currentRetries + 1}/${MAX_RETRIES}`);
                return {
                    messages: [
                        new HumanMessage({
                            content: `${response.content}\n\n**Tool Results:**\n${toolResults.join("\n")}\n\n**STATUS: NEEDS_RETRY**`,
                            name: "Builder",
                        }),
                    ],
                    contributors: ["Builder"],
                    needsRetry: true,
                    agentRetries: { Builder: currentRetries + 1 },
                    lastError: error,
                };
            }

            // Success!
            console.log(`✅ Builder: Task completed successfully`);
            return {
                messages: [
                    new HumanMessage({
                        content: `${response.content}\n\n**Tool Results:**\n${toolResults.join("\n")}\n\n**STATUS: SUCCESS**`,
                        name: "Builder",
                    }),
                ],
                contributors: ["Builder"],
                needsRetry: false,
                agentRetries: { Builder: 0 }, // Reset
            };
        }

        return {
            messages: [
                new HumanMessage({
                    content: response.content,
                    name: "Builder",
                }),
            ],
            contributors: ["Builder"],
            needsRetry: false,
        };
    } catch (error) {
        console.error("❌ Builder failed:", error);
        return {
            messages: [
                new HumanMessage({
                    content: `**[Builder Error]**: I encountered an error during implementation. ${error instanceof Error ? error.message : "Unknown error"}`,
                    name: "Builder",
                }),
            ],
            contributors: ["Builder"],
            needsRetry: false,
            lastError: error instanceof Error ? error.message : "Unknown error",
        };
    }
};
