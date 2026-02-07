# Input Validation & Prompt Injection Protection

**Date:** 2026-02-07  
**Implemented by:** Security Agent → Builder Agent → Tester Agent

---

## Overview

All user-facing input endpoints are now validated and sanitized before reaching the LLM pipeline. This protects against prompt injection, oversized payloads, and abuse.

## Architecture

```
Request → Rate Limit Check → JSON Parse → Zod Schema → Sanitizer → Handler
                                              ↓               ↓
                                        400 + details    Strips patterns
                                                         + logs event
```

## Protected Endpoints

| Endpoint | Validation | Rate Limit |
|---|---|---|
| `POST /chat` | `ChatInputSchema` + sanitizer | 10/hour per user |
| `POST /chat/stream` | `ChatInputSchema` + sanitizer | 10/hour per user |
| `POST /memory/search` | `MemorySearchSchema` | Inherited from middleware |

## Validation Rules

### Message
- **Required** — must be a non-empty string
- **Max length** — 10,000 characters
- **Sanitized** — prompt injection patterns stripped

### Thread ID
- **Optional** — if provided, must be a valid UUID

### Prompt Injection Patterns Blocked

| Category | Patterns |
|---|---|
| Role overrides | `system:`, `assistant:`, `human:`, `user:` |
| LLaMA/Mistral | `[INST]`, `[/INST]`, `<<SYS>>`, `</s>` |
| ChatML | `<\|im_start\|>`, `<\|im_end\|>`, `<\|system\|>` |
| Social engineering | "ignore previous instructions", "you are now a", "pretend you're", "new system prompt", "override system" |

### Rate Limiting

- **10 requests per hour** per user (identified by auth token or IP)
- Returns `429 Too Many Requests` with `Retry-After` header
- Separate from the general API rate limit in middleware

## Error Response Format

All validation errors return a consistent structure:

```json
{
    "success": false,
    "error": "Human-readable error message",
    "code": "VALIDATION_ERROR",
    "details": [
        { "field": "message", "message": "Message cannot be empty" }
    ]
}
```

No stack traces are ever leaked to clients.

## Security Logging

All validation failures are logged via the structured logger:

```
[WARN] 🛡️ Security: prompt_injection_detected  patterns=["system_role_override","ignore_instructions"]
[WARN] 🛡️ Security: chat_rate_limit_exceeded  key="user:abc123" count=11
[WARN] 🛡️ Security: chat_validation_failed  errors=[{"field":"message","message":"..."}]
```

## Files

| File | Purpose |
|---|---|
| `src/lib/input-validation.ts` | Zod schemas, sanitizer, rate limiter, security logger |
| `src/routers/chat.ts` | Hardened chat endpoints (extracted from index.ts) |
| `tests/lib/input-validation.test.ts` | 30+ test cases covering all edge cases |

## Testing

```bash
npx vitest run tests/lib/input-validation.test.ts
```
