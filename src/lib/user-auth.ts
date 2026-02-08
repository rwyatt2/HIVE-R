/**
 * User Authentication for HIVE-R
 * 
 * Provides JWT-based authentication with:
 * - Email/password registration and login
 * - Access tokens (15 min) + Refresh tokens (7 days)
 * - Password hashing with bcrypt
 */

import Database from "better-sqlite3";
import { randomUUID, createHash, randomBytes } from "crypto";
import { mkdirSync, existsSync } from "fs";
import path from "path";
import { optimizeDatabase } from "./db-init.js";
import { getSecret } from "./secrets.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DB_PATH = process.env.DATABASE_PATH || "./data/hive.db";
const JWT_SECRET = getSecret("JWT_SECRET") || randomBytes(32).toString('hex');
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

// ============================================================================
// TYPES
// ============================================================================

export interface User {
    id: string;
    email: string;
    role: 'user' | 'system_owner';
    createdAt: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

interface JWTPayload {
    sub: string;
    email: string;
    iat: number;
    exp: number;
}

// ============================================================================
// DATABASE SETUP
// ============================================================================

let db: Database.Database | null = null;

export function getDb(): Database.Database {
    if (!db) {
        const dbDir = path.dirname(DB_PATH);
        if (!existsSync(dbDir)) {
            mkdirSync(dbDir, { recursive: true });
        }

        db = new Database(DB_PATH);
        optimizeDatabase(db);

        // Create auth tables
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user' CHECK(role IN ('user', 'system_owner')),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
        `);

        // Ensure role column exists for older databases
        const columns = db
            .prepare("PRAGMA table_info(users)")
            .all() as { name: string }[];
        const hasRole = columns.some((col) => col.name === "role");
        if (!hasRole) {
            db.exec(`
                ALTER TABLE users
                ADD COLUMN role TEXT DEFAULT 'user' CHECK(role IN ('user', 'system_owner'));
            `);
        }
    }
    return db;
}

// ============================================================================
// PASSWORD HASHING
// Using crypto instead of bcrypt to avoid native dependencies
// ============================================================================

function hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = createHash('sha256')
        .update(password + salt)
        .digest('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;

    const verifyHash = createHash('sha256')
        .update(password + salt)
        .digest('hex');
    return hash === verifyHash;
}

// ============================================================================
// JWT FUNCTIONS
// Simple JWT implementation without external dependencies
// ============================================================================

function base64UrlEncode(str: string): string {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    return Buffer.from(base64 + padding, 'base64').toString('utf8');
}

function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: number): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);

    const fullPayload: JWTPayload = {
        ...payload,
        iat: now,
        exp: now + expiresIn
    };

    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));

    const signature = createHash('sha256')
        .update(`${headerB64}.${payloadB64}.${JWT_SECRET}`)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifyJWT(token: string): JWTPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [headerB64, payloadB64, signature] = parts;

        if (!headerB64 || !payloadB64 || !signature) return null;

        // Verify signature
        const expectedSignature = createHash('sha256')
            .update(`${headerB64}.${payloadB64}.${JWT_SECRET}`)
            .digest('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        if (signature !== expectedSignature) return null;

        // Parse and validate payload
        const payload = JSON.parse(base64UrlDecode(payloadB64)) as JWTPayload;
        const now = Math.floor(Date.now() / 1000);

        if (payload.exp < now) return null; // Token expired

        return payload;
    } catch {
        return null;
    }
}

/**
 * Verify an access token and return user info
 */
export function verifyAccessToken(token: string): { userId: string; email: string } | null {
    const payload = verifyJWT(token);
    if (!payload) return null;

    return {
        userId: payload.sub,
        email: payload.email
    };
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Register a new user
 */
export function registerUser(email: string, password: string): User {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }

    // Validate password
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }

    // Check if email already exists
    const existing = getDb().prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
        throw new Error('Email already registered');
    }

    // Create user
    const id = randomUUID();
    const passwordHash = hashPassword(password);
    const createdAt = new Date().toISOString();

    getDb().prepare(`
        INSERT INTO users (id, email, password_hash, role, created_at)
        VALUES (?, ?, ?, 'user', ?)
    `).run(id, email.toLowerCase(), passwordHash, createdAt);

    return { id, email: email.toLowerCase(), role: 'user', createdAt };
}

/**
 * Login a user and return tokens
 */
export function loginUser(email: string, password: string): AuthTokens {
    const user = getDb().prepare(`
        SELECT id, email, password_hash FROM users WHERE email = ?
    `).get(email.toLowerCase()) as { id: string; email: string; password_hash: string } | undefined;

    if (!user) {
        throw new Error('Invalid email or password');
    }

    if (!verifyPassword(password, user.password_hash)) {
        throw new Error('Invalid email or password');
    }

    return generateTokens(user.id, user.email);
}

/**
 * Generate access and refresh tokens
 */
function generateTokens(userId: string, email: string): AuthTokens {
    const accessToken = createJWT({ sub: userId, email }, ACCESS_TOKEN_EXPIRY);
    const refreshToken = randomBytes(32).toString('hex');

    // Store refresh token
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000).toISOString();
    getDb().prepare(`
        INSERT INTO refresh_tokens (token, user_id, expires_at)
        VALUES (?, ?, ?)
    `).run(refreshToken, userId, expiresAt);

    return {
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRY
    };
}

/**
 * Refresh tokens using a refresh token
 */
export function refreshTokens(refreshToken: string): AuthTokens {
    const tokenData = getDb().prepare(`
        SELECT rt.user_id, rt.expires_at, u.email
        FROM refresh_tokens rt
        JOIN users u ON rt.user_id = u.id
        WHERE rt.token = ?
    `).get(refreshToken) as { user_id: string; expires_at: string; email: string } | undefined;

    if (!tokenData) {
        throw new Error('Invalid refresh token');
    }

    if (new Date(tokenData.expires_at) < new Date()) {
        // Delete expired token
        getDb().prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
        throw new Error('Refresh token expired');
    }

    // Delete old refresh token (rotation)
    getDb().prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);

    // Generate new tokens
    return generateTokens(tokenData.user_id, tokenData.email);
}

/**
 * Logout - invalidate refresh token
 */
export function logout(refreshToken: string): void {
    getDb().prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
}

/**
 * Logout all sessions for a user
 */
export function logoutAll(userId: string): void {
    getDb().prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
}

/**
 * Get user by ID
 */
export function getUserById(userId: string): User | null {
    const user = getDb().prepare(`
        SELECT id, email, role, created_at FROM users WHERE id = ?
    `).get(userId) as { id: string; email: string; role: string; created_at: string } | undefined;

    if (!user) return null;

    return {
        id: user.id,
        email: user.email,
        role: (user.role as 'user' | 'system_owner') || 'user',
        createdAt: user.created_at
    };
}

/**
 * Delete user account
 */
export function deleteUser(userId: string): boolean {
    // Delete refresh tokens first (due to foreign key)
    getDb().prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
    const result = getDb().prepare('DELETE FROM users WHERE id = ?').run(userId);
    return result.changes > 0;
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clean up expired refresh tokens
 */
export function cleanupExpiredTokens(): number {
    const now = new Date().toISOString();
    const result = getDb().prepare('DELETE FROM refresh_tokens WHERE expires_at < ?').run(now);
    return result.changes;
}
