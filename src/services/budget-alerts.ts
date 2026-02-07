/**
 * Budget Alert Service
 *
 * Proactively monitors LLM spending and fires alerts at configurable thresholds.
 * Checks every 10 minutes, de-duplicates per day, and supports multiple channels:
 *   - Console logging (always)
 *   - File logging via logger (always)
 *   - Slack webhook (if SLACK_WEBHOOK_URL configured)
 *
 * Kill switch: set BUDGET_ALERTS_ENABLED=false to disable.
 *
 * Usage:
 *   import { startBudgetAlerts, stopBudgetAlerts, getAlertHistory } from "./services/budget-alerts.js";
 *   startBudgetAlerts();  // Called on server boot
 */

import { getDailyCost } from "../lib/cost-tracker.js";
import { logger } from "../lib/logger.js";

// ============================================================================
// Configuration
// ============================================================================

const CHECK_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const DAILY_BUDGET = parseFloat(process.env.DAILY_BUDGET || "50");
const ALERTS_ENABLED = process.env.BUDGET_ALERTS_ENABLED !== "false";
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "";

/** Alert thresholds as percentage of daily budget */
const THRESHOLDS = [
    { percent: 50, emoji: "⚠️", level: "warning" as const, label: "50% Budget Warning" },
    { percent: 80, emoji: "🔶", level: "warning" as const, label: "80% Budget Caution" },
    { percent: 100, emoji: "🚨", level: "critical" as const, label: "100% Budget Reached" },
    { percent: 120, emoji: "💥", level: "critical" as const, label: "120% Budget Exceeded" },
];

// ============================================================================
// State
// ============================================================================

/** Track which thresholds have been fired today to prevent duplicate alerts */
const firedToday = new Map<number, boolean>();

/** Alert history for the API endpoint */
export interface AlertRecord {
    id: string;
    threshold: number;
    level: "warning" | "critical";
    label: string;
    costAtAlert: number;
    budget: number;
    percent: number;
    channels: string[];
    firedAt: string;
}

const alertHistory: AlertRecord[] = [];
const MAX_HISTORY = 200;

/** Interval handle */
let intervalHandle: ReturnType<typeof setInterval> | null = null;

/** Current day tracking (reset fired alerts at midnight) */
let currentDay = "";

// ============================================================================
// Alert Channels
// ============================================================================

/**
 * Send alert to Slack via webhook (graceful failure).
 */
async function sendSlackAlert(alert: AlertRecord): Promise<boolean> {
    if (!SLACK_WEBHOOK_URL) return false;

    try {
        const payload = {
            text: `${alert.label}`,
            blocks: [
                {
                    type: "header",
                    text: { type: "plain_text", text: `${THRESHOLDS.find(t => t.percent === alert.threshold)?.emoji || "⚠️"} HIVE-R Budget Alert`, emoji: true },
                },
                {
                    type: "section",
                    fields: [
                        { type: "mrkdwn", text: `*Alert:*\n${alert.label}` },
                        { type: "mrkdwn", text: `*Threshold:*\n${alert.threshold}%` },
                        { type: "mrkdwn", text: `*Current Spend:*\n$${alert.costAtAlert.toFixed(4)}` },
                        { type: "mrkdwn", text: `*Daily Budget:*\n$${alert.budget.toFixed(2)}` },
                    ],
                },
                {
                    type: "context",
                    elements: [
                        { type: "mrkdwn", text: `Fired at ${alert.firedAt}` },
                    ],
                },
            ],
        };

        const res = await fetch(SLACK_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            logger.warn("🔔 Slack alert delivery failed", { status: res.status, statusText: res.statusText });
            return false;
        }

        return true;
    } catch (err) {
        logger.warn("🔔 Slack alert error (graceful failure)", { error: (err as Error).message });
        return false;
    }
}

// ============================================================================
// Core Alert Logic
// ============================================================================

/**
 * Check current spend against thresholds and fire alerts if needed.
 * Called every 10 minutes by the interval.
 */
