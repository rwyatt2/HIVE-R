/**
 * Tracing & Observability for HIVE-R
 * 
 * Provides:
 * - LangSmith integration (if LANGSMITH_API_KEY is set)
 * - OpenTelemetry-compatible spans
 * - Agent execution traces
 * - Tool call logging
 * - Conversation replay data
 */

import { logger } from "./logger.js";

// ============================================================================
// TRACE TYPES
// ============================================================================

export interface TraceSpan {
    id: string;
    name: string;
    type: "agent" | "tool" | "router" | "subgraph";
    startTime: number;
    endTime?: number;
    duration?: number;
    input?: unknown;
    output?: unknown;
    metadata?: Record<string, unknown>;
    error?: string;
    parentId?: string | undefined;
    children: TraceSpan[];
}

export interface ConversationTrace {
    threadId: string;
    startTime: number;
    endTime?: number;
    spans: TraceSpan[];
    turnCount: number;
    agents: string[];
    status: "running" | "completed" | "failed";
    error?: string;
}

// ============================================================================
// TRACE STORE (In-Memory)
// ============================================================================

const traces: Map<string, ConversationTrace> = new Map();
const activeSpans: Map<string, TraceSpan> = new Map();

// Keep last 100 traces
const MAX_TRACES = 100;

function generateSpanId(): string {
    return `span_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// TRACE OPERATIONS
// ============================================================================

/**
 * Start a new conversation trace
 */
export function startTrace(threadId: string): ConversationTrace {
    const trace: ConversationTrace = {
        threadId,
        startTime: Date.now(),
        spans: [],
        turnCount: 0,
        agents: [],
        status: "running",
    };

    traces.set(threadId, trace);

    // Cleanup old traces
    if (traces.size > MAX_TRACES) {
        const oldest = Array.from(traces.keys())[0];
        if (oldest) traces.delete(oldest);
    }

    logger.debug("📊 Trace started", { threadId });
    return trace;
}

/**
 * End a conversation trace
 */
export function endTrace(threadId: string, status: "completed" | "failed" = "completed", error?: string): void {
    const trace = traces.get(threadId);
    if (trace) {
        trace.endTime = Date.now();
        trace.status = status;
        if (error) trace.error = error;
        logger.debug("📊 Trace ended", { threadId, status, duration: trace.endTime - trace.startTime });
    }
}

/**
 * Start a span within a trace
 */
export function startSpan(
    threadId: string,
    name: string,
    type: TraceSpan["type"],
    input?: unknown,
    parentId?: string
): string {
    const spanId = generateSpanId();

    const span: TraceSpan = {
        id: spanId,
        name,
        type,
        startTime: Date.now(),
        input,
        parentId,
        children: [],
    };

    activeSpans.set(spanId, span);

    // Add to trace
    const trace = traces.get(threadId);
    if (trace) {
        if (parentId) {
            const parent = findSpan(trace.spans, parentId);
            if (parent) {
                parent.children.push(span);
            }
        } else {
            trace.spans.push(span);
        }

        // Track agents
        if (type === "agent" && !trace.agents.includes(name)) {
            trace.agents.push(name);
        }
    }

    logger.debug(`📊 Span started: ${name}`, { spanId, type });
    return spanId;
}

/**
 * End a span
 */
export function endSpan(
    spanId: string,
    output?: unknown,
    error?: string,
    metadata?: Record<string, unknown>
): void {
    const span = activeSpans.get(spanId);
    if (span) {
        span.endTime = Date.now();
        span.duration = span.endTime - span.startTime;
        span.output = output;
        if (error) span.error = error;
        if (metadata) span.metadata = metadata;

        activeSpans.delete(spanId);
        logger.debug(`📊 Span ended: ${span.name}`, { spanId, duration: span.duration, error: !!error });
    }
}

/**
 * Find a span by ID in nested structure
 */
function findSpan(spans: TraceSpan[], id: string): TraceSpan | null {
    for (const span of spans) {
        if (span.id === id) return span;
        const found = findSpan(span.children, id);
        if (found) return found;
    }
    return null;
}

// ============================================================================
// TRACE RETRIEVAL
// ============================================================================

/**
 * Get trace for a thread
 */
export function getTrace(threadId: string): ConversationTrace | null {
    return traces.get(threadId) ?? null;
}

/**
 * Get all traces
 */
export function getAllTraces(): ConversationTrace[] {
    return Array.from(traces.values())
        .sort((a, b) => b.startTime - a.startTime);
}

/**
 * Get trace summary
 */
export function getTraceSummary(trace: ConversationTrace): {
    threadId: string;
    duration: number;
    spanCount: number;
    agentCount: number;
    agents: string[];
    status: string;
    hasError: boolean;
} {
    const countSpans = (spans: TraceSpan[]): number => {
        return spans.reduce((acc, span) => acc + 1 + countSpans(span.children), 0);
    };

    return {
        threadId: trace.threadId,
        duration: (trace.endTime ?? Date.now()) - trace.startTime,
        spanCount: countSpans(trace.spans),
        agentCount: trace.agents.length,
        agents: trace.agents,
        status: trace.status,
        hasError: !!trace.error,
    };
}

// ============================================================================
// LANGSMITH INTEGRATION (Optional)
// ============================================================================

const LANGSMITH_API_KEY = process.env.LANGSMITH_API_KEY;
const LANGSMITH_PROJECT = process.env.LANGSMITH_PROJECT ?? "hive-r";

/**
 * Check if LangSmith is configured
 */
export function isLangSmithEnabled(): boolean {
    return !!LANGSMITH_API_KEY;
}

/**
 * Send trace to LangSmith (if configured)
 */
export async function sendToLangSmith(trace: ConversationTrace): Promise<void> {
    if (!LANGSMITH_API_KEY) return;

    try {
        // LangSmith expects specific format - this is a simplified version
        const payload = {
            project_name: LANGSMITH_PROJECT,
            runs: trace.spans.map(span => ({
                id: span.id,
                name: span.name,
                run_type: span.type,
                inputs: span.input,
                outputs: span.output,
                start_time: new Date(span.startTime).toISOString(),
                end_time: span.endTime ? new Date(span.endTime).toISOString() : undefined,
                error: span.error,
                extra: span.metadata,
            })),
        };

        await fetch("https://api.smith.langchain.com/runs/batch", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": LANGSMITH_API_KEY,
            },
            body: JSON.stringify(payload),
        });

        logger.debug("📊 Sent trace to LangSmith", { threadId: trace.threadId });
    } catch (error) {
        logger.warn("Failed to send trace to LangSmith", { error: (error as Error).message });
    }
}

// ============================================================================
// TRACING HELPERS
// ============================================================================

/**
 * Wrap an async function with tracing
 */
export function withTracing<T>(
    threadId: string,
    name: string,
    type: TraceSpan["type"],
    fn: () => Promise<T>
): Promise<T> {
    const spanId = startSpan(threadId, name, type);

    return fn()
        .then(result => {
            endSpan(spanId, result);
            return result;
        })
        .catch(error => {
            endSpan(spanId, undefined, (error as Error).message);
            throw error;
        });
}

/**
 * Create a traced agent wrapper
 */
export function createTracedAgent<TInput, TOutput>(
    agentName: string,
    agentFn: (input: TInput) => Promise<TOutput>
): (input: TInput, threadId: string) => Promise<TOutput> {
    return async (input: TInput, threadId: string) => {
        return withTracing(threadId, agentName, "agent", () => agentFn(input));
    };
}
