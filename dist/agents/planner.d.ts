import { HumanMessage } from "@langchain/core/messages";
import { AgentState } from "../lib/state.js";
export declare const plannerNode: (state: typeof AgentState.State) => Promise<{
    messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
    artifacts: {
        type: "TechPlan";
        title: string;
        overview: string;
        architecture: {
            components: {
                name: string;
                responsibility: string;
                interfaces: string[];
            }[];
            dataFlow: string;
        };
        implementationSteps: {
            order: number;
            task: string;
            files: string[];
            dependencies: string[];
        }[];
        risks: {
            risk: string;
            mitigation: string;
            severity: "low" | "medium" | "high";
        }[];
    }[];
    contributors: string[];
} | {
    messages: HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
    contributors: string[];
    artifacts?: never;
}>;
//# sourceMappingURL=planner.d.ts.map