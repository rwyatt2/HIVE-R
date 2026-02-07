# HIVE-R Security Audit Report

**Date:** 2026-02-07  
**Auditor:** Automated checklist (Ultimate Playbook Phase 5)

---

## Summary

| # | Check | Status | Severity |
|---|---|---|---|
| 1 | API keys in `.env.example` only (not `.env`) | ✓ Pass | — |
| 2 | User input validated before use | ✗ Fail | 🟡 Medium |
| 3 | SQL queries parameterized (no injection) | ✓ Pass | — |
| 4 | Authentication on protected routes | ✓ Pass | — |
| 5 | AI prompts sanitized | ✗ Fail | 🟡 Medium |
| 6 | Error messages generic (don't leak internals) | ⚠ Partial | 🟢 Low |
| 7 | Rate limiting configured | ⚠ Partial | 🟡 Medium |
| 8 | HTTPS enforced | ✓ Pass | — |
| 9 | Dependencies have no critical vulns | ✓ Pass | — |
| 10 | Security logging (track auth failures) | ✓ Pass | — |

**Score: 6/10 pass, 2 partial, 2 fail**

---

## Detailed Findings

### 1. ✓ API Keys in `.env.example` Only

`.env.example` contains only placeholder values (`your-openai-api-key`, empty strings). `.env` is listed in `.gitignore` and has no git history. Docker/K8s use file-based secrets via `src/lib/secrets.ts`.

> [!CAUTION]
> The local `.env` file contains **live API keys** (OpenAI, LangChain, GitHub PAT). If this file is ever accidentally committed, immediately rotate all keys and use `git-filter-repo` to scrub history. See `docs/security/git-cleanup.md`.

---

### 2. ✗ User Input Not Validated on ~20 Endpoints

**The `/chat` router** validates input with Zod schemas — ✓ good.

**The remaining 20+ endpoints in `src/index.ts`** use raw `c.req.json()` with `as` type casts and **no validation**:

| File | Line | Endpoint | Issue |
|---|---|---|---|
| `src/index.ts` | 289 | `POST /memory/search` | Raw destructure, no type check |
| `src/index.ts` | 336 | `POST /thread/:id/approve` | `approved` not validated as boolean |
| `src/index.ts` | 414 | `POST /thread` | `title` not validated |
| `src/index.ts` | 450 | `POST /thread/:id/messages` | `role`, `content` unvalidated |
| `src/index.ts` | 480 | `POST /thread/:id/run` | `messages` array unvalidated |
| `src/index.ts` | 513 | `POST /auth/register` | `email`, `password` unvalidated |
| `src/index.ts` | 537 | `POST /auth/login` | `email`, `password` unvalidated |
| `src/index.ts` | 567 | `POST /auth/refresh` | `refreshToken` unvalidated |
| `src/index.ts` | 1024–1119 | `POST /workflow/*` (5 endpoints) | `message` unvalidated |
| `src/index.ts` | 1196–1306 | Org/billing endpoints (6+) | Multiple fields unvalidated |

**Recommendation:** Add Zod validation schemas for all endpoints (similar to `src/routers/chat.ts`). At minimum, validate auth endpoints first (`/auth/register`, `/auth/login`) since they accept passwords.

---

### 3. ✓ SQL Queries Parameterized

All SQL queries use `better-sqlite3` prepared statements with `?` placeholders. No string concatenation found in query construction.

Files audited (all pass):
- `src/lib/user-auth.ts` — 13 queries, all parameterized
- `src/lib/billing.ts` — 10 queries, all parameterized
- `src/lib/organizations.ts` — 12 queries, all parameterized
- `src/lib/agent-config.ts` — 4 queries, all parameterized
- `src/lib/audit.ts` — 5 queries, all parameterized
- `src/lib/vector-memory.ts` — 4 queries, all parameterized
- `src/lib/plugin-registry.ts` — `db.exec()` for DDL only (no user input)

---

### 4. ✓ Authentication on Protected Routes

JWT authentication enforced globally via `src/middleware/auth.ts` (committed `50c14cfc`).

- **Global middleware:** `jwtAuthMiddleware` mounted on `app.use('*', ...)`
- **Public routes exempted:** `/health/*`, `/auth/*`, `/demo/*`, `/metrics/*`, `GET /plugins`
- **Error codes:** `TOKEN_MISSING`, `TOKEN_INVALID`, `TOKEN_EXPIRED`
- **Admin routes:** Additional `ownerAuthMiddleware` checks `system_owner` role
- **Tests:** 25 passing tests in `tests/middleware/auth.test.ts`

---

### 5. ✗ AI Prompts Not Sanitized

User messages are passed directly to LLM via `new HumanMessage(message)` without sanitization in **most** agent nodes and workflow endpoints.

| Location | Sanitized? |
|---|---|
| `src/routers/chat.ts` | ✓ Yes — `sanitizePromptInjection()` applied |
| `src/index.ts` L1024–1126 (`/workflow/*`) | ✗ No — raw `message` to `HumanMessage` |
| `src/index.ts` L480 (`POST /thread/:id/run`) | ✗ No |
| `src/mcp-server.ts` L84 | ✗ No |

The `sanitizePromptInjection()` function exists in `src/routers/chat.ts` but is not exported or reused.

**Recommendation:**
1. Extract `sanitizePromptInjection()` to `src/lib/security.ts`
2. Apply it to all `HumanMessage` construction points
3. Add input length limits on all workflow endpoints

---

### 6. ⚠ Error Messages — Partial Pass

**`src/lib/middleware.ts` L82–86:**
```typescript
message: process.env.NODE_ENV === "development" ? error.message : undefined
```
✓ Production errors are generic. ⚠ Development errors leak `error.message`.

**Agent error handlers** (e.g., `src/agents/security.ts` L96):
```typescript
content: `**[Security Error]**: ... ${error instanceof Error ? error.message : "Unknown error"}`
```
✗ Error messages from agent failures include `error.message` in LLM responses, which could be shown to end users.

**Recommendation:** Replace `error.message` in agent catch blocks with a generic "Agent encountered an error" message. Log full error server-side.

---

### 7. ⚠ Rate Limiting — Partial Pass

| Layer | Status | Config |
|---|---|---|
| Global rate limiter (`src/lib/middleware.ts`) | ⚠ Defined but **not mounted** | 60 req/min |
| Chat endpoints (`src/routers/chat.ts`) | ✓ Active | 10 req/hour per user |
| Auth endpoints | ✗ None | No brute-force protection |
| Workflow endpoints | ✗ None | AI-heavy, expensive |

**Recommendation:**
1. Mount `rateLimiter()` globally in `src/index.ts` (it's imported but unused)
2. Add stricter rate limits on `/auth/login` (e.g., 5 attempts/minute) to prevent brute-force
3. Add per-user rate limits on `/workflow/*` endpoints (expensive LLM calls)

---

### 8. ✓ HTTPS Enforced

**`src/lib/security.ts` L38–40:**
```typescript
if (process.env.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}
```
HSTS header is set in production with 1-year max-age and `includeSubDomains`.

Additionally:
- `Content-Security-Policy` is set
- `X-Frame-Options: DENY` prevents clickjacking
- `Permissions-Policy` restricts camera/mic/geo

---

### 9. ✓ Dependencies Have No Critical Vulnerabilities

```
$ npm audit --omit=dev
found 0 vulnerabilities
```

---

### 10. ✓ Security Logging

Auth failures are logged in the JWT middleware:
```typescript
logger.warn("🔒 JWT: TOKEN_MISSING", { path, method });
logger.warn("🔒 JWT: TOKEN_EXPIRED", { path, method });
```

Chat rate limiting logs failures:
```typescript
logger.warn("🛡️ Security: chat_rate_limit_exceeded", { key, count, limit });
```

Input validation failures are logged:
```typescript
logger.warn("🛡️ Security: chat_validation_failed", { errors });
```

---

## Priority Remediation

| Priority | Issue | Effort |
|---|---|---|
| 🔴 P0 | Rotate all API keys in `.env` (they appear in plaintext locally) | 30 min |
| 🟡 P1 | Add Zod validation to auth endpoints (`/auth/register`, `/auth/login`) | 1 hour |
| 🟡 P1 | Mount global rate limiter + add `/auth/login` brute-force protection | 30 min |
| 🟡 P1 | Extract and apply `sanitizePromptInjection()` to all LLM inputs | 1 hour |
| 🟡 P2 | Add Zod validation to remaining 15+ endpoints in `index.ts` | 3 hours |
| 🟢 P3 | Replace `error.message` in agent catch blocks with generic message | 30 min |
