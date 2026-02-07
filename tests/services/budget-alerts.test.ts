/**
 * Tests for Budget Alert Service
 *
 * Tests alert logic, de-duplication, threshold checks,
 * Slack graceful failure, kill switch, and alert history.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================================
// MOCK DEPENDENCIES
// ============================================================================

const mockGetDailyCost = vi.fn();
const mockLoggerWarn = vi.fn();
const mockLoggerError = vi.fn();
const mockLoggerInfo = vi.fn();

vi.mock("../../src/lib/cost-tracker.js", () => ({
    getDailyCost: (...args: unknown[]) => mockGetDailyCost(...args),
}));

vi.mock("../../src/lib/logger.js", () => ({
    logger: {
        info: (...args: unknown[]) => mockLoggerInfo(...args),
        warn: (...args: unknown[]) => mockLoggerWarn(...args),
        error: (...args: unknown[]) => mockLoggerError(...args),
    },
}));

import {
    checkBudgetAlerts,
    getAlertHistory,
    _resetAlerts,
    startBudgetAlerts,
    stopBudgetAlerts,
    _isRunning,
} from "../../src/services/budget-alerts.js";

// ============================================================================
// TESTS
// ============================================================================

describe("checkBudgetAlerts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        _resetAlerts();
    });

    afterEach(() => {
        stopBudgetAlerts();
    });

    it("fires no alerts when under 50% budget", async () => {
        mockGetDailyCost.mockReturnValue({ totalCost: 10, callCount: 5 }); // 20% of $50

        const alerts = await checkBudgetAlerts();
        expect(alerts).toHaveLength(0);
    });

    it("fires 50% alert when at 50% budget", async () => {
        mockGetDailyCost.mockReturnValue({ totalCost: 25, callCount: 10 }); // 50% of $50

        const alerts = await checkBudgetAlerts();
        expect(alerts).toHaveLength(1);
        expect(alerts[0]!.threshold).toBe(50);
        expect(alerts[0]!.level).toBe("warning");
        expect(alerts[0]!.channels).toContain("console");
        expect(alerts[0]!.channels).toContain("logger");
    });

    it("fires multiple alerts when past multiple thresholds", async () => {
        mockGetDailyCost.mockReturnValue({ totalCost: 55, callCount: 20 }); // 110% of $50

        const alerts = await checkBudgetAlerts();

        // Should fire 50%, 80%, 100% (not 120% since 110 < 120)
        expect(alerts).toHaveLength(3);
        expect(alerts.map(a => a.threshold)).toEqual([50, 80, 100]);
    });

    it("fires all 4 alerts when at 120%+", async () => {
        mockGetDailyCost.mockReturnValue({ totalCost: 65, callCount: 30 }); // 130% of $50

        const alerts = await checkBudgetAlerts();
        expect(alerts).toHaveLength(4);
        expect(alerts.map(a => a.threshold)).toEqual([50, 80, 100, 120]);
    });

    it("does NOT duplicate alerts on subsequent checks", async () => {
        mockGetDailyCost.mockReturnValue({ totalCost: 25, callCount: 10 });

        const first = await checkBudgetAlerts();
        expect(first).toHaveLength(1);

        // Second check at same level — should fire nothing new
        const second = await checkBudgetAlerts();
        expect(second).toHaveLength(0);
    });

    it("fires NEW threshold but not old ones", async () => {
        mockGetDailyCost.mockReturnValue({ totalCost: 25, callCount: 10 }); // 50%
        await checkBudgetAlerts();

        mockGetDailyCost.mockReturnValue({ totalCost: 42, callCount: 15 }); // 84%
        const alerts = await checkBudgetAlerts();

        expect(alerts).toHaveLength(1);
        expect(alerts[0]!.threshold).toBe(80);
    });

    it("handles getDailyCost failure gracefully", async () => {
        mockGetDailyCost.mockImplementation(() => { throw new Error("DB error"); });

        const alerts = await checkBudgetAlerts();
        expect(alerts).toHaveLength(0);
        expect(mockLoggerWarn).toHaveBeenCalled();
    });

    it("stores alerts in history", async () => {
        mockGetDailyCost.mockReturnValue({ totalCost: 55, callCount: 20 });

        await checkBudgetAlerts();

        const history = getAlertHistory();
        expect(history.alerts).toHaveLength(3); // 50%, 80%, 100%
        expect(history.alerts[0]!.threshold).toBe(100); // Most recent first
    });
});

describe("getAlertHistory", () => {
    beforeEach(() => {
        _resetAlerts();
    });

    it("returns empty alerts and config when no alerts fired", () => {
        const history = getAlertHistory();

        expect(history.alerts).toEqual([]);
        expect(history.config.enabled).toBe(true);
        expect(history.config.budget).toBe(50);
        expect(history.config.thresholds).toEqual([50, 80, 100, 120]);
        expect(history.config.checkIntervalMinutes).toBe(10);
        expect(history.firedToday).toEqual([]);
    });

    it("respects limit parameter", async () => {
        mockGetDailyCost.mockReturnValue({ totalCost: 65, callCount: 30 });
        await checkBudgetAlerts();

        const limited = getAlertHistory(2);
        expect(limited.alerts).toHaveLength(2);
    });

    it("tracks firedToday correctly", async () => {
        mockGetDailyCost.mockReturnValue({ totalCost: 42, callCount: 15 });
        await checkBudgetAlerts();

        const history = getAlertHistory();
        expect(history.firedToday).toContain(50);
        expect(history.firedToday).toContain(80);
        expect(history.firedToday).not.toContain(100);
    });
});

describe("startBudgetAlerts / stopBudgetAlerts", () => {
    beforeEach(() => {
        _resetAlerts();
        stopBudgetAlerts();
    });

    afterEach(() => {
        stopBudgetAlerts();
    });

    it("starts and stops the service", () => {
        mockGetDailyCost.mockReturnValue({ totalCost: 0, callCount: 0 });

        startBudgetAlerts();
        expect(_isRunning()).toBe(true);

        stopBudgetAlerts();
        expect(_isRunning()).toBe(false);
    });

    it("prevents duplicate starts", () => {
        mockGetDailyCost.mockReturnValue({ totalCost: 0, callCount: 0 });

        startBudgetAlerts();
        startBudgetAlerts(); // should warn, not double-start

        expect(mockLoggerWarn).toHaveBeenCalledWith(
            "🔔 Budget alerts already running, skipping duplicate start"
        );
    });
});

describe("_resetAlerts", () => {
    it("clears all state", async () => {
        mockGetDailyCost.mockReturnValue({ totalCost: 30, callCount: 10 });
        await checkBudgetAlerts();

        _resetAlerts();

        const history = getAlertHistory();
        expect(history.alerts).toHaveLength(0);
        expect(history.firedToday).toHaveLength(0);
    });
});
