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
/**
 * Start a new conversation trace
 */
export declare function startTrace(threadId: string): ConversationTrace;
/**
 * End a conversation trace
 */
export declare function endTrace(threadId: string, status?: "completed" | "failed", error?: string): void;
/**
 * Start a span within a trace
 */
export declare function startSpan(threadId: string, name: string, type: TraceSpan["type"], input?: unknown, parentId?: string): string;
/**
 * End a span
 */
export declare function endSpan(spanId: string, output?: unknown, error?: string, metadata?: Record<string, unknown>): void;
/**
 * Get trace for a thread
 */
export declare function getTrace(threadId: string): ConversationTrace | null;
/**
 * Get all traces
 */
export declare function getAllTraces(): ConversationTrace[];
/**
 * Get trace summary
 */
export declare function getTraceSummary(trace: ConversationTrace): {
    threadId: string;
    duration: number;
    spanCount: number;
    agentCount: number;
    agents: string[];
    status: string;
    hasError: boolean;
};
/**
 * Check if LangSmith is configured
 */
export declare function isLangSmithEnabled(): boolean;
/**
 * Send trace to LangSmith (if configured)
 */
export declare function sendToLangSmith(trace: ConversationTrace): Promise<void>;
/**
 * Wrap an async function with tracing
 */
export declare function withTracing<T>(threadId: string, name: string, type: TraceSpan["type"], fn: () => Promise<T>): Promise<T>;
/**
 * Create a traced agent wrapper
 */
export declare function createTracedAgent<TInput, TOutput>(agentName: string, agentFn: (input: TInput) => Promise<TOutput>): (input: TInput, threadId: string) => Promise<TOutput>;
//# sourceMappingURL=tracing.d.ts.map