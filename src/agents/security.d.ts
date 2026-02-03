import { HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
export declare const securityNode: (state: typeof AgentState.State) => Promise<{
    messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
    artifacts: {
        type: "SecurityReview";
        title: string;
        threatModel: {
            threat: string;
            attackVector: string;
            impact: "low" | "medium" | "high" | "critical";
            likelihood: "low" | "medium" | "high";
        }[];
        vulnerabilities: {
            id: string;
            description: string;
            severity: "low" | "medium" | "high" | "critical";
            recommendation: string;
        }[];
        requirements: string[];
        complianceNotes: string[];
    }[];
    contributors: string[];
} | {
    messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
    contributors: string[];
    artifacts?: never;
}>;
//# sourceMappingURL=security.d.ts.map