import { createTrackedLLM } from "../middleware/cost-tracking.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
import { HIVE_PREAMBLE, CONTEXT_PROTOCOL } from "../lib/prompts.js";
import { CodeReviewSchema } from "../lib/artifacts.js";
import { safeAgentCall, createAgentResponse } from "../lib/utils.js";
import { logger } from "../lib/logger.js";

const llm = createTrackedLLM("Reviewer", {
    modelName: "gpt-4o",
    temperature: 0.1,
});

const REVIEWER_PROMPT = `${HIVE_PREAMBLE}

You are **The Reviewer** — a distinguished engineer with 20 years of production experience.

## Your Review Criteria
- **Correctness**: Does it actually do what it's supposed to?
- **Clarity**: Can someone understand this at 3am during an outage?
- **Architecture**: Is the design sound?
- **Security**: Any vulnerabilities?

## Your Output Format
You MUST respond with a structured CodeReview in JSON format:
{
  "type": "CodeReview",
  "verdict": "approve" | "request_changes" | "needs_discussion",
  "summary": "Overall quality assessment in 2 sentences",
  "mustFix": [
    {
      "location": "file:line or component",
      "issue": "What's wrong",
      "suggestion": "How to fix"
    }
  ],
  "shouldFix": [
    {
      "location": "file:line or component",
      "issue": "What could be better",
      "suggestion": "How to improve"
    }
  ],
  "nits": ["Style/preference tweaks"],
  "praise": ["Things done well"]
}

${CONTEXT_PROTOCOL}`;

export const reviewerNode = async (state: typeof AgentState.State) => {
    const messages = state.messages;

    try {
        const structuredLlm = llm.withStructuredOutput(CodeReviewSchema);

        const artifact = await structuredLlm.invoke([
            new SystemMessage(REVIEWER_PROMPT),
            ...messages,
        ]);

        const verdictEmoji = artifact.verdict === "approve" ? "✅" :
            artifact.verdict === "request_changes" ? "🔄" : "💬";

        const formattedContent = `# Code Review ${verdictEmoji}

## Verdict: ${artifact.verdict.replace("_", " ").toUpperCase()}

## Summary
${artifact.summary}

${artifact.mustFix.length > 0 ? `## Must Fix 🚨
${artifact.mustFix.map(f => `
### ${f.location}
- **Issue**: ${f.issue}
- **Suggestion**: ${f.suggestion}
`).join("")}` : ""}

${artifact.shouldFix.length > 0 ? `## Should Fix ⚠️
${artifact.shouldFix.map(f => `
### ${f.location}
- **Issue**: ${f.issue}
- **Suggestion**: ${f.suggestion}
`).join("")}` : ""}

${artifact.nits.length > 0 ? `## Nits 📝
${artifact.nits.map(n => `- ${n}`).join("\n")}` : ""}

## Praise 🎉
${artifact.praise.map(p => `- ${p}`).join("\n")}`;

        return {
            messages: [
                new HumanMessage({
                    content: formattedContent,
                    name: "Reviewer",
                }),
            ],
            artifacts: [artifact],
            contributors: ["Reviewer"],
        };
    } catch (error) {
        logger.error({ err: error, agentName: "Reviewer" }, "Reviewer failed");
        return {
            messages: [
                new HumanMessage({
                    content: `**[Reviewer Error]**: I encountered an error during code review. ${error instanceof Error ? error.message : "Unknown error"}`,
                    name: "Reviewer",
                }),
            ],
            contributors: ["Reviewer"],
        };
    }
};
