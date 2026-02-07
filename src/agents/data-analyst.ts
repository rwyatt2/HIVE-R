
import { createTrackedLLM } from "../middleware/cost-tracking.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
import { HIVE_PREAMBLE, CONTEXT_PROTOCOL } from "../lib/prompts.js";
import { webSearchTool, fetchUrlTool } from "../tools/web.js";
import { safeAgentCall, createAgentResponse } from "../lib/utils.js";
import { logger } from "../lib/logger.js";

const llm = createTrackedLLM("DataAnalyst", {
    modelName: "gpt-4o",
    temperature: 0.2,
});

// ✅ A+ Feature: Bind research tools to Data Analyst
const tools = [webSearchTool, fetchUrlTool];
const llmWithTools = llm.bindTools(tools);

const DATA_ANALYST_PROMPT = `${HIVE_PREAMBLE}

You are ** The Data Analyst ** — you turn noise into signal.

## Your Tools
    - ** web_search **: Research industry benchmarks, competitor metrics, analytics best practices
        - ** fetch_url **: Retrieve specific data sources or reports

Use these tools to back your recommendations with data.

## Your Expertise
    - Product analytics that answers "is this working?"
        - SQL fluency
            - A / B test design and statistical analysis
                - Funnel analysis and conversion optimization
                    - Dashboard design that executives actually use

## Your Voice
You're the antidote to opinion-based decisions. You ask:
    - "What does the data say?"
    - "Is this statistically significant?"
    - "What's the baseline?"

## Your Output
1. ** Key Metrics **: What to track and why
2. ** Data Requirements **: What we need to collect
3. ** Analysis Plan **: How to interpret results
4. ** Success Criteria **: What numbers mean we won
5. ** Dashboard Design **: What to visualize

${CONTEXT_PROTOCOL} `;

export const dataAnalystNode = async (state: typeof AgentState.State) => {
    const messages = state.messages;

    try {
        const response = await llmWithTools.invoke([
            new SystemMessage(DATA_ANALYST_PROMPT),
            ...messages,
        ]);

        // Handle tool calls
        if (response.tool_calls && response.tool_calls.length > 0) {
            const toolResults: string[] = [];

            for (const toolCall of response.tool_calls) {
                let result: string;

                try {
                    switch (toolCall.name) {
                        case "web_search":
                            result = await webSearchTool.invoke(toolCall.args as { query: string; maxResults?: number });
                            break;
                        case "fetch_url":
                            result = await fetchUrlTool.invoke(toolCall.args as { url: string; extractText?: boolean });
                            break;
                        default:
                            result = `Unknown tool: ${toolCall.name} `;
                    }
                } catch (toolError) {
                    result = `Tool error: ${toolError instanceof Error ? toolError.message : "Unknown error"} `;
                }

                toolResults.push(`** ${toolCall.name}**: \n${result} `);
            }

            return {
                messages: [
                    new HumanMessage({
                        content: `${response.content} \n\n-- -\n ** Research Data:**\n${toolResults.join("\n\n")} `,
                        name: "DataAnalyst",
                    }),
                ],
                contributors: ["DataAnalyst"],
            };
        }

        return {
            messages: [
                new HumanMessage({
                    content: response.content,
                    name: "DataAnalyst",
                }),
            ],
            contributors: ["DataAnalyst"],
        };
    } catch (error) {
        logger.error({ err: error, agentName: "DataAnalyst" }, "DataAnalyst failed");
        return {
            messages: [
                new HumanMessage({
                    content: `** [DataAnalyst Error] **: ${error instanceof Error ? error.message : "Unknown error"} `,
                    name: "DataAnalyst",
                }),
            ],
            contributors: ["DataAnalyst"],
        };
    }
};
