import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
import { HIVE_PREAMBLE, CONTEXT_PROTOCOL } from "../lib/prompts.js";
import { SecurityReviewSchema } from "../lib/artifacts.js";

const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.1,
});

const SECURITY_PROMPT = `${HIVE_PREAMBLE}

You are **The Security Engineer** — a former red-team lead who's seen every attack. You think like an attacker to build like a defender.

## Your Expertise
- Threat modeling (STRIDE, attack trees, kill chains)
- OWASP Top 10 and CWE — you know the numbers by heart
- Authentication & authorization design

## Your Output Format
You MUST respond with a structured SecurityReview in JSON format:
{
  "type": "SecurityReview",
  "title": "Security Review: [Feature Name]",
  "threatModel": [
    {
      "threat": "Description of threat",
      "attackVector": "How attacker would exploit",
      "impact": "low" | "medium" | "high" | "critical",
      "likelihood": "low" | "medium" | "high"
    }
  ],
  "vulnerabilities": [
    {
      "id": "VULN-001",
      "description": "What's wrong",
      "severity": "low" | "medium" | "high" | "critical",
      "recommendation": "How to fix"
    }
  ],
  "requirements": ["Security requirements"],
  "complianceNotes": ["Regulatory considerations"]
}

${CONTEXT_PROTOCOL}`;

export const securityNode = async (state: typeof AgentState.State) => {
    const messages = state.messages;

    try {
        const structuredLlm = llm.withStructuredOutput(SecurityReviewSchema);

        const artifact = await structuredLlm.invoke([
            new SystemMessage(SECURITY_PROMPT),
            ...messages,
        ]);

        const formattedContent = `# ${artifact.title}

## Threat Model
${artifact.threatModel.map(t => `
### ${t.threat}
- **Attack Vector**: ${t.attackVector}
- **Impact**: ${t.impact.toUpperCase()}
- **Likelihood**: ${t.likelihood.toUpperCase()}
`).join("")}

## Vulnerabilities
${artifact.vulnerabilities.map(v => `
### ${v.id}: ${v.description} [${v.severity.toUpperCase()}]
**Recommendation**: ${v.recommendation}
`).join("")}

## Security Requirements
${artifact.requirements.map(r => `- ${r}`).join("\n")}

## Compliance Notes
${artifact.complianceNotes.map(n => `- ${n}`).join("\n")}`;

        return {
            messages: [
                new HumanMessage({
                    content: formattedContent,
                    name: "Security",
                }),
            ],
            artifacts: [artifact],
            contributors: ["Security"],
        };
    } catch (error) {
        console.error("❌ Security failed:", error);
        return {
            messages: [
                new HumanMessage({
                    content: `**[Security Error]**: I encountered an error during security review. ${error instanceof Error ? error.message : "Unknown error"}`,
                    name: "Security",
                }),
            ],
            contributors: ["Security"],
        };
    }
};
