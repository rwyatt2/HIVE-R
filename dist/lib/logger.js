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
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const IS_TEST = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
const LOG_LEVEL = process.env.LOG_LEVEL || (IS_PRODUCTION ? "info" : IS_TEST ? "silent" : "debug");
/**
 * Create the base Pino logger instance.
 *
 * - Production: JSON to stdout (one line per log, for log aggregation)
 * - Development: Pretty-printed, colored output via pino-pretty transport
 * - Test: Silent by default (override with LOG_LEVEL=debug)
 */
function createBaseLogger() {
    const baseOptions = {
        level: LOG_LEVEL,
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
            level(label) {
                return { level: label };
            },
        },
        // Redact sensitive fields that might leak into logs
        redact: {
            paths: [
                "apiKey",
                "password",
                "secret",
                "token",
                "authorization",
                "OPENAI_API_KEY",
                "ANTHROPIC_API_KEY",
                "req.headers.authorization",
            ],
            censor: "[REDACTED]",
        },
    };
    // In development, use pino-pretty transport for readable output
    if (!IS_PRODUCTION && !IS_TEST) {
        return pino({
            ...baseOptions,
            transport: {
                target: "pino-pretty",
                options: {
                    colorize: true,
                    translateTime: "HH:MM:ss.l",
                    ignore: "pid,hostname",
                    singleLine: false,
                },
            },
        });
    }
    // Production / test: plain JSON to stdout
    return pino(baseOptions);
}
const baseLogger = createBaseLogger();
// Attach convenience methods to the logger object
const hiveLogger = baseLogger;
hiveLogger.agentStart = (agentName, context) => {
    baseLogger.info({ agentName, event: "agent_start", ...context }, `Agent starting: ${agentName}`);
};
hiveLogger.agentEnd = (agentName, duration, context) => {
    baseLogger.info({ agentName, event: "agent_end", duration, ...context }, `Agent completed: ${agentName}`);
};
hiveLogger.agentError = (agentName, error, context) => {
    baseLogger.error({ agentName, event: "agent_error", err: error, ...context }, `Agent failed: ${agentName} — ${error.message}`);
};
hiveLogger.routingDecision = (from, to, reasoning) => {
    baseLogger.info({ event: "routing", from, to, reasoning }, `Routing: ${from} → ${to}`);
};
hiveLogger.toolCall = (toolName, agentName, input) => {
    baseLogger.debug({ event: "tool_call", toolName, agentName, input }, `Tool call: ${toolName}`);
};
hiveLogger.toolResult = (toolName, agentName, success, duration) => {
    baseLogger.debug({ event: "tool_result", toolName, agentName, success, duration }, `Tool ${success ? "✓" : "✗"}: ${toolName}`);
};
hiveLogger.safetyTrigger = (reason, context) => {
    baseLogger.warn({ event: "safety_trigger", ...context }, `Safety triggered: ${reason}`);
};
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
export const logger = hiveLogger;
/**
 * Create a child logger scoped to a specific agent.
 * Adds `agentName` to every log line automatically.
 */
export function createAgentLogger(agentName, extra) {
    return baseLogger.child({ agentName, ...extra });
}
//# sourceMappingURL=logger.js.map