# Cost Alert Operations Guide

## Overview

HIVE-R includes a proactive budget alert service that monitors LLM spend and fires alerts before you blow your budget.

## How It Works

- Checks current daily spend **every 10 minutes**
- Fires alerts at **50%, 80%, 100%, 120%** of `DAILY_BUDGET`
- **De-duplicates** — each threshold only fires once per day
- Resets at midnight UTC

## Alert Channels

| Channel | Always Active | Requires Config |
|---------|:---:|:---:|
| Console (stdout) | ✅ | — |
| Logger (file) | ✅ | — |
| Slack webhook | — | `SLACK_WEBHOOK_URL` |

## Configuration

```bash
# .env
DAILY_BUDGET=50                       # USD daily limit
BUDGET_ALERTS_ENABLED=true            # Set false to disable
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz  # Optional
```

## Kill Switch

Disable all alerts without stopping the server:

```bash
BUDGET_ALERTS_ENABLED=false
```

## Alert History API

```
GET /admin/alerts?limit=50
```

Requires admin auth (JWT + `system_owner` role).

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert-2026-02-07-80",
      "threshold": 80,
      "level": "warning",
      "label": "80% Budget Caution",
      "costAtAlert": 40.12,
      "budget": 50,
      "percent": 80.24,
      "channels": ["console", "logger", "slack"],
      "firedAt": "2026-02-07T18:30:00Z"
    }
  ],
  "config": {
    "enabled": true,
    "budget": 50,
    "thresholds": [50, 80, 100, 120],
    "slackConfigured": true,
    "checkIntervalMinutes": 10
  },
  "firedToday": [50, 80]
}
```

## Testing Alerts

Set a very low budget to trigger quickly:

```bash
# Set tiny budget
echo "DAILY_BUDGET=0.01" >> .env

# Start server
npm run dev

# Make a few LLM requests — watch console for:
# 🔔 BUDGET ALERT: ⚠️ 50% Budget Warning — $0.0050 / $0.01 (50.0%)
```

## Slack Message Preview

Alerts sent to Slack include structured blocks with:
- Header with emoji severity indicator
- Current spend vs daily budget
- Threshold hit and timestamp
- Graceful failure — if Slack is down, console+logger still work

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No alerts firing | Check `BUDGET_ALERTS_ENABLED` is not `false` |
| Duplicate alerts | Should not happen — service tracks per threshold per day |
| Slack not receiving | Verify `SLACK_WEBHOOK_URL`, check logs for "Slack alert delivery failed" |
| Alerts not resetting | Service resets at midnight UTC when first check runs |
