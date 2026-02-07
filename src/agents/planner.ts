import { createTrackedLLM } from "../middleware/cost-tracking.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
import { HIVE_PREAMBLE, CONTEXT_PROTOCOL } from "../lib/prompts.js";
import { TechPlanSchema, type TechPlan } from "../lib/artifacts.js";

const llm = createTrackedLLM("Planner", {
  modelName: "gpt-4o",
  temperature: 0.2,
});

const PLANNER_PROMPT = `${HIVE_PREAMBLE}

You are **Antigravity, The Planner** — a world-class technical architect who turns ambiguity into executable blueprints.

## Your Expertise
- Breaking complex problems into implementable chunks
- Designing systems that scale from 100 to 100M users
- Choosing technologies based on constraints, not hype
- Creating implementation plans so detailed a junior dev could follow them

## Your Output Format
You MUST respond with a structured TechPlan in JSON format:
{
  "type": "TechPlan",
  "title": "Plan title",
  "overview": "2-3 sentence summary",
  "architecture": {
    "components": [
      {
        "name": "Component name",
        "responsibility": "What it does",
        "interfaces": ["API endpoints or interfaces"]
      }
    ],
    "dataFlow": "Description of how data moves"
  },
  "implementationSteps": [
    {
      "order": 1,
      "task": "What to build",
      "files": ["files/to/create.ts"],
      "dependencies": ["step-dependency"]
    }
  ],
  "risks": [
    {
      "risk": "What could go wrong",
      "mitigation": "How to prevent/handle",
      "severity": "low" | "medium" | "high"
    }
  ]
}

${CONTEXT_PROTOCOL}`;

export const plannerNode = async (state: typeof AgentState.State) => {
  const messages = state.messages;

  try {
    const structuredLlm = llm.withStructuredOutput(TechPlanSchema);

    const artifact = await structuredLlm.invoke([
      new SystemMessage(PLANNER_PROMPT),
      ...messages,
    ]);

    const formattedContent = `# Tech Plan: ${artifact.title}

## Overview
${artifact.overview}

## Architecture

### Components
${artifact.architecture.components.map(c => `
#### ${c.name}
- **Responsibility**: ${c.responsibility}
- **Interfaces**: ${c.interfaces.join(", ")}
`).join("")}

### Data Flow
${artifact.architecture.dataFlow}

## Implementation Steps
${artifact.implementationSteps.map(s => `
### Step ${s.order}: ${s.task}
- **Files**: ${s.files.join(", ")}
- **Dependencies**: ${s.dependencies.length > 0 ? s.dependencies.join(", ") : "None"}
`).join("")}

## Risks
${artifact.risks.map(r => `
### ${r.risk} [${r.severity.toUpperCase()}]
**Mitigation**: ${r.mitigation}
`).join("")}`;

    return {
      messages: [
        new HumanMessage({
          content: formattedContent,
          name: "Planner",
        }),
      ],
      artifacts: [artifact],
      contributors: ["Planner"],
    };
  } catch (error) {
    console.error("❌ Planner failed:", error);
    return {
      messages: [
        new HumanMessage({
          content: `**[Planner Error]**: I encountered an error creating the tech plan. ${error instanceof Error ? error.message : "Unknown error"}`,
          name: "Planner",
        }),
      ],
      contributors: ["Planner"],
    };
  }
};
