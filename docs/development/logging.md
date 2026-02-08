# Logging Best Practices

## Overview

HIVE-R uses **Pino** for structured logging. Logs are JSON in production and pretty-printed in development.

## Backend Usage

```typescript
import { logger } from './lib/logger.js';

// Simple
logger.info('User registered');

// Structured (preferred)
logger.info({ userId: '123', action: 'login' }, 'User logged in');

// Error
logger.error({ err: error, userId }, 'Operation failed');
```

## Frontend Usage

```typescript
import { logger } from './lib/logger';

logger.info('Button clicked', { buttonId: 'submit' });
logger.error('API failed', error, { endpoint: '/api/data' });
```

## Log Levels

| Level | Use For |
|-------|---------|
| `debug` | Development debugging |
| `info` | General events |
| `warn` | Potential issues |
| `error` | Failures |

## Sensitive Data

Automatically redacted:
- `password`, `token`, `apiKey`
- `authorization` headers

## ❌ Don't Use

```typescript
console.log()  // Use logger.info()
console.error() // Use logger.error()
```

Run `./scripts/find-console-logs.sh` to find violations.