export async function checkBudgetAlerts(): Promise<AlertRecord[]> {
    // Reset tracking at midnight
    const today = new Date().toISOString().split("T")[0]!;
    if (today !== currentDay) {
        firedToday.clear();
        currentDay = today;
        logger.info("🔔 Budget alerts: new day, reset thresholds", { date: today });
    }

    // Get today's cost
    let dailyCost: { totalCost: number; callCount: number };
    try {
        dailyCost = getDailyCost();
    } catch (err) {
        logger.warn("🔔 Budget alert check failed: cannot read costs", { error: (err as Error).message });
        return [];
    }

    const currentPercent = (dailyCost.totalCost / DAILY_BUDGET) * 100;
    const firedAlerts: AlertRecord[] = [];

    for (const threshold of THRESHOLDS) {
        // Skip if already fired today or below threshold
        if (firedToday.get(threshold.percent) || currentPercent < threshold.percent) {
            continue;
        }

        // Mark as fired
        firedToday.set(threshold.percent, true);

        const alert: AlertRecord = {
            id: `alert-${today}-${threshold.percent}`,
            threshold: threshold.percent,
            level: threshold.level,
            label: threshold.label,
            costAtAlert: dailyCost.totalCost,
            budget: DAILY_BUDGET,
            percent: Math.round(currentPercent * 100) / 100,
            channels: [],
            firedAt: new Date().toISOString(),
        };

        // Channel 1: Console + Logger (always)
        const logMsg = `🔔 BUDGET ALERT: ${threshold.emoji} ${threshold.label} — $${dailyCost.totalCost.toFixed(4)} / $${DAILY_BUDGET} (${currentPercent.toFixed(1)}%)`;
        console.log(logMsg);

        if (threshold.level === "critical") {
            logger.error(logMsg, { alert });
        } else {
            logger.warn(logMsg, { alert });
        }
        alert.channels.push("console", "logger");

        // Channel 2: Slack (if configured)
        const slackSent = await sendSlackAlert(alert);
        if (slackSent) {
            alert.channels.push("slack");
        }

        // Store in history
        alertHistory.unshift(alert);
        if (alertHistory.length > MAX_HISTORY) {
            alertHistory.pop();
        }

        firedAlerts.push(alert);
    }

    return firedAlerts;
}

// ============================================================================
// Service Lifecycle
// ============================================================================

/**
 * Start the budget alert service. Called on server boot.
 * Runs an immediate check, then checks every 10 minutes.
 */
export function startBudgetAlerts(): void {
    if (!ALERTS_ENABLED) {
        logger.info("🔔 Budget alerts DISABLED (BUDGET_ALERTS_ENABLED=false)");
        return;
    }

    if (intervalHandle) {
        logger.warn("🔔 Budget alerts already running, skipping duplicate start");
        return;
    }

    logger.info("🔔 Budget alert service started", {
        budget: `$${DAILY_BUDGET}`,
        interval: "10 minutes",
        thresholds: THRESHOLDS.map(t => `${t.percent}%`).join(", "),
        slackEnabled: !!SLACK_WEBHOOK_URL,
    });

    // Run immediate check
    checkBudgetAlerts().catch(err => {
        logger.error("🔔 Initial budget check failed", { error: (err as Error).message });
    });

    // Schedule recurring checks
    intervalHandle = setInterval(() => {
        checkBudgetAlerts().catch(err => {
            logger.error("🔔 Budget check failed", { error: (err as Error).message });
        });
    }, CHECK_INTERVAL_MS);
}

/**
 * Stop the budget alert service.
 */
export function stopBudgetAlerts(): void {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
        logger.info("🔔 Budget alert service stopped");
    }
}

// ============================================================================
// API
// ============================================================================

/**
 * Get alert history for the admin endpoint.
 */
export function getAlertHistory(limit: number = 50): {
    alerts: AlertRecord[];
    config: {
        enabled: boolean;
        budget: number;
        thresholds: number[];
        slackConfigured: boolean;
        checkIntervalMinutes: number;
    };
    firedToday: number[];
} {
    return {
        alerts: alertHistory.slice(0, limit),
        config: {
            enabled: ALERTS_ENABLED,
            budget: DAILY_BUDGET,
            thresholds: THRESHOLDS.map(t => t.percent),
            slackConfigured: !!SLACK_WEBHOOK_URL,
            checkIntervalMinutes: CHECK_INTERVAL_MS / 60_000,
        },
        firedToday: Array.from(firedToday.entries())
            .filter(([_, fired]) => fired)
            .map(([pct]) => pct),
    };
}

// ============================================================================
// Testing Helpers
// ============================================================================

/** Reset state for testing */
export function _resetAlerts(): void {
    firedToday.clear();
    alertHistory.length = 0;
    currentDay = "";
}

/** Check if service is running */
export function _isRunning(): boolean {
    return intervalHandle !== null;
}
