/**
 * Structured Logger for HIVE-R
 *
 * Pino-based JSON logger with:
 * - JSON output in production (for ELK / Datadog)
 * - Pretty-print in development (pino-pretty)
 * - Environment-based log levels
 * - Child loggers for request/agent context
 * - Convenience methods for agent lifecycle events
 *
 * @module logger
 */
import pino from "pino";
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal" | "silent";
interface HiveLogger extends pino.Logger {
    agentStart: (agentName: string, context?: Record<string, unknown>) => void;
    agentEnd: (agentName: string, duration: number, context?: Record<string, unknown>) => void;
    agentError: (agentName: string, error: Error, context?: Record<string, unknown>) => void;
    routingDecision: (from: string, to: string, reasoning: string) => void;
    toolCall: (toolName: string, agentName: string, input?: unknown) => void;
    toolResult: (toolName: string, agentName: string, success: boolean, duration: number) => void;
    safetyTrigger: (reason: string, context?: Record<string, unknown>) => void;
}
/**
 * The main logger singleton.
 *
 * Usage:
 *   import { logger } from "../lib/logger.js";
 *   logger.info("Server started");
 *   logger.info({ port: 3000 }, "Server started");
 *   logger.agentStart("Builder", { threadId });
 *
 * To add per-request context:
 *   const reqLogger = logger.child({ requestId, userId });
 *   reqLogger.info("Processing chat request");
 */
export declare const logger: HiveLogger;
/**
 * Create a child logger scoped to a specific agent.
 * Adds `agentName` to every log line automatically.
 */
export declare function createAgentLogger(agentName: string, extra?: Record<string, unknown>): pino.Logger<never, boolean>;
export {};
//# sourceMappingURL=logger.d.ts.map