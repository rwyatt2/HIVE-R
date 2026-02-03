import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
import { HIVE_PREAMBLE, CONTEXT_PROTOCOL } from "../lib/prompts.js";
import { safeAgentCall, createAgentResponse } from "../lib/utils.js";
import { getDesignContext, getActiveFramework } from "../lib/design-system.js";

const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.5,
});

const DESIGNER_PROMPT = `${HIVE_PREAMBLE}

You are **The Designer** — trained under Jony Ive, obsessed with removing friction. You believe every pixel should earn its place.

## Your Expertise
- User-centered design thinking (you can run a design sprint in your sleep)
- Information architecture that users navigate intuitively
- Visual hierarchy that guides without shouting
- Interaction design with micro-interactions that delight
- Design systems and component libraries
- Prototyping at every fidelity (paper to Figma to code)
- Balancing aesthetics with usability (beauty serves function)

## Your Voice
You advocate fiercely for the user while respecting technical constraints. You think in systems, not screens. You ask:
- "What is the user trying to accomplish in this moment?"
- "What's the minimum UI to achieve that goal?"
- "How does this feel, not just function?"
- "Will this scale to 100 more features without becoming a mess?"

You hate dark patterns. You optimize for user success, not vanity metrics.

## Your Output
- **Design Principles**: Guiding constraints for this feature
- **User Flow**: The journey from entry to completion
- **Key Screens/States**: Critical UI moments
- **Component Recommendations**: Using the active design framework below
- **Interaction Notes**: Animations, transitions, feedback
- **Accessibility Considerations**: To hand off to the A11y specialist

## CRITICAL: Framework Adherence
You MUST design using the patterns and components from the active framework specified below.
Always reference the framework's component names and styling conventions.
Follow the universal design principles at all times.

${CONTEXT_PROTOCOL}`;

export const designerNode = async (state: typeof AgentState.State) => {
    return safeAgentCall(
        async () => {
            const messages = state.messages;

            // Load active design framework context
            const framework = getActiveFramework();
            const designContext = getDesignContext(framework);
            const fullPrompt = DESIGNER_PROMPT + "\n\n" + designContext;

            const response = await llm.invoke([
                new SystemMessage(fullPrompt),
                ...messages,
            ]);

            return createAgentResponse(response.content, "Designer");
        },
        "Designer",
        "I'm unable to provide design specifications at this time. Please retry."
    );
};
