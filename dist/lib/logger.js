/**
 * Structured Logger for HIVE-R
 *
 * Provides consistent logging across all agents with:
 * - Agent lifecycle events (start/end)
 * - Tool calls
 * - Routing decisions
 * - Error tracking
 */
const LOG_COLORS = {
    debug: "\x1b[90m", // gray
    info: "\x1b[36m", // cyan
    warn: "\x1b[33m", // yellow
    error: "\x1b[31m", // red
    reset: "\x1b[0m",
};
function formatTimestamp() {
    return new Date().toISOString();
}
function formatLog(level, message, context) {
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
    level = "info";
    setLevel(level) {
        this.level = level;
    }
    shouldLog(level) {
        const levels = ["debug", "info", "warn", "error"];
        return levels.indexOf(level) >= levels.indexOf(this.level);
    }
    debug(message, context) {
        if (this.shouldLog("debug")) {
            console.log(formatLog("debug", message, context));
        }
    }
    info(message, context) {
        if (this.shouldLog("info")) {
            console.log(formatLog("info", message, context));
        }
    }
    warn(message, context) {
        if (this.shouldLog("warn")) {
            console.warn(formatLog("warn", message, context));
        }
    }
    error(message, context) {
        if (this.shouldLog("error")) {
            console.error(formatLog("error", message, context));
        }
    }
    // ✅ Agent lifecycle logging
    agentStart(agentName, context) {
        this.info(`🚀 Agent starting`, { agentName, ...context });
    }
    agentEnd(agentName, duration, context) {
        this.info(`✅ Agent completed`, { agentName, duration, ...context });
    }
    agentError(agentName, error, context) {
        this.error(`❌ Agent failed: ${error.message}`, {
            agentName,
            errorStack: error.stack?.split("\n").slice(0, 3).join(" "),
            ...context
        });
    }
    // ✅ Routing logging
    routingDecision(from, to, reasoning) {
        this.info(`🎯 Routing: ${from} → ${to}`, { reasoning });
    }
    // ✅ Tool logging
    toolCall(toolName, agentName, input) {
        this.debug(`🔧 Tool call: ${toolName}`, { agentName, input });
    }
    toolResult(toolName, agentName, success, duration) {
        const emoji = success ? "✓" : "✗";
        this.debug(`🔧 Tool ${emoji}: ${toolName}`, { agentName, success, duration });
    }
    // ✅ Safety logging
    safetyTrigger(reason, context) {
        this.warn(`⚠️ Safety triggered: ${reason}`, context);
    }
}
export const logger = new Logger();
// Set log level from environment
if (process.env.LOG_LEVEL) {
    logger.setLevel(process.env.LOG_LEVEL);
}
//# sourceMappingURL=logger.js.map