import { BaseMessage } from "@langchain/core/messages";
/**
 * Enhanced Agent State with:
 * - Message history
 * - Routing decisions
 * - Typed artifacts
 * - Agent contribution tracking
 */
export declare const AgentState: import("@langchain/langgraph").AnnotationRoot<{
    messages: import("@langchain/langgraph").BinaryOperatorAggregate<BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]>;
    next: import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
    contributors: import("@langchain/langgraph").BinaryOperatorAggregate<string[], string[]>;
    artifacts: import("@langchain/langgraph").BinaryOperatorAggregate<({
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
    } | {
        type: "DesignSpec";
        title: string;
        principles: string[];
        userFlow: {
            step: number;
            screen: string;
            action: string;
            notes?: string | undefined;
        }[];
        components: {
            name: string;
            description: string;
            props?: string[] | undefined;
        }[];
        interactionNotes: string[];
        accessibilityNotes: string[];
    } | {
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
    } | {
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
    } | {
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
    } | {
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
    })[], ({
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
    } | {
        type: "DesignSpec";
        title: string;
        principles: string[];
        userFlow: {
            step: number;
            screen: string;
            action: string;
            notes?: string | undefined;
        }[];
        components: {
            name: string;
            description: string;
            props?: string[] | undefined;
        }[];
        interactionNotes: string[];
        accessibilityNotes: string[];
    } | {
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
    } | {
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
    } | {
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
    } | {
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
    })[]>;
    phase: import("@langchain/langgraph").BinaryOperatorAggregate<"build" | "strategy" | "design" | "ship", "build" | "strategy" | "design" | "ship">;
    requiresApproval: import("@langchain/langgraph").BinaryOperatorAggregate<boolean, boolean>;
    approvalStatus: import("@langchain/langgraph").BinaryOperatorAggregate<"pending" | "approved" | "rejected" | null, "pending" | "approved" | "rejected" | null>;
}>;
export type AgentStateType = typeof AgentState.State;
//# sourceMappingURL=state.d.ts.map