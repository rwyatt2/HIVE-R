import { z } from "zod";
// ============================================
// TYPED ARTIFACTS
// Structured outputs that agents produce
// ============================================
/**
 * User Story with acceptance criteria
 */
export const UserStorySchema = z.object({
    id: z.string(),
    title: z.string(),
    asA: z.string().describe("As a [type of user]"),
    iWant: z.string().describe("I want [goal]"),
    soThat: z.string().describe("So that [benefit]"),
    acceptanceCriteria: z.array(z.string()),
    priority: z.enum(["P0", "P1", "P2", "P3"]),
});
/**
 * Product Requirements Document
 */
export const PRDArtifactSchema = z.object({
    type: z.literal("PRD"),
    title: z.string(),
    goal: z.string(),
    successMetrics: z.array(z.string()),
    userStories: z.array(UserStorySchema),
    outOfScope: z.array(z.string()),
    openQuestions: z.array(z.string()),
});
/**
 * Design Specification
 */
export const DesignSpecSchema = z.object({
    type: z.literal("DesignSpec"),
    title: z.string(),
    principles: z.array(z.string()),
    userFlow: z.array(z.object({
        step: z.number(),
        screen: z.string(),
        action: z.string(),
        notes: z.string().optional(),
    })),
    components: z.array(z.object({
        name: z.string(),
        description: z.string(),
        props: z.array(z.string()).optional(),
    })),
    interactionNotes: z.array(z.string()),
    accessibilityNotes: z.array(z.string()),
});
/**
 * Technical Implementation Plan
 */
export const TechPlanSchema = z.object({
    type: z.literal("TechPlan"),
    title: z.string(),
    overview: z.string(),
    architecture: z.object({
        components: z.array(z.object({
            name: z.string(),
            responsibility: z.string(),
            interfaces: z.array(z.string()),
        })),
        dataFlow: z.string(),
    }),
    implementationSteps: z.array(z.object({
        order: z.number(),
        task: z.string(),
        files: z.array(z.string()),
        dependencies: z.array(z.string()),
    })),
    risks: z.array(z.object({
        risk: z.string(),
        mitigation: z.string(),
        severity: z.enum(["low", "medium", "high"]),
    })),
});
/**
 * Security Review
 */
export const SecurityReviewSchema = z.object({
    type: z.literal("SecurityReview"),
    title: z.string(),
    threatModel: z.array(z.object({
        threat: z.string(),
        attackVector: z.string(),
        impact: z.enum(["low", "medium", "high", "critical"]),
        likelihood: z.enum(["low", "medium", "high"]),
    })),
    vulnerabilities: z.array(z.object({
        id: z.string(),
        description: z.string(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        recommendation: z.string(),
    })),
    requirements: z.array(z.string()),
    complianceNotes: z.array(z.string()),
});
/**
 * Test Plan
 */
export const TestPlanSchema = z.object({
    type: z.literal("TestPlan"),
    title: z.string(),
    strategy: z.string(),
    testCases: z.array(z.object({
        id: z.string(),
        description: z.string(),
        preconditions: z.array(z.string()),
        steps: z.array(z.string()),
        expectedResult: z.string(),
        priority: z.enum(["P0", "P1", "P2"]),
    })),
    edgeCases: z.array(z.string()),
    automationPlan: z.array(z.string()),
    manualTestingNotes: z.array(z.string()),
});
/**
 * Code Review Result
 */
export const CodeReviewSchema = z.object({
    type: z.literal("CodeReview"),
    verdict: z.enum(["approve", "request_changes", "needs_discussion"]),
    summary: z.string(),
    mustFix: z.array(z.object({
        location: z.string(),
        issue: z.string(),
        suggestion: z.string(),
    })),
    shouldFix: z.array(z.object({
        location: z.string(),
        issue: z.string(),
        suggestion: z.string(),
    })),
    nits: z.array(z.string()),
    praise: z.array(z.string()),
});
/**
 * Union of all artifact types
 */
export const ArtifactSchema = z.discriminatedUnion("type", [
    PRDArtifactSchema,
    DesignSpecSchema,
    TechPlanSchema,
    SecurityReviewSchema,
    TestPlanSchema,
    CodeReviewSchema,
]);
//# sourceMappingURL=artifacts.js.map