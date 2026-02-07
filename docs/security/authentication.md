# API Authentication

**Date:** 2026-02-07

---

## Overview

All API routes require a valid JWT access token unless explicitly listed as public.

```
Authorization: Bearer <access_token>
```

## Getting a Token

### 1. Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "secret123"}'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "secret123"}'
```

**Response:**
```json
{
  "user": { "id": "...", "email": "you@example.com", "role": "user" },
  "accessToken": "eyJ...",
  "refreshToken": "abc123...",
  "expiresIn": 900
}
```

### 3. Refresh (before expiry)
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "abc123..."}'
```

## Token Lifecycle

| Token | Lifetime | Storage |
|---|---|---|
| Access token (JWT) | 15 minutes | Memory / HTTP header |
| Refresh token | 7 days | Secure cookie or client storage |

## Public Routes (no token required)

| Route | Method | Purpose |
|---|---|---|
| `/health`, `/health/*` | GET | Health probes |
| `/auth/register` | POST | User registration |
| `/auth/login` | POST | User login |
| `/auth/refresh` | POST | Token refresh |
| `/auth/logout` | POST | Logout |
| `/demo/*` | ALL | Sandbox demo |
| `/metrics`, `/metrics/*` | GET | Observability |
| `/plugins` | GET | Plugin catalog |
| `/plugins/:id` | GET | Plugin details |
| `/plugins/:id/ratings` | GET | Plugin ratings |

All other routes require `Authorization: Bearer <token>`.

## Error Responses

| Code | Status | Meaning |
|---|---|---|
| `TOKEN_MISSING` | 401 | No `Authorization` header provided |
| `TOKEN_INVALID` | 401 | Token signature verification failed |
| `TOKEN_EXPIRED` | 401 | Token has expired — call `/auth/refresh` |

**Example:**
```json
{
  "error": "Access token has expired. Use /auth/refresh to get a new one.",
  "code": "TOKEN_EXPIRED"
}
```

## Architecture

```
Request → API Key Auth → JWT Auth → Route Handler
                          │
                    ┌──────┴──────┐
                    │ Public?     │── yes → next()
                    │ Has token?  │── no  → 401
                    │ Valid JWT?  │── no  → 401
                    └──────┬──────┘
                           │ yes
                     c.set("user", { userId, email })
                           │
                     Route Handler
```

## Files

| File | Purpose |
|---|---|
| `src/middleware/auth.ts` | JWT middleware |
| `src/lib/user-auth.ts` | JWT creation, verification, user management |
| `src/lib/auth.ts` | API key auth (machine-to-machine) |
| `tests/middleware/auth.test.ts` | 25 tests |
