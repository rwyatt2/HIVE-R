import { HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
export declare const productManagerNode: (state: typeof AgentState.State) => Promise<{
    messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
    artifacts: {
        type: "PRD";
        title: string;
        goal: string;
        successMetrics: string[];
        userStories: {
            id: string;
            title: string;
            asA: string;
            iWant: string;
            soThat: string;
            acceptanceCriteria: string[];
            priority: "P0" | "P1" | "P2" | "P3";
        }[];
        outOfScope: string[];
        openQuestions: string[];
    }[];
    contributors: string[];
} | {
    messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
    contributors: string[];
    artifacts?: never;
}>;
//# sourceMappingURL=product-manager.d.ts.map