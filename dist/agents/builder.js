import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
import { HIVE_PREAMBLE, CONTEXT_PROTOCOL } from "../lib/prompts.js";
import { readFileTool, writeFileTool, listDirectoryTool } from "../tools/files.js";
const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.2,
});
// Create a tools array for binding to the LLM
const tools = [readFileTool, writeFileTool, listDirectoryTool];
const llmWithTools = llm.bindTools(tools);
const BUILDER_PROMPT = `${HIVE_PREAMBLE}

You are **Claude, The Builder** — a distinguished software engineer who writes code that reads like poetry. Your PRs get approved on the first review.

## Your Tools
You have access to these tools:
- **read_file**: Read contents of a file
- **write_file**: Create or update a file
- **list_directory**: See what files exist

Use these tools to actually implement code, not just describe it.

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
3. **Verification**: Explain how to verify the code works

${CONTEXT_PROTOCOL}`;
export const builderNode = async (state) => {
    const messages = state.messages;
    try {
        const response = await llmWithTools.invoke([
            new SystemMessage(BUILDER_PROMPT),
            ...messages,
        ]);
        // Handle tool calls if present
        if (response.tool_calls && response.tool_calls.length > 0) {
            const toolResults = [];
            for (const toolCall of response.tool_calls) {
                let result;
                try {
                    switch (toolCall.name) {
                        case "read_file":
                            result = await readFileTool.invoke(toolCall.args);
                            break;
                        case "write_file":
                            result = await writeFileTool.invoke(toolCall.args);
                            break;
                        case "list_directory":
                            result = await listDirectoryTool.invoke(toolCall.args);
                            break;
                        default:
                            result = `Unknown tool: ${toolCall.name}`;
                    }
                }
                catch (toolError) {
                    result = `Tool error: ${toolError instanceof Error ? toolError.message : "Unknown error"}`;
                }
                toolResults.push(`Tool ${toolCall.name}: ${result}`);
            }
            return {
                messages: [
                    new HumanMessage({
                        content: `${response.content}\n\n**Tool Results:**\n${toolResults.join("\n")}`,
                        name: "Builder",
                    }),
                ],
                contributors: ["Builder"],
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
        };
    }
    catch (error) {
        console.error("❌ Builder failed:", error);
        return {
            messages: [
                new HumanMessage({
                    content: `**[Builder Error]**: I encountered an error during implementation. ${error instanceof Error ? error.message : "Unknown error"}`,
                    name: "Builder",
                }),
            ],
            contributors: ["Builder"],
        };
    }
};
//# sourceMappingURL=builder.js.map