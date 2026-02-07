/**
 * Secrets Management Tests
 *
 * Tests for the unified secrets loader.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    getSecret,
    requireSecret,
    maskSecret,
    hasSecret,
    getSecretsMode,
    clearSecretCache,
} from "../../src/lib/secrets.js";

// ============================================================================
// MASKING
// ============================================================================

describe("maskSecret", () => {
    it("masks long secrets showing first 4 and last 4", () => {
        expect(maskSecret("sk-proj-abc123xyz789")).toBe("sk-p...z789");
    });

    it("masks medium secrets", () => {
        expect(maskSecret("abcdefgh")).toBe("a...h");
    });

    it("masks short secrets", () => {
        expect(maskSecret("short")).toBe("s...t");
    });

    it("returns *** for very short/empty values", () => {
        expect(maskSecret("")).toBe("***");
        expect(maskSecret("ab")).toBe("***");
    });
});

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

describe("getSecretsMode", () => {
    const originalEnv = process.env;

    afterEach(() => {
        process.env = originalEnv;
    });

    it("returns 'env' when no /run/secrets and no K8s", () => {
        // In test environment, /run/secrets shouldn't exist
        expect(getSecretsMode()).toBe("env");
    });

    it("returns 'kubernetes' when KUBERNETES_SERVICE_HOST is set", () => {
        process.env = { ...originalEnv, KUBERNETES_SERVICE_HOST: "10.0.0.1" };
        expect(getSecretsMode()).toBe("kubernetes");
    });
});

// ============================================================================
// getSecret (env mode)
// ============================================================================

describe("getSecret (env mode)", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        clearSecretCache();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("reads from process.env in env mode", () => {
        process.env = { ...originalEnv, OPENAI_API_KEY: "test-key-123" };
        expect(getSecret("OPENAI_API_KEY")).toBe("test-key-123");
    });

    it("returns undefined for missing secrets", () => {
        process.env = { ...originalEnv };
        delete process.env.NONEXISTENT_SECRET;
        expect(getSecret("NONEXISTENT_SECRET")).toBeUndefined();
    });

    it("returns undefined for empty string secrets", () => {
        process.env = { ...originalEnv, EMPTY_SECRET: "" };
        expect(getSecret("EMPTY_SECRET")).toBeUndefined();
    });
});

// ============================================================================
// requireSecret
// ============================================================================

describe("requireSecret", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        clearSecretCache();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("returns secret when it exists", () => {
        process.env = { ...originalEnv, TEST_SECRET: "value" };
        expect(requireSecret("TEST_SECRET")).toBe("value");
    });

    it("throws with helpful message when secret is missing", () => {
        process.env = { ...originalEnv };
        delete process.env.MISSING_REQUIRED;
        expect(() => requireSecret("MISSING_REQUIRED")).toThrow(
            /Required secret "MISSING_REQUIRED" is not configured/
        );
    });

    it("includes setup hint in error message", () => {
        process.env = { ...originalEnv };
        delete process.env.OPENAI_API_KEY;
        expect(() => requireSecret("OPENAI_API_KEY")).toThrow(/\.env file/);
    });
});

// ============================================================================
// hasSecret
// ============================================================================

describe("hasSecret", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        clearSecretCache();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("returns true when secret is configured", () => {
        process.env = { ...originalEnv, HIVE_API_KEY: "key" };
        expect(hasSecret("HIVE_API_KEY")).toBe(true);
    });

    it("returns false when secret is missing", () => {
        process.env = { ...originalEnv };
        delete process.env.MISSING_KEY;
        expect(hasSecret("MISSING_KEY")).toBe(false);
    });
});
