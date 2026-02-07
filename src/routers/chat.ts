/**
 * Chat Router — Hardened
 * 
 * Handles /chat and /chat/stream endpoints with:
 * - Zod input validation
 * - Prompt injection sanitization
 * - Per-user rate limiting (10 requests/hour)
 * - Structured error responses
 * - Security event logging
 */

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { randomUUID } from "crypto";

import { graph } from "../graph.js";
import { HIVE_MEMBERS } from "../agents/router.js";
import {
    validateChatInput,
    checkChatRateLimit,
    type ValidationError,
} from "../lib/input-validation.js";

const chatRouter = new Hono();

// ============================================================================
// HELPERS
// ============================================================================

/** Extract a rate-limit key from the request (IP or auth token hash) */
function getRateLimitKey(c: any): string {
    // Prefer authenticated user identity
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        // Use first 16 chars of token as key (enough to differentiate users)
        return `user:${authHeader.slice(7, 23)}`;
    }
    // Fall back to IP
    return (
        c.req.header("x-forwarded-for") ||
        c.req.header("x-real-ip") ||
        "anonymous"
    );
}

/** Extract client IP for logging */
function getClientIp(c: any): string {
    return (
        c.req.header("x-forwarded-for") ||
        c.req.header("x-real-ip") ||
        "unknown"
    );
}

/** Build a consistent JSON error response */
function errorResponse(c: any, status: number, err: ValidationError) {
    return c.json(err, status);
}

// ============================================================================
// POST / — Standard chat
// ============================================================================

chatRouter.post("/", async (c) => {
    const ip = getClientIp(c);

    // Rate limit check
    const rateCheck = checkChatRateLimit(getRateLimitKey(c));
    if (!rateCheck.allowed) {
        c.res.headers.set("X-RateLimit-Limit", rateCheck.limit.toString());
        c.res.headers.set("X-RateLimit-Remaining", "0");
        c.res.headers.set("X-RateLimit-Reset", rateCheck.resetTime.toString());
        c.res.headers.set("Retry-After", (rateCheck.retryAfterSeconds ?? 60).toString());

        return errorResponse(c, 429, {
            success: false,
            error: `Rate limit exceeded. Try again in ${rateCheck.retryAfterSeconds} seconds.`,
            code: "RATE_LIMIT_EXCEEDED",
        });
    }

    // Add rate limit headers for successful requests too
    c.res.headers.set("X-RateLimit-Limit", rateCheck.limit.toString());
    c.res.headers.set("X-RateLimit-Remaining", rateCheck.remaining.toString());
    c.res.headers.set("X-RateLimit-Reset", rateCheck.resetTime.toString());

    // Parse body
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return errorResponse(c, 400, {
            success: false,
            error: "Invalid JSON in request body",
            code: "INVALID_JSON",
        });
    }

    // Validate + sanitize
    const validation = validateChatInput(body, ip);
    if (!validation.success) {
        return errorResponse(c, 400, validation);
    }

    const { message, threadId } = validation.data;
    const thread = threadId || randomUUID();

    const config = {
        configurable: { thread_id: thread },
    };

    const initialState = {
        messages: [new HumanMessage(message)],
    };

    try {
        const result = await graph.invoke(initialState, config);

        const history = result.messages.map((msg: BaseMessage) => ({
            agent: msg.name || "User",
            content: msg.content,
        }));

        return c.json({
            threadId: thread,
            result: result.messages[result.messages.length - 1]?.content,
            contributors: result.contributors || [],
            history,
        });
    } catch (error) {
        console.error("❌ Chat error:", error);
        return c.json(
            { error: "An error occurred processing your request. Please try again." },
            500
        );
    }
});

// ============================================================================
// POST /stream — Streaming chat via SSE
// ============================================================================

chatRouter.post("/stream", async (c) => {
    const ip = getClientIp(c);

    // Rate limit check
    const rateCheck = checkChatRateLimit(getRateLimitKey(c));
    if (!rateCheck.allowed) {
        c.res.headers.set("X-RateLimit-Limit", rateCheck.limit.toString());
        c.res.headers.set("X-RateLimit-Remaining", "0");
        c.res.headers.set("X-RateLimit-Reset", rateCheck.resetTime.toString());
        c.res.headers.set("Retry-After", (rateCheck.retryAfterSeconds ?? 60).toString());

        return errorResponse(c, 429, {
            success: false,
            error: `Rate limit exceeded. Try again in ${rateCheck.retryAfterSeconds} seconds.`,
            code: "RATE_LIMIT_EXCEEDED",
        });
    }

    c.res.headers.set("X-RateLimit-Limit", rateCheck.limit.toString());
    c.res.headers.set("X-RateLimit-Remaining", rateCheck.remaining.toString());
    c.res.headers.set("X-RateLimit-Reset", rateCheck.resetTime.toString());

    // Parse body
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return errorResponse(c, 400, {
            success: false,
            error: "Invalid JSON in request body",
            code: "INVALID_JSON",
        });
    }

    // Validate + sanitize
    const validation = validateChatInput(body, ip);
    if (!validation.success) {
        return errorResponse(c, 400, validation);
    }

    const { message, threadId } = validation.data;
    const thread = threadId || randomUUID();

    const config = {
        configurable: { thread_id: thread },
    };

    const initialState = {
        messages: [new HumanMessage(message)],
    };

    return streamSSE(c, async (stream) => {
        try {
            await stream.writeSSE({
                data: JSON.stringify({ type: "thread", threadId: thread }),
                event: "thread",
            });

            const eventStream = graph.streamEvents(initialState, {
                ...config,
                version: "v2",
            });

            let currentAgent: string | null = null;
            let previousAgent: string | null = null;

            for await (const event of eventStream) {
                // Agent started processing
                if (
                    event.event === "on_chain_start" &&
                    event.name &&
                    HIVE_MEMBERS.includes(event.name as typeof HIVE_MEMBERS[number])
                ) {
                    previousAgent = currentAgent;
                    currentAgent = event.name;

                    await stream.writeSSE({
                        data: JSON.stringify({
                            type: "agent_start",
                            agent: event.name,
                            timestamp: Date.now(),
                        }),
                        event: "agent_start",
                    });

                    if (previousAgent && previousAgent !== currentAgent) {
                        await stream.writeSSE({
                            data: JSON.stringify({
                                type: "handoff",
                                from: previousAgent,
                                to: currentAgent,
                                timestamp: Date.now(),
                            }),
                            event: "handoff",
                        });
                    }
                }

                // Agent finished processing
                if (
                    event.event === "on_chain_end" &&
                    event.name &&
                    HIVE_MEMBERS.includes(event.name as typeof HIVE_MEMBERS[number])
                ) {
                    await stream.writeSSE({
                        data: JSON.stringify({
                            type: "agent_end",
                            agent: event.name,
                            timestamp: Date.now(),
                        }),
                        event: "agent_end",
                    });

                    const content = event.data?.output?.messages?.[0]?.content;
                    if (content) {
                        await stream.writeSSE({
                            data: JSON.stringify({
                                type: "agent",
                                agent: event.name,
                                content: content,
                            }),
                            event: "agent",
                        });
                    }
                }

                // Stream content chunks
                if (event.event === "on_chat_model_stream") {
                    const chunk = event.data?.chunk?.content;
                    if (chunk) {
                        await stream.writeSSE({
                            data: JSON.stringify({
                                type: "chunk",
                                content: chunk,
                                agent: currentAgent,
                            }),
                            event: "chunk",
                        });
                    }
                }
            }

            await stream.writeSSE({
                data: JSON.stringify({ type: "done" }),
                event: "done",
            });
        } catch (error) {
            console.error("❌ Stream error:", error);
            await stream.writeSSE({
                data: JSON.stringify({
                    type: "error",
                    error: "An error occurred processing your request.",
                }),
                event: "error",
            });
        }
    });
});

export default chatRouter;
