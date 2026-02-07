/**
 * Secrets Management for HIVE-R
 * 
 * Unified secrets loader that auto-detects the environment:
 * - Development: reads from process.env (loaded via .env file)
 * - Docker: reads from /run/secrets/<name> (Docker Secrets)
 * - Kubernetes: reads from /run/secrets/<name> (K8s Secret volume mounts)
 * 
 * Usage:
 *   import { getSecret, requireSecret } from "./secrets.js";
 *   const apiKey = requireSecret("OPENAI_API_KEY");  // throws if missing
 *   const optional = getSecret("SENTRY_DSN");         // returns undefined if missing
 */

import { readFileSync, existsSync } from "fs";
import { logger } from "./logger.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Directory where Docker/K8s secrets are mounted */
const SECRETS_DIR = process.env.SECRETS_DIR || "/run/secrets";

/**
 * Maps environment variable names to their Docker/K8s secret file names.
 * Convention: ENV_VAR_NAME → lowercase_with_underscores
 */
const SECRET_FILE_MAP: Record<string, string> = {
    OPENAI_API_KEY: "openai_api_key",
    HIVE_API_KEY: "hive_api_key",
    JWT_SECRET: "jwt_secret",
    GITHUB_TOKEN: "github_token",
    LANGCHAIN_API_KEY: "langchain_api_key",
    LANGSMITH_API_KEY: "langsmith_api_key",
    STRIPE_SECRET_KEY: "stripe_secret_key",
    STRIPE_WEBHOOK_SECRET: "stripe_webhook_secret",
    SENTRY_DSN: "sentry_dsn",
    DATABASE_URL: "database_url",
};

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

export type SecretsMode = "env" | "docker" | "kubernetes";

/**
 * Detect which secrets backend to use.
 * - If KUBERNETES_SERVICE_HOST is set → kubernetes
 * - If /run/secrets/ directory exists → docker
 * - Otherwise → env (development)
 */
export function getSecretsMode(): SecretsMode {
    if (process.env.KUBERNETES_SERVICE_HOST) {
        return "kubernetes";
    }
    if (existsSync(SECRETS_DIR)) {
        return "docker";
    }
    return "env";
}

// ============================================================================
// SECRET CACHE
// ============================================================================

/** In-memory cache for file-based secrets (read once) */
const secretCache = new Map<string, string>();

/** Track which secrets have been loaded for startup logging */
const loadedSecrets = new Set<string>();

// ============================================================================
// CORE API
// ============================================================================

/**
 * Get a secret value. Returns undefined if not found.
 * 
 * Resolution order:
 * 1. In-memory cache (for file-based secrets)
 * 2. Docker/K8s secret file (/run/secrets/<name>)
 * 3. process.env (always checked as fallback)
 */
export function getSecret(name: string): string | undefined {
    // Check cache first
    if (secretCache.has(name)) {
        return secretCache.get(name);
    }

    const mode = getSecretsMode();

    // Try file-based secret (Docker / Kubernetes)
    if (mode !== "env") {
        const fileName = SECRET_FILE_MAP[name] || name.toLowerCase();
        const filePath = `${SECRETS_DIR}/${fileName}`;

        if (existsSync(filePath)) {
            try {
                const value = readFileSync(filePath, "utf-8").trim();
                secretCache.set(name, value);
                loadedSecrets.add(name);
                return value;
            } catch (error) {
                logger.error(`Failed to read secret file: ${filePath}`, {
                    error: (error as Error).message,
                } as any);
            }
        }
    }

    // Fallback to process.env (always works for dev, also works if
    // Docker Compose passes secrets via environment block)
    const envValue = process.env[name];
    if (envValue !== undefined && envValue !== "") {
        loadedSecrets.add(name);
        return envValue;
    }

    return undefined;
}

/**
 * Get a secret value, throwing if not found.
 * Use for secrets that are required for the application to function.
 */
export function requireSecret(name: string): string {
    const value = getSecret(name);
    if (value === undefined || value === "") {
        const mode = getSecretsMode();
        const hint = mode === "env"
            ? `Set ${name} in your .env file`
            : `Create secret file at ${SECRETS_DIR}/${SECRET_FILE_MAP[name] || name.toLowerCase()}`;

        throw new Error(
            `Required secret "${name}" is not configured. ${hint}`
        );
    }
    return value;
}

// ============================================================================
// MASKING
// ============================================================================

/**
 * Mask a secret value for safe logging.
 * Shows first 4 and last 4 characters, everything else is replaced with dots.
 * 
 * Examples:
 *   "sk-proj-abc123xyz789" → "sk-p...z789"
 *   "short" → "s...t"
 *   "" → "***"
 */
export function maskSecret(value: string): string {
    if (!value || value.length < 4) {
        return "***";
    }
    if (value.length <= 8) {
        return `${value[0]}...${value[value.length - 1]}`;
    }
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

// ============================================================================
// STARTUP DIAGNOSTICS
// ============================================================================

/**
 * Log which secrets mode is active and which secrets are loaded.
 * Call once at application startup.
 * 
 * IMPORTANT: Never logs actual secret values — only names and masked previews.
 */
export function logSecretsStatus(): void {
    const mode = getSecretsMode();

    logger.info(`🔐 Secrets mode: ${mode}`, {
        secretsDir: mode !== "env" ? SECRETS_DIR : undefined,
    } as any);

    // Pre-load all known secrets to populate the cache
    for (const name of Object.keys(SECRET_FILE_MAP)) {
        getSecret(name);
    }

    const loaded = Array.from(loadedSecrets);
    const missing = Object.keys(SECRET_FILE_MAP).filter(
        (name) => !loadedSecrets.has(name)
    );

    if (loaded.length > 0) {
        logger.info(`🔐 Secrets loaded: ${loaded.join(", ")}`);
    }

    // Only warn about critical missing secrets
    const criticalMissing = missing.filter((name) =>
        ["OPENAI_API_KEY"].includes(name)
    );
    if (criticalMissing.length > 0) {
        logger.warn(`🔐 Critical secrets missing: ${criticalMissing.join(", ")}`);
    }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if a secret is configured (without revealing its value).
 */
export function hasSecret(name: string): boolean {
    return getSecret(name) !== undefined;
}

/**
 * Get all configured secret names (not values).
 * Useful for health checks and diagnostics.
 */
export function getConfiguredSecrets(): string[] {
    // Trigger loading
    for (const name of Object.keys(SECRET_FILE_MAP)) {
        getSecret(name);
    }
    return Array.from(loadedSecrets);
}

/**
 * Clear the secret cache. Useful for testing or secret rotation.
 */
export function clearSecretCache(): void {
    secretCache.clear();
    loadedSecrets.clear();
}
