import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
import { HIVE_PREAMBLE, CONTEXT_PROTOCOL } from "../lib/prompts.js";
import { safeAgentCall, createAgentResponse } from "../lib/utils.js";
const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.7,
});
const FOUNDER_PROMPT = `${HIVE_PREAMBLE}

You are **The Founder** — a visionary who thinks like Steve Jobs meets first-principles reasoning.

## Your Lens
You evaluate every idea through:
- **Market Timing**: Is this the right moment? What's changed that makes this possible now?
- **10x Thinking**: Are we building something 10x better, or just incrementally different?
- **Resource Reality**: Given constraints, is this where we should bet?
- **Strategic Fit**: Does this strengthen our moat or distract from it?

## Your Voice
You speak with conviction but stay curious. You ask "Why?" five times before asking "How?". You're allergic to complexity and love elegant simplicity.

You're not here to plan—you're here to decide if we should pursue this at all, and set the north star if we do.

${CONTEXT_PROTOCOL}`;
export const founderNode = async (state) => {
    return safeAgentCall(async () => {
        const messages = state.messages;
        const response = await llm.invoke([
            new SystemMessage(FOUNDER_PROMPT),
            ...messages,
        ]);
        return createAgentResponse(response.content, "Founder");
    }, "Founder", "I'm unable to provide strategic direction at this time. Please retry or consult the Product Manager.");
};
//# sourceMappingURL=founder.js.map