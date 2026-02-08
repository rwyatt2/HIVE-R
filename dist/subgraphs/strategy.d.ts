import { BaseMessage, HumanMessage } from "@langchain/core/messages";
export declare const strategySubgraph: import("@langchain/langgraph").CompiledStateGraph<{
    messages: BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[];
    currentStep: "done" | "ux" | "founder" | "pm";
}, {
    messages?: BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[] | undefined;
    currentStep?: "done" | "ux" | "founder" | "pm" | undefined;
}, "ProductManager" | "Founder" | "UXResearcher" | "__start__", {
    messages: import("@langchain/langgraph").BinaryOperatorAggregate<BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]>;
    currentStep: import("@langchain/langgraph").BinaryOperatorAggregate<"done" | "ux" | "founder" | "pm", "done" | "ux" | "founder" | "pm">;
}, {
    messages: import("@langchain/langgraph").BinaryOperatorAggregate<BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]>;
    currentStep: import("@langchain/langgraph").BinaryOperatorAggregate<"done" | "ux" | "founder" | "pm", "done" | "ux" | "founder" | "pm">;
}, import("@langchain/langgraph").StateDefinition, {
    Founder: {
        messages: BaseMessage[];
        contributors: string[];
    };
    ProductManager: {
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
        artifacts?: undefined;
    };
    UXResearcher: {
        messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
        contributors: string[];
    };
}, unknown, unknown>;
/**
 * Run the strategy subgraph
 * Returns messages from all strategy agents
 */
export declare const runStrategyPhase: (messages: BaseMessage[]) => Promise<BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]>;
//# sourceMappingURL=strategy.d.ts.map