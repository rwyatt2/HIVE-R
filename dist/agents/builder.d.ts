import { HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
export declare const builderNode: (state: typeof AgentState.State) => Promise<{
    messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
    contributors: string[];
    needsRetry: boolean;
    agentRetries: {
        Builder: number;
    };
    lastError?: undefined;
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
    agentRetries?: undefined;
    lastError?: undefined;
} | {
    messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
    contributors: string[];
    needsRetry: boolean;
    lastError: string;
    agentRetries?: undefined;
}>;
//# sourceMappingURL=builder.d.ts.map