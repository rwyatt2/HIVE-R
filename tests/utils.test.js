import { describe, it, expect } from "vitest";
describe("Utils", () => {
    describe("safeAgentCall", () => {
        it("should be importable", async () => {
            const { safeAgentCall } = await import("../src/lib/utils.js");
            expect(safeAgentCall).toBeDefined();
            expect(typeof safeAgentCall).toBe("function");
        });
    });
    describe("formatContributorContext", () => {
        it("should format contributors correctly", async () => {
            const { formatContributorContext } = await import("../src/lib/utils.js");
            const result = formatContributorContext(["Founder", "ProductManager"]);
            expect(result).toContain("Founder");
            expect(result).toContain("ProductManager");
        });
        it("should return empty string for no contributors", async () => {
            const { formatContributorContext } = await import("../src/lib/utils.js");
            const result = formatContributorContext([]);
            expect(result).toBe("");
        });
    });
    describe("createAgentResponse", () => {
        it("should create proper response structure", async () => {
            const { createAgentResponse } = await import("../src/lib/utils.js");
            const result = createAgentResponse("Test content", "TestAgent");
            expect(result.messages).toHaveLength(1);
            expect(result.contributors).toContain("TestAgent");
        });
    });
});
//# sourceMappingURL=utils.test.js.map