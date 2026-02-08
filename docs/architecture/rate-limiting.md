# Rate Limiting

## Overview

HIVE-R enforces multi-tier rate limits based on user identity and billing tier. Limits use a **dual sliding-window** algorithm: a 1-hour sustained limit and a 1-minute burst limit.

## Tiers

| Tier | Requests/Hour | Burst/Min | How Detected |
|---|---|---|---|
| Anonymous | 10 | 5 | No JWT token (keyed by IP) |
| Free | 100 | 20 | Authenticated, no billing customer or `free` tier |
| Pro | 500 | 50 | `billing_customers.tier = 'pro'` |
| Team | 1000 | 100 | `billing_customers.tier = 'team'` |
| Enterprise | 1000 | 100 | `billing_customers.tier = 'enterprise'` |
| Admin | ∞ | ∞ | `users.role = 'system_owner'` |

## Response Headers

Every rate-limited response includes:

| Header | Description |
|---|---|
| `X-RateLimit-Limit` | Max requests per hour for this tier |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix epoch (seconds) when window resets |
| `Retry-After` | Seconds until requests are allowed again (only on 429) |

## 429 Response

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests in a short period. Please slow down.",
  "retryAfter": 42,
  "tier": "anonymous",
  "limit": 5,
  "window": "1 minute"
}
```

## Exempt Paths

These paths are **never** rate limited:
- `/health`, `/health/*`
- `/metrics`, `/metrics/prometheus`
- `/auth/*`

## IP Whitelist

Set `RATE_LIMIT_WHITELIST_IPS` (comma-separated) in `.env` to bypass rate limiting for monitoring systems or load balancers:

```
RATE_LIMIT_WHITELIST_IPS=10.0.0.1,192.168.1.100
```

## Configuration

All limits are configurable via environment variables:

```bash
RATE_LIMIT_ANON_HOURLY=10       # Anonymous hourly limit
RATE_LIMIT_ANON_BURST=5         # Anonymous burst (per minute)
RATE_LIMIT_FREE_HOURLY=100      # Free tier hourly
RATE_LIMIT_FREE_BURST=20        # Free tier burst
RATE_LIMIT_PRO_HOURLY=500       # Pro tier hourly
RATE_LIMIT_PRO_BURST=50         # Pro tier burst
RATE_LIMIT_TEAM_HOURLY=1000     # Team tier hourly
RATE_LIMIT_TEAM_BURST=100       # Team tier burst
RATE_LIMIT_ENT_HOURLY=1000      # Enterprise hourly
RATE_LIMIT_ENT_BURST=100        # Enterprise burst
```

## Admin Emergency Override

Admin endpoints to manage rate limiting:

```bash
# View stats
GET /admin/rate-limit/stats

# Clear all limits (emergency)
DELETE /admin/rate-limit/clear
```
