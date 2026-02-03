/**
 * Structured Logger for HIVE-R
 *
 * Provides consistent logging across all agents with:
 * - Agent lifecycle events (start/end)
 * - Tool calls
 * - Routing decisions
 * - Error tracking
 */
export type LogLevel = "debug" | "info" | "warn" | "error";
interface LogContext {
    agentName?: string;
    threadId?: string;
    turnCount?: number;
    toolName?: string;
    duration?: number;
    [key: string]: unknown;
}
declare class Logger {
    private level;
    setLevel(level: LogLevel): void;
    private shouldLog;
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext): void;
    agentStart(agentName: string, context?: Partial<LogContext>): void;
    agentEnd(agentName: string, duration: number, context?: Partial<LogContext>): void;
    agentError(agentName: string, error: Error, context?: Partial<LogContext>): void;
    routingDecision(from: string, to: string, reasoning: string): void;
    toolCall(toolName: string, agentName: string, input?: unknown): void;
    toolResult(toolName: string, agentName: string, success: boolean, duration: number): void;
    safetyTrigger(reason: string, context?: LogContext): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map