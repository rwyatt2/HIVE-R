
import { createTrackedLLM } from "../middleware/cost-tracking.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
import { HIVE_PREAMBLE, CONTEXT_PROTOCOL } from "../lib/prompts.js";
import { webSearchTool, fetchUrlTool } from "../tools/web.js";
import { safeAgentCall, createAgentResponse } from "../lib/utils.js";
import { logger } from "../lib/logger.js";

const llm = createTrackedLLM("UXResearcher", {
    modelName: "gpt-4o",
    temperature: 0.4,
});

// ✅ A+ Feature: Bind research tools to UX Researcher
const tools = [webSearchTool, fetchUrlTool];
const llmWithTools = llm.bindTools(tools);

const UX_RESEARCHER_PROMPT = `${HIVE_PREAMBLE}

You are ** The UX Researcher ** — the person who stops teams from building things nobody wants.

## Your Tools
    - ** web_search **: Search for user research, competitor analysis, industry trends
        - ** fetch_url **: Retrieve content from specific URLs for deeper analysis

Use these tools to gather real insights, not just hypothesize.

## Your Expertise
    - User interview design that uncovers real behavior
        - Usability testing methodologies
            - Survey design that gets honest answers
                - Journey mapping and jobs - to - be - done frameworks
                    - Competitive analysis

## Your Voice
You trust behavior over opinions.You ask uncomfortable questions like:
- "Have we actually talked to users about this?"
    - "What's our evidence that users want this?"

## Your Output
    - ** Research Questions **: What we need to learn
        - ** Assumptions at Risk **: Beliefs without evidence
            - ** Recommended Studies **: Specific research activities
                - ** Quick Wins **: What we can learn in 48 hours

${CONTEXT_PROTOCOL} `;

export const uxResearcherNode = async (state: typeof AgentState.State) => {
    const messages = state.messages;

    try {
        const response = await llmWithTools.invoke([
            new SystemMessage(UX_RESEARCHER_PROMPT),
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
                        content: `${response.content} \n\n-- -\n ** Research Results:**\n${toolResults.join("\n\n")} `,
                        name: "UXResearcher",
                    }),
                ],
                contributors: ["UXResearcher"],
            };
        }

        return {
            messages: [
                new HumanMessage({
                    content: response.content,
                    name: "UXResearcher",
                }),
            ],
            contributors: ["UXResearcher"],
        };
    } catch (error) {
        logger.error({ err: error, agentName: "UXResearcher" }, "UXResearcher failed");
        return {
            messages: [
                new HumanMessage({
                    content: `** [UXResearcher Error] **: ${error instanceof Error ? error.message : "Unknown error"} `,
                    name: "UXResearcher",
                }),
            ],
            contributors: ["UXResearcher"],
        };
    }
};
