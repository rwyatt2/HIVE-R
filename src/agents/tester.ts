import { createTrackedLLM } from "../middleware/cost-tracking.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
import { HIVE_PREAMBLE, CONTEXT_PROTOCOL } from "../lib/prompts.js";
import { TestPlanSchema } from "../lib/artifacts.js";
import { runCommandTool, runTestsTool } from "../tools/testing.js";

const llm = createTrackedLLM("Tester", {
    modelName: "gpt-4o",
    temperature: 0.2,
});

const tools = [runCommandTool, runTestsTool];
const llmWithTools = llm.bindTools(tools);

const TESTER_PROMPT = `${HIVE_PREAMBLE}

You are **Testsprite, The Tester** — a Staff QA Engineer who finds bugs others miss.

## Your Tools
- **run_command**: Execute any shell command
- **run_tests**: Run test suites (Jest, Vitest, Playwright, Mocha)

## Your Output Format
When creating a test plan, respond with JSON:
{
  "type": "TestPlan",
  "title": "Test Plan: [Feature]",
  "strategy": "Overall testing approach",
  "testCases": [
    {
      "id": "TC-001",
      "description": "What we're testing",
      "preconditions": ["Setup required"],
      "steps": ["Step 1", "Step 2"],
      "expectedResult": "What should happen",
      "priority": "P0" | "P1" | "P2"
    }
  ],
  "edgeCases": ["Edge case to cover"],
  "automationPlan": ["What to automate"],
  "manualTestingNotes": ["Manual testing guidance"]
}

${CONTEXT_PROTOCOL}`;

export const testerNode = async (state: typeof AgentState.State) => {
    const messages = state.messages;

    try {
        // First, try to get structured test plan
        const structuredLlm = llm.withStructuredOutput(TestPlanSchema);

        let artifact;
        try {
            artifact = await structuredLlm.invoke([
                new SystemMessage(TESTER_PROMPT),
                ...messages,
            ]);
        } catch {
            // Fall back to regular response if structured output fails
            const response = await llmWithTools.invoke([
                new SystemMessage(TESTER_PROMPT),
                ...messages,
            ]);

            // Handle tool calls
            if (response.tool_calls && response.tool_calls.length > 0) {
                const toolResults: string[] = [];

                for (const toolCall of response.tool_calls) {
                    let result: string;

                    try {
                        switch (toolCall.name) {
                            case "run_command":
                                result = await runCommandTool.invoke(toolCall.args as { command: string; cwd?: string });
                                break;
                            case "run_tests":
                                result = await runTestsTool.invoke(toolCall.args as { testPath?: string; framework?: "jest" | "vitest" | "playwright" | "mocha" });
                                break;
                            default:
                                result = `Unknown tool: ${toolCall.name}`;
                        }
                    } catch (toolError) {
                        result = `Tool error: ${toolError instanceof Error ? toolError.message : "Unknown error"}`;
                    }

                    toolResults.push(`Tool ${toolCall.name}:\n${result}`);
                }

                return {
                    messages: [
                        new HumanMessage({
                            content: `${response.content}\n\n**Test Results:**\n${toolResults.join("\n\n")}`,
                            name: "Tester",
                        }),
                    ],
                    contributors: ["Tester"],
                };
            }

            return {
                messages: [
                    new HumanMessage({
                        content: response.content,
                        name: "Tester",
                    }),
                ],
                contributors: ["Tester"],
            };
        }

        // Format structured test plan
        const formattedContent = `# ${artifact.title}

## Strategy
${artifact.strategy}

## Test Cases
${artifact.testCases.map(tc => `
### ${tc.id}: ${tc.description} [${tc.priority}]

**Preconditions:**
${tc.preconditions.map(p => `- ${p}`).join("\n")}

**Steps:**
${tc.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

**Expected Result:** ${tc.expectedResult}
`).join("")}

## Edge Cases
${artifact.edgeCases.map(e => `- ${e}`).join("\n")}

## Automation Plan
${artifact.automationPlan.map(a => `- ${a}`).join("\n")}

## Manual Testing Notes
${artifact.manualTestingNotes.map(n => `- ${n}`).join("\n")}`;

        return {
            messages: [
                new HumanMessage({
                    content: formattedContent,
                    name: "Tester",
                }),
            ],
            artifacts: [artifact],
            contributors: ["Tester"],
        };
    } catch (error) {
        console.error("❌ Tester failed:", error);
        return {
            messages: [
                new HumanMessage({
                    content: `**[Tester Error]**: I encountered an error. ${error instanceof Error ? error.message : "Unknown error"}`,
                    name: "Tester",
                }),
            ],
            contributors: ["Tester"],
        };
    }
};
