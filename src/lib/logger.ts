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

const LOG_COLORS = {
    debug: "\x1b[90m",   // gray
    info: "\x1b[36m",    // cyan
    warn: "\x1b[33m",    // yellow
    error: "\x1b[31m",   // red
    reset: "\x1b[0m",
};

function formatTimestamp(): string {
    return new Date().toISOString();
}

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = formatTimestamp();
    const color = LOG_COLORS[level];
    const reset = LOG_COLORS.reset;

    let logLine = `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`;

    if (context) {
        const contextStr = Object.entries(context)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
            .join(" ");
        if (contextStr) {
            logLine += ` ${color}${contextStr}${reset}`;
        }
    }

    return logLine;
}

class Logger {
    private level: LogLevel = "info";

    setLevel(level: LogLevel) {
        this.level = level;
    }

    private shouldLog(level: LogLevel): boolean {
        const levels = ["debug", "info", "warn", "error"];
        return levels.indexOf(level) >= levels.indexOf(this.level);
    }

    debug(message: string, context?: LogContext) {
        if (this.shouldLog("debug")) {
            console.log(formatLog("debug", message, context));
        }
    }

    info(message: string, context?: LogContext) {
        if (this.shouldLog("info")) {
            console.log(formatLog("info", message, context));
        }
    }

    warn(message: string, context?: LogContext) {
        if (this.shouldLog("warn")) {
            console.warn(formatLog("warn", message, context));
        }
    }

    error(message: string, context?: LogContext) {
        if (this.shouldLog("error")) {
            console.error(formatLog("error", message, context));
        }
    }

    // ✅ Agent lifecycle logging
    agentStart(agentName: string, context?: Partial<LogContext>) {
        this.info(`🚀 Agent starting`, { agentName, ...context });
    }

    agentEnd(agentName: string, duration: number, context?: Partial<LogContext>) {
        this.info(`✅ Agent completed`, { agentName, duration, ...context });
    }

    agentError(agentName: string, error: Error, context?: Partial<LogContext>) {
        this.error(`❌ Agent failed: ${error.message}`, {
            agentName,
            errorStack: error.stack?.split("\n").slice(0, 3).join(" "),
            ...context
        });
    }

    // ✅ Routing logging
    routingDecision(from: string, to: string, reasoning: string) {
        this.info(`🎯 Routing: ${from} → ${to}`, { reasoning });
    }

    // ✅ Tool logging
    toolCall(toolName: string, agentName: string, input?: unknown) {
        this.debug(`🔧 Tool call: ${toolName}`, { agentName, input });
    }

    toolResult(toolName: string, agentName: string, success: boolean, duration: number) {
        const emoji = success ? "✓" : "✗";
        this.debug(`🔧 Tool ${emoji}: ${toolName}`, { agentName, success, duration });
    }

    // ✅ Safety logging
    safetyTrigger(reason: string, context?: LogContext) {
        this.warn(`⚠️ Safety triggered: ${reason}`, context);
    }
}

export const logger = new Logger();

// Set log level from environment
if (process.env.LOG_LEVEL) {
    logger.setLevel(process.env.LOG_LEVEL as LogLevel);
}
