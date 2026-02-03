import { describe, it, expect } from "vitest";

describe("Artifacts Schema", () => {
    describe("PRDArtifactSchema", () => {
        it("should validate a valid PRD", async () => {
            const { PRDArtifactSchema } = await import("../src/lib/artifacts.js");

            const prd = {
                type: "PRD" as const,
                title: "Test Feature",
                goal: "Test goal",
                successMetrics: ["Metric 1"],
                userStories: [
                    {
                        id: "US-001",
                        title: "Test Story",
                        asA: "user",
                        iWant: "something",
                        soThat: "benefit",
                        acceptanceCriteria: ["Criteria 1"],
                        priority: "P1" as const,
                    }
                ],
                outOfScope: ["Out of scope item"],
                openQuestions: ["Question 1"],
            };

            const result = PRDArtifactSchema.safeParse(prd);
            expect(result.success).toBe(true);
        });
    });

    describe("TechPlanSchema", () => {
        it("should validate a valid TechPlan", async () => {
            const { TechPlanSchema } = await import("../src/lib/artifacts.js");

            const plan = {
                type: "TechPlan" as const,
                title: "Test Plan",
                overview: "Overview text",
                architecture: {
                    components: [
                        {
                            name: "API",
                            responsibility: "Handle requests",
                            interfaces: ["/api/v1"],
                        }
                    ],
                    dataFlow: "Client -> API -> DB",
                },
                implementationSteps: [
                    {
                        order: 1,
                        task: "Create API",
                        files: ["api.ts"],
                        dependencies: [],
                    }
                ],
                risks: [
                    {
                        risk: "Test risk",
                        mitigation: "Mitigation",
                        severity: "low" as const,
                    }
                ],
            };

            const result = TechPlanSchema.safeParse(plan);
            expect(result.success).toBe(true);
        });
    });
});
