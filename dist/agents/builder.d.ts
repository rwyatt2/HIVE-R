import { HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
export declare const builderNode: (state: typeof AgentState.State) => Promise<{
    messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
    contributors: string[];
    needsRetry: boolean;
    agentRetries: {
        Builder: number;
    };
    lastError?: never;
} | {
    messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
    contributors: string[];
    needsRetry: boolean;
    agentRetries: {
        Builder: number;
    };
    lastError: string | null;
} | {
    messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
    contributors: string[];
    needsRetry: boolean;
    agentRetries?: never;
    lastError?: never;
} | {
    messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
    contributors: string[];
    needsRetry: boolean;
    lastError: string;
    agentRetries?: never;
}>;
//# sourceMappingURL=builder.d.ts.map