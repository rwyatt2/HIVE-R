import { HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
export declare const uxResearcherNode: (state: typeof AgentState.State) => Promise<{
    messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
    contributors: string[];
}>;
//# sourceMappingURL=ux-researcher.d.ts.map