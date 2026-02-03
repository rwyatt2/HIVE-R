import { describe, it, expect } from "vitest";
describe("Tools", () => {
    describe("File Tools", () => {
        it("should export readFileTool", async () => {
            const { readFileTool } = await import("../src/tools/files.js");
            expect(readFileTool).toBeDefined();
            expect(readFileTool.name).toBe("read_file");
        });
        it("should export writeFileTool", async () => {
            const { writeFileTool } = await import("../src/tools/files.js");
            expect(writeFileTool).toBeDefined();
            expect(writeFileTool.name).toBe("write_file");
        });
        it("should export listDirectoryTool", async () => {
            const { listDirectoryTool } = await import("../src/tools/files.js");
            expect(listDirectoryTool).toBeDefined();
            expect(listDirectoryTool.name).toBe("list_directory");
        });
    });
    describe("Testing Tools", () => {
        it("should export runCommandTool", async () => {
            const { runCommandTool } = await import("../src/tools/testing.js");
            expect(runCommandTool).toBeDefined();
            expect(runCommandTool.name).toBe("run_command");
        });
        it("should export runTestsTool", async () => {
            const { runTestsTool } = await import("../src/tools/testing.js");
            expect(runTestsTool).toBeDefined();
            expect(runTestsTool.name).toBe("run_tests");
        });
    });
    describe("Web Tools", () => {
        it("should export webSearchTool", async () => {
            const { webSearchTool } = await import("../src/tools/web.js");
            expect(webSearchTool).toBeDefined();
            expect(webSearchTool.name).toBe("web_search");
        });
        it("should export fetchUrlTool", async () => {
            const { fetchUrlTool } = await import("../src/tools/web.js");
            expect(fetchUrlTool).toBeDefined();
            expect(fetchUrlTool.name).toBe("fetch_url");
        });
        it("should export createTicketTool", async () => {
            const { createTicketTool } = await import("../src/tools/web.js");
            expect(createTicketTool).toBeDefined();
            expect(createTicketTool.name).toBe("create_ticket");
        });
    });
});
//# sourceMappingURL=tools.test.js.map