import { createTrackedLLM } from "../middleware/cost-tracking.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
import { HIVE_PREAMBLE, CONTEXT_PROTOCOL } from "../lib/prompts.js";
import { PRDArtifactSchema, type PRDArtifact } from "../lib/artifacts.js";
import { safeAgentCall, createAgentResponse } from "../lib/utils.js";
import { logger } from "../lib/logger.js";

const llm = createTrackedLLM("ProductManager", {
    modelName: "gpt-4o",
    temperature: 0.3,
});

const PM_PROMPT = `${HIVE_PREAMBLE}

You are **The Product Manager** — the PM who shipped at Stripe, Figma, and Linear. You turn vision into executable reality.

## Your Expertise
- Translating founder vision into actionable requirements
- Writing PRDs that engineers actually read
- User stories with crystal-clear acceptance criteria  
- Ruthless prioritization (RICE, ICE, value vs effort)
- Identifying edge cases before they become fires
- Stakeholder alignment without endless meetings

## Your Voice
You communicate with surgical precision. You hate ambiguity and kill it wherever you find it.

## Your Output Format
You MUST respond with a structured PRD in JSON format:
{
  "type": "PRD",
  "title": "Feature title",
  "goal": "One sentence on what we're solving",
  "successMetrics": ["How we'll measure success"],
  "userStories": [
    {
      "id": "US-001",
      "title": "Story title",
      "asA": "Type of user",
      "iWant": "Goal",
      "soThat": "Benefit",
      "acceptanceCriteria": ["Specific testable conditions"],
      "priority": "P0" | "P1" | "P2" | "P3"
    }
  ],
  "outOfScope": ["What we're NOT doing"],
  "openQuestions": ["Decisions that need input"]
}

${CONTEXT_PROTOCOL}`;

export const productManagerNode = async (state: typeof AgentState.State) => {
    const messages = state.messages;

    try {
        // ✅ A+ Feature: Structured output with Zod schema
        const structuredLlm = llm.withStructuredOutput(PRDArtifactSchema);

        const artifact = await structuredLlm.invoke([
            new SystemMessage(PM_PROMPT),
            ...messages,
        ]);

        // Format for human-readable message
        const formattedContent = `# PRD: ${artifact.title}

## Goal
${artifact.goal}

## Success Metrics
${artifact.successMetrics.map(m => `- ${m}`).join("\n")}

## User Stories
${artifact.userStories.map(us => `
### ${us.id}: ${us.title} [${us.priority}]
**As a** ${us.asA}
**I want** ${us.iWant}
**So that** ${us.soThat}

**Acceptance Criteria:**
${us.acceptanceCriteria.map(ac => `- [ ] ${ac}`).join("\n")}
`).join("\n")}

## Out of Scope
${artifact.outOfScope.map(o => `- ${o}`).join("\n")}

## Open Questions
${artifact.openQuestions.map(q => `- ${q}`).join("\n")}`;

        return {
            messages: [
                new HumanMessage({
                    content: formattedContent,
                    name: "ProductManager",
                }),
            ],
            artifacts: [artifact],
            contributors: ["ProductManager"],
        };
    } catch (error) {
        logger.error({ err: error, agentName: "ProductManager" }, "ProductManager failed");
        return {
            messages: [
                new HumanMessage({
                    content: `**[ProductManager Error]**: I encountered an error creating the PRD. ${error instanceof Error ? error.message : "Unknown error"}`,
                    name: "ProductManager",
                }),
            ],
            contributors: ["ProductManager"],
        };
    }
};
