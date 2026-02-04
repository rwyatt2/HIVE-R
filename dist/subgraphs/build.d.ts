import { BaseMessage } from "@langchain/core/messages";
export declare const buildSubgraph: import("@langchain/langgraph").CompiledStateGraph<{
    messages: BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[];
    reviewPassed: boolean;
}, {
    messages?: BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[] | undefined;
    reviewPassed?: boolean | undefined;
}, "Planner" | "Security" | "Builder" | "Reviewer" | "Tester" | "__start__", {
    messages: import("@langchain/langgraph").BinaryOperatorAggregate<BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]>;
    reviewPassed: import("@langchain/langgraph").BinaryOperatorAggregate<boolean, boolean>;
}, {
    messages: import("@langchain/langgraph").BinaryOperatorAggregate<BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]>;
    reviewPassed: import("@langchain/langgraph").BinaryOperatorAggregate<boolean, boolean>;
}, import("@langchain/langgraph").StateDefinition, {
    Planner: {
        messages: import("@langchain/core/messages").HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
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
        messages: import("@langchain/core/messages").HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
        contributors: string[];
        artifacts?: undefined;
    };
    Security: {
        messages: import("@langchain/core/messages").HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
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
        messages: import("@langchain/core/messages").HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
        contributors: string[];
        artifacts?: undefined;
    };
    Builder: {
        messages: import("@langchain/core/messages").HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
        contributors: string[];
        needsRetry: boolean;
        agentRetries: {
            Builder: number;
        };
        lastError?: undefined;
    } | {
        messages: import("@langchain/core/messages").HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
        contributors: string[];
        needsRetry: boolean;
        agentRetries: {
            Builder: number;
        };
        lastError: string | null;
    } | {
        messages: import("@langchain/core/messages").HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
        contributors: string[];
        needsRetry: boolean;
        agentRetries?: undefined;
        lastError?: undefined;
    } | {
        messages: import("@langchain/core/messages").HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
        contributors: string[];
        needsRetry: boolean;
        lastError: string;
        agentRetries?: undefined;
    };
    Reviewer: {
        messages: import("@langchain/core/messages").HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
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
        messages: import("@langchain/core/messages").HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
        contributors: string[];
        artifacts?: undefined;
    };
    Tester: {
        messages: import("@langchain/core/messages").HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
        contributors: string[];
        artifacts?: undefined;
    } | {
        messages: import("@langchain/core/messages").HumanMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>[];
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
    };
}, unknown, unknown>;
export declare const runBuildPhase: (messages: BaseMessage[]) => Promise<BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]>;
//# sourceMappingURL=build.d.ts.map