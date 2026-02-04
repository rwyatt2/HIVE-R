
/**
 * HIVE-R MCP Server
 * 
 * Exposes the HIVE-R Agent Swarm as a Model Context Protocol server.
 * Allows usage in Cursor, Claude Code, and other MCP clients.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { graph } from "./graph.js";
import { HumanMessage } from "@langchain/core/messages";
import { randomUUID } from "crypto";

// Initialize MCP Server
const server = new Server(
    {
        name: "hive-r-swarm",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Define Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "consult_hive_swarm",
                description: "Consult the HIVE-R agent swarm (Founder, PM, Builder, etc.) to build software or answer questions. Use this for complex tasks requiring multiple agents.",
                inputSchema: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            description: "The instruction or question for the swarm.",
                        },
                        threadId: {
                            type: "string",
                            description: "Optional conversation ID to maintain context.",
                        },
                    },
                    required: ["message"],
                },
            },
        ],
    };
});

// Handle Tool Calls
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    if (request.params.name === "consult_hive_swarm") {
        const { message, threadId } = request.params.arguments as { message: string, threadId?: string };
        const thread = threadId || randomUUID();

        try {
            const config = {
                configurable: { thread_id: thread }
            };

            const initialState = {
                messages: [new HumanMessage(message)],
            };

            const result = await graph.invoke(initialState, config);
            const lastMessage = result.messages[result.messages.length - 1];

            if (!lastMessage) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "No response from agent swarm",
                        },
                    ],
                };
            }

            return {
                content: [
                    {
                        type: "text",
                        text: lastMessage.content as string,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error consulting swarm: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    }

    throw new Error(`Tool not found: ${request.params.name}`);
});

// Start Server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("🐝 HIVE-R MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
