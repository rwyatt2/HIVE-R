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
import { getSecret } from "./secrets.js";
// ============================================================================
// TRACE STORE (In-Memory)
// ============================================================================
const traces = new Map();
const activeSpans = new Map();
// Keep last 100 traces
const MAX_TRACES = 100;
function generateSpanId() {
    return `span_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
// ============================================================================
// TRACE OPERATIONS
// ============================================================================
/**
 * Start a new conversation trace
 */
export function startTrace(threadId) {
    const trace = {
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
        if (oldest)
            traces.delete(oldest);
    }
    logger.debug({ threadId }, "📊 Trace started");
    return trace;
}
/**
 * End a conversation trace
 */
export function endTrace(threadId, status = "completed", error) {
    const trace = traces.get(threadId);
    if (trace) {
        trace.endTime = Date.now();
        trace.status = status;
        if (error)
            trace.error = error;
        logger.debug({ threadId, status, duration: trace.endTime - trace.startTime }, "📊 Trace ended");
    }
}
/**
 * Start a span within a trace
 */
export function startSpan(threadId, name, type, input, parentId) {
    const spanId = generateSpanId();
    const span = {
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
        }
        else {
            trace.spans.push(span);
        }
        // Track agents
        if (type === "agent" && !trace.agents.includes(name)) {
            trace.agents.push(name);
        }
    }
    logger.debug({ spanId, type }, `📊 Span started: ${name}`);
    return spanId;
}
/**
 * End a span
 */
export function endSpan(spanId, output, error, metadata) {
    const span = activeSpans.get(spanId);
    if (span) {
        span.endTime = Date.now();
        span.duration = span.endTime - span.startTime;
        span.output = output;
        if (error)
            span.error = error;
        if (metadata)
            span.metadata = metadata;
        activeSpans.delete(spanId);
        logger.debug({ spanId, duration: span.duration, error: !!error }, `📊 Span ended: ${span.name}`);
    }
}
/**
 * Find a span by ID in nested structure
 */
function findSpan(spans, id) {
    for (const span of spans) {
        if (span.id === id)
            return span;
        const found = findSpan(span.children, id);
        if (found)
            return found;
    }
    return null;
}
// ============================================================================
// TRACE RETRIEVAL
// ============================================================================
/**
 * Get trace for a thread
 */
export function getTrace(threadId) {
    return traces.get(threadId) ?? null;
}
/**
 * Get all traces
 */
export function getAllTraces() {
    return Array.from(traces.values())
        .sort((a, b) => b.startTime - a.startTime);
}
/**
 * Get trace summary
 */
export function getTraceSummary(trace) {
    const countSpans = (spans) => {
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
const LANGSMITH_API_KEY = getSecret("LANGSMITH_API_KEY");
const LANGSMITH_PROJECT = process.env.LANGSMITH_PROJECT ?? "hive-r";
/**
 * Check if LangSmith is configured
 */
export function isLangSmithEnabled() {
    return !!LANGSMITH_API_KEY;
}
/**
 * Send trace to LangSmith (if configured)
 */
export async function sendToLangSmith(trace) {
    if (!LANGSMITH_API_KEY)
        return;
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
        logger.debug({ threadId: trace.threadId }, "📊 Sent trace to LangSmith");
    }
    catch (error) {
        logger.warn({ error: error.message }, "Failed to send trace to LangSmith");
    }
}
// ============================================================================
// TRACING HELPERS
// ============================================================================
/**
 * Wrap an async function with tracing
 */
export function withTracing(threadId, name, type, fn) {
    const spanId = startSpan(threadId, name, type);
    return fn()
        .then(result => {
        endSpan(spanId, result);
        return result;
    })
        .catch(error => {
        endSpan(spanId, undefined, error.message);
        throw error;
    });
}
/**
 * Create a traced agent wrapper
 */
export function createTracedAgent(agentName, agentFn) {
    return async (input, threadId) => {
        return withTracing(threadId, agentName, "agent", () => agentFn(input));
    };
}
//# sourceMappingURL=tracing.js.map