import { tool } from "@langchain/core/tools";
import { z } from "zod";
/**
 * ✅ A+ Tools: Web search and URL fetching
 * These enable research agents to access external information
 */
/**
 * Web Search Tool
 * Uses DuckDuckGo instant answers (free, no API key required)
 */
export const webSearchTool = tool(async ({ query, maxResults }) => {
    try {
        // Use DuckDuckGo instant answer API (free)
        const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&skip_disambig=1`;
        const response = await fetch(url);
        const data = await response.json();
        const results = [];
        // Add abstract if available
        if (data.Abstract) {
            results.push(`**Summary**: ${data.Abstract}`);
            if (data.AbstractSource) {
                results.push(`Source: ${data.AbstractSource}`);
            }
        }
        // Add related topics
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            results.push("\n**Related:**");
            const topics = data.RelatedTopics.slice(0, maxResults || 5);
            for (const topic of topics) {
                if (topic.Text) {
                    results.push(`- ${topic.Text}`);
                }
            }
        }
        // Add instant answer if available
        if (data.Answer) {
            results.push(`\n**Answer**: ${data.Answer}`);
        }
        return results.length > 0 ? results.join("\n") : "No results found for this query.";
    }
    catch (error) {
        return `Search error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
}, {
    name: "web_search",
    description: "Search the web for information. Returns summaries and related topics.",
    schema: z.object({
        query: z.string().describe("The search query"),
        maxResults: z.number().optional().default(5).describe("Maximum number of results"),
    }),
});
/**
 * Fetch URL Tool
 * Retrieves content from a URL
 */
export const fetchUrlTool = tool(async ({ url, extractText }) => {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "HIVE-R Agent Bot/1.0",
            },
        });
        if (!response.ok) {
            return `Error fetching URL: ${response.status} ${response.statusText}`;
        }
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            const json = await response.json();
            return JSON.stringify(json, null, 2);
        }
        const text = await response.text();
        if (extractText && contentType.includes("text/html")) {
            // Basic HTML stripping
            const stripped = text
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 5000); // Limit response size
            return stripped;
        }
        return text.slice(0, 5000);
    }
    catch (error) {
        return `Fetch error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
}, {
    name: "fetch_url",
    description: "Fetch content from a URL. Can extract text from HTML pages.",
    schema: z.object({
        url: z.string().url().describe("The URL to fetch"),
        extractText: z.boolean().optional().default(true).describe("Extract text from HTML"),
    }),
});
/**
 * Create GitHub Issue Tool
 * Creates an issue on GitHub (requires GITHUB_TOKEN env var)
 */
export const createTicketTool = tool(async ({ title, body, labels, repo }) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        return "Error: GITHUB_TOKEN environment variable not set. Cannot create ticket.";
    }
    try {
        const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            body: JSON.stringify({
                title,
                body,
                labels: labels || [],
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            return `Failed to create issue: ${response.status} - ${error}`;
        }
        const issue = await response.json();
        return `✅ Issue created: ${issue.html_url}`;
    }
    catch (error) {
        return `Error creating issue: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
}, {
    name: "create_ticket",
    description: "Create a GitHub issue/ticket. Requires GITHUB_TOKEN env var.",
    schema: z.object({
        title: z.string().describe("Issue title"),
        body: z.string().describe("Issue body/description"),
        repo: z.string().describe("Repository in format owner/repo"),
        labels: z.array(z.string()).optional().describe("Issue labels"),
    }),
});
// Export all web tools
export const webTools = [webSearchTool, fetchUrlTool, createTicketTool];
//# sourceMappingURL=web.js.map