import { HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
export declare const testerNode: (state: typeof AgentState.State) => Promise<{
    messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
    contributors: string[];
    artifacts?: undefined;
} | {
    messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
    artifacts: {
        type: "TestPlan";
        title: string;
        strategy: string;
        testCases: {
            id: string;
            description: string;
            preconditions: string[];
            steps: string[];
            expectedResult: string;
            priority: "P0" | "P1" | "P2";
        }[];
        edgeCases: string[];
        automationPlan: string[];
        manualTestingNotes: string[];
    }[];
    contributors: string[];
}>;
//# sourceMappingURL=tester.d.ts.map