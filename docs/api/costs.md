# Cost Dashboard API

All endpoints require **admin authentication** (`system_owner` role via JWT).

Base path: `/admin/costs`

---

## `GET /admin/costs/today`

Today's total LLM spend with budget info.

**Response:**
```json
{
  "data": {
    "date": "2026-02-07",
    "totalCost": 12.3456,
    "totalTokensIn": 450000,
    "totalTokensOut": 180000,
    "callCount": 87
  },
  "budget": { "daily": 50, "remaining": 37.6544 },
  "cached": false,
  "cachedAt": "2026-02-07T20:30:00.000Z"
}
```

---

## `GET /admin/costs/by-agent?period=today|week|month`

Cost breakdown per agent for the selected period.

| Param | Type | Default | Values |
|-------|------|---------|--------|
| `period` | query | `today` | `today`, `week`, `month` |

**Response:**
```json
{
  "period": "week",
  "data": [
    {
      "agentName": "Builder",
      "totalCost": 5.234,
      "totalTokensIn": 200000,
      "totalTokensOut": 80000,
      "callCount": 34,
      "avgLatencyMs": 2100
    }
  ],
  "cached": false
}
```

---

## `GET /admin/costs/trend?days=30`

Daily cost aggregates for charting.

| Param | Type | Default | Range |
|-------|------|---------|-------|
| `days` | query | `30` | `1–365` |

**Response:**
```json
{
  "days": 30,
  "trend": [
    { "date": "2026-02-01", "totalCost": 8.50, "callCount": 42, "totalTokensIn": 300000, "totalTokensOut": 120000 }
  ],
  "totals": { "totalCost": 255.0, "totalCalls": 1260, "totalTokensIn": 9000000, "totalTokensOut": 3600000 },
  "cached": false
}
```

---

## `GET /admin/costs/top-queries?limit=10`

Most expensive individual LLM calls.

| Param | Type | Default | Range |
|-------|------|---------|-------|
| `limit` | query | `10` | `1–100` |

**Response:**
```json
{
  "limit": 10,
  "data": [
    {
      "id": "uuid",
      "agentName": "Builder",
      "model": "gpt-4o",
      "tokensIn": 8000,
      "tokensOut": 4000,
      "costUsd": 0.1,
      "latencyMs": 5200,
      "threadId": "thread-abc",
      "createdAt": "2026-02-07T18:30:00Z"
    }
  ],
  "cached": false
}
```

---

## `GET /admin/costs/projection`

Projected monthly cost based on 7-day rolling average.

**Response:**
```json
{
  "data": {
    "currentDailyCost": 12.34,
    "projectedMonthlyCost": 370.20,
    "daysAnalyzed": 7,
    "dailyAverage": 12.34,
    "trend": "increasing",
    "trendPercentage": 15
  },
  "cached": false
}
```

---

## Caching

All responses are cached **in-memory for 5 minutes**. The `cached` and `cachedAt` fields indicate cache status.

## Authentication

Requires JWT with `system_owner` role. Returns `401` if unauthenticated, `403` if not owner.
