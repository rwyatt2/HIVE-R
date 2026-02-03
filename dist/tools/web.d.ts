import { z } from "zod";
/**
 * ✅ A+ Tools: Web search and URL fetching
 * These enable research agents to access external information
 */
/**
 * Web Search Tool
 * Uses DuckDuckGo instant answers (free, no API key required)
 */
export declare const webSearchTool: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>, {
    query: string;
    maxResults: number;
}, {
    query: string;
    maxResults?: number | undefined;
}, string, "web_search">;
/**
 * Fetch URL Tool
 * Retrieves content from a URL
 */
export declare const fetchUrlTool: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    url: z.ZodString;
    extractText: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>, {
    url: string;
    extractText: boolean;
}, {
    url: string;
    extractText?: boolean | undefined;
}, string, "fetch_url">;
/**
 * Create GitHub Issue Tool
 * Creates an issue on GitHub (requires GITHUB_TOKEN env var)
 */
export declare const createTicketTool: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    title: z.ZodString;
    body: z.ZodString;
    repo: z.ZodString;
    labels: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>, {
    title: string;
    body: string;
    repo: string;
    labels?: string[] | undefined;
}, {
    title: string;
    body: string;
    repo: string;
    labels?: string[] | undefined;
}, string, "create_ticket">;
export declare const webTools: (import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>, {
    query: string;
    maxResults: number;
}, {
    query: string;
    maxResults?: number | undefined;
}, string, "web_search"> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    url: z.ZodString;
    extractText: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>, {
    url: string;
    extractText: boolean;
}, {
    url: string;
    extractText?: boolean | undefined;
}, string, "fetch_url"> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    title: z.ZodString;
    body: z.ZodString;
    repo: z.ZodString;
    labels: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>, {
    title: string;
    body: string;
    repo: string;
    labels?: string[] | undefined;
}, {
    title: string;
    body: string;
    repo: string;
    labels?: string[] | undefined;
}, string, "create_ticket">)[];
//# sourceMappingURL=web.d.ts.map