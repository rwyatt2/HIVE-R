import { z } from "zod";
/**
 * User Story with acceptance criteria
 */
export declare const UserStorySchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    asA: z.ZodString;
    iWant: z.ZodString;
    soThat: z.ZodString;
    acceptanceCriteria: z.ZodArray<z.ZodString>;
    priority: z.ZodEnum<{
        P0: "P0";
        P1: "P1";
        P2: "P2";
        P3: "P3";
    }>;
}, z.core.$strip>;
export type UserStory = z.infer<typeof UserStorySchema>;
/**
 * Product Requirements Document
 */
export declare const PRDArtifactSchema: z.ZodObject<{
    type: z.ZodLiteral<"PRD">;
    title: z.ZodString;
    goal: z.ZodString;
    successMetrics: z.ZodArray<z.ZodString>;
    userStories: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        asA: z.ZodString;
        iWant: z.ZodString;
        soThat: z.ZodString;
        acceptanceCriteria: z.ZodArray<z.ZodString>;
        priority: z.ZodEnum<{
            P0: "P0";
            P1: "P1";
            P2: "P2";
            P3: "P3";
        }>;
    }, z.core.$strip>>;
    outOfScope: z.ZodArray<z.ZodString>;
    openQuestions: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type PRDArtifact = z.infer<typeof PRDArtifactSchema>;
/**
 * Design Specification
 */
export declare const DesignSpecSchema: z.ZodObject<{
    type: z.ZodLiteral<"DesignSpec">;
    title: z.ZodString;
    principles: z.ZodArray<z.ZodString>;
    userFlow: z.ZodArray<z.ZodObject<{
        step: z.ZodNumber;
        screen: z.ZodString;
        action: z.ZodString;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    components: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        props: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    interactionNotes: z.ZodArray<z.ZodString>;
    accessibilityNotes: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type DesignSpec = z.infer<typeof DesignSpecSchema>;
/**
 * Technical Implementation Plan
 */
export declare const TechPlanSchema: z.ZodObject<{
    type: z.ZodLiteral<"TechPlan">;
    title: z.ZodString;
    overview: z.ZodString;
    architecture: z.ZodObject<{
        components: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            responsibility: z.ZodString;
            interfaces: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
        dataFlow: z.ZodString;
    }, z.core.$strip>;
    implementationSteps: z.ZodArray<z.ZodObject<{
        order: z.ZodNumber;
        task: z.ZodString;
        files: z.ZodArray<z.ZodString>;
        dependencies: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    risks: z.ZodArray<z.ZodObject<{
        risk: z.ZodString;
        mitigation: z.ZodString;
        severity: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
        }>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type TechPlan = z.infer<typeof TechPlanSchema>;
/**
 * Security Review
 */
export declare const SecurityReviewSchema: z.ZodObject<{
    type: z.ZodLiteral<"SecurityReview">;
    title: z.ZodString;
    threatModel: z.ZodArray<z.ZodObject<{
        threat: z.ZodString;
        attackVector: z.ZodString;
        impact: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            critical: "critical";
        }>;
        likelihood: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
        }>;
    }, z.core.$strip>>;
    vulnerabilities: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        description: z.ZodString;
        severity: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            critical: "critical";
        }>;
        recommendation: z.ZodString;
    }, z.core.$strip>>;
    requirements: z.ZodArray<z.ZodString>;
    complianceNotes: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type SecurityReview = z.infer<typeof SecurityReviewSchema>;
/**
 * Test Plan
 */
export declare const TestPlanSchema: z.ZodObject<{
    type: z.ZodLiteral<"TestPlan">;
    title: z.ZodString;
    strategy: z.ZodString;
    testCases: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        description: z.ZodString;
        preconditions: z.ZodArray<z.ZodString>;
        steps: z.ZodArray<z.ZodString>;
        expectedResult: z.ZodString;
        priority: z.ZodEnum<{
            P0: "P0";
            P1: "P1";
            P2: "P2";
        }>;
    }, z.core.$strip>>;
    edgeCases: z.ZodArray<z.ZodString>;
    automationPlan: z.ZodArray<z.ZodString>;
    manualTestingNotes: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type TestPlan = z.infer<typeof TestPlanSchema>;
/**
 * Code Review Result
 */
export declare const CodeReviewSchema: z.ZodObject<{
    type: z.ZodLiteral<"CodeReview">;
    verdict: z.ZodEnum<{
        approve: "approve";
        request_changes: "request_changes";
        needs_discussion: "needs_discussion";
    }>;
    summary: z.ZodString;
    mustFix: z.ZodArray<z.ZodObject<{
        location: z.ZodString;
        issue: z.ZodString;
        suggestion: z.ZodString;
    }, z.core.$strip>>;
    shouldFix: z.ZodArray<z.ZodObject<{
        location: z.ZodString;
        issue: z.ZodString;
        suggestion: z.ZodString;
    }, z.core.$strip>>;
    nits: z.ZodArray<z.ZodString>;
    praise: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type CodeReview = z.infer<typeof CodeReviewSchema>;
/**
 * Union of all artifact types
 */
export declare const ArtifactSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"PRD">;
    title: z.ZodString;
    goal: z.ZodString;
    successMetrics: z.ZodArray<z.ZodString>;
    userStories: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        asA: z.ZodString;
        iWant: z.ZodString;
        soThat: z.ZodString;
        acceptanceCriteria: z.ZodArray<z.ZodString>;
        priority: z.ZodEnum<{
            P0: "P0";
            P1: "P1";
            P2: "P2";
            P3: "P3";
        }>;
    }, z.core.$strip>>;
    outOfScope: z.ZodArray<z.ZodString>;
    openQuestions: z.ZodArray<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"DesignSpec">;
    title: z.ZodString;
    principles: z.ZodArray<z.ZodString>;
    userFlow: z.ZodArray<z.ZodObject<{
        step: z.ZodNumber;
        screen: z.ZodString;
        action: z.ZodString;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    components: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        props: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    interactionNotes: z.ZodArray<z.ZodString>;
    accessibilityNotes: z.ZodArray<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"TechPlan">;
    title: z.ZodString;
    overview: z.ZodString;
    architecture: z.ZodObject<{
        components: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            responsibility: z.ZodString;
            interfaces: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
        dataFlow: z.ZodString;
    }, z.core.$strip>;
    implementationSteps: z.ZodArray<z.ZodObject<{
        order: z.ZodNumber;
        task: z.ZodString;
        files: z.ZodArray<z.ZodString>;
        dependencies: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    risks: z.ZodArray<z.ZodObject<{
        risk: z.ZodString;
        mitigation: z.ZodString;
        severity: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
        }>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"SecurityReview">;
    title: z.ZodString;
    threatModel: z.ZodArray<z.ZodObject<{
        threat: z.ZodString;
        attackVector: z.ZodString;
        impact: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            critical: "critical";
        }>;
        likelihood: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
        }>;
    }, z.core.$strip>>;
    vulnerabilities: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        description: z.ZodString;
        severity: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            critical: "critical";
        }>;
        recommendation: z.ZodString;
    }, z.core.$strip>>;
    requirements: z.ZodArray<z.ZodString>;
    complianceNotes: z.ZodArray<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"TestPlan">;
    title: z.ZodString;
    strategy: z.ZodString;
    testCases: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        description: z.ZodString;
        preconditions: z.ZodArray<z.ZodString>;
        steps: z.ZodArray<z.ZodString>;
        expectedResult: z.ZodString;
        priority: z.ZodEnum<{
            P0: "P0";
            P1: "P1";
            P2: "P2";
        }>;
    }, z.core.$strip>>;
    edgeCases: z.ZodArray<z.ZodString>;
    automationPlan: z.ZodArray<z.ZodString>;
    manualTestingNotes: z.ZodArray<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"CodeReview">;
    verdict: z.ZodEnum<{
        approve: "approve";
        request_changes: "request_changes";
        needs_discussion: "needs_discussion";
    }>;
    summary: z.ZodString;
    mustFix: z.ZodArray<z.ZodObject<{
        location: z.ZodString;
        issue: z.ZodString;
        suggestion: z.ZodString;
    }, z.core.$strip>>;
    shouldFix: z.ZodArray<z.ZodObject<{
        location: z.ZodString;
        issue: z.ZodString;
        suggestion: z.ZodString;
    }, z.core.$strip>>;
    nits: z.ZodArray<z.ZodString>;
    praise: z.ZodArray<z.ZodString>;
}, z.core.$strip>], "type">;
export type Artifact = z.infer<typeof ArtifactSchema>;
//# sourceMappingURL=artifacts.d.ts.map