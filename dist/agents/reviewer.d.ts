import { HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
export declare const reviewerNode: (state: typeof AgentState.State) => Promise<{
    messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
    artifacts: {
        type: "CodeReview";
        verdict: "approve" | "request_changes" | "needs_discussion";
        summary: string;
        mustFix: {
            location: string;
            issue: string;
            suggestion: string;
        }[];
        shouldFix: {
            location: string;
            issue: string;
            suggestion: string;
        }[];
        nits: string[];
        praise: string[];
    }[];
    contributors: string[];
} | {
    messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
    contributors: string[];
    artifacts?: undefined;
}>;
//# sourceMappingURL=reviewer.d.ts.map