# HIVE-R Security Guide

> Best practices for securing your HIVE-R deployment

---

## Table of Contents

1. [Authentication](#authentication)
2. [Environment Variables](#environment-variables)
3. [CORS Configuration](#cors-configuration)
4. [Security Headers](#security-headers)
5. [Rate Limiting](#rate-limiting)
6. [Error Monitoring](#error-monitoring)
7. [Database Security](#database-security)
8. [Production Checklist](#production-checklist)

---

## Authentication

### API Key Authentication

HIVE-R supports Bearer token authentication. When `HIVE_API_KEY` is set, all protected endpoints require authentication.

**Enable Authentication:**
```bash
# .env
HIVE_API_KEY=your-secure-api-key-here
```

**Making Authenticated Requests:**
```bash
curl -X POST http://localhost:3000/chat \
  -H "Authorization: Bearer your-secure-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

**Public Endpoints (no auth required):**
- `GET /health` - Basic health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe
- `GET /metrics` - Prometheus metrics
- `GET /metrics/prometheus` - Prometheus format

### Generating Secure API Keys

```bash
# Generate a secure random key
openssl rand -hex 32
```

---

## Environment Variables

### Required for Security

| Variable | Description | Example |
|----------|-------------|---------|
| `HIVE_API_KEY` | API authentication key | `a3f2...8c4d` |
| `NODE_ENV` | Environment mode | `production` |

### Recommended for Production

| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ORIGINS` | Allowed CORS origins | `*` (insecure) |
| `SENTRY_DSN` | Error monitoring | (none) |
| `LOG_LEVEL` | Logging verbosity | `info` |

### Never Commit to Git

The following should **NEVER** be in version control:

- `.env` file (use `.env.example` as template)
- `data/*.db` (SQLite databases)
- Any `*.key` or `*.pem` files
- API keys or tokens

---

## CORS Configuration

### Development (Default)

By default, HIVE-R allows requests from common development origins:

```javascript
["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"]
```

### Production

For production, restrict CORS to your domains:

```bash
# .env
CORS_ORIGINS=https://app.yourdomain.com,https://yourdomain.com
NODE_ENV=production
```

### Disabling CORS

If your API is only accessed server-to-server, you can remove the wildcard `*` from the allowed origins in `src/index.ts`.

---

## Security Headers

HIVE-R automatically adds security headers in production:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | XSS protection |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Privacy |
| `Content-Security-Policy` | `default-src 'self'` | Script injection |
| `Strict-Transport-Security` | `max-age=31536000` | Force HTTPS (prod only) |
| `Permissions-Policy` | `camera=(), microphone=()` | Restrict features |

---

## Rate Limiting

### Default Configuration

- **Limit**: 100 requests per minute
- **Scope**: `/chat*` endpoints
- **Window**: Rolling 60-second window

### Customizing Rate Limits

Edit `src/index.ts`:

```typescript
app.use('/chat*', rateLimiter(50, 60000)); // 50 req/min
```

### Per-IP Rate Limiting

For stricter control, the rate limiter supports per-IP tracking (requires configuration).

---

## Error Monitoring

### Sentry Integration

HIVE-R supports Sentry for error tracking:

```bash
# .env
SENTRY_DSN=https://xxxxx@sentry.io/project
SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Features:**
- Automatic error capture
- Transaction tracing
- Breadcrumb logging
- User context

### Viewing the Security Audit

Check your security configuration via the dashboard:

```bash
curl http://localhost:3000/dashboard | jq .security
```

Response:
```json
{
  "passed": false,
  "issues": ["HIVE_API_KEY not set - API is unprotected"],
  "recommendations": [
    "Set NODE_ENV=production for stricter security",
    "Set CORS_ORIGINS to restrict cross-origin requests"
  ]
}
```

---

## Database Security

### SQLite Protection

- Database files are excluded from git via `.gitignore`
- Files are stored in `./data/` directory by default
- Workspace isolation prevents agents from accessing system files

### Backups

Regular backups protect against data loss:

```bash
# Create backup
npm run backup

# Restore from backup
npm run backup:restore -- --latest
```

### Workspace Isolation

Agents can only read/write within the configured workspace:

```bash
# .env
HIVE_WORKSPACE=/path/to/allowed/directory
```

---

## Production Checklist

Before deploying to production:

### ✅ Authentication
- [ ] Set `HIVE_API_KEY` to a secure random value
- [ ] Rotate API keys periodically
- [ ] Use HTTPS in production

### ✅ Environment
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGINS` (remove wildcard `*`)
- [ ] Set `LOG_LEVEL=warn` or `error`

### ✅ Monitoring
- [ ] Configure Sentry (`SENTRY_DSN`)
- [ ] Set up health check alerts
- [ ] Monitor `/health/ready` endpoint

### ✅ Database
- [ ] Configure automated backups (`npm run backup`)
- [ ] Set backup retention policy
- [ ] Store backups off-server

### ✅ Infrastructure
- [ ] Run behind reverse proxy (nginx, Caddy)
- [ ] Enable TLS/SSL
- [ ] Set up firewall rules
- [ ] Use container orchestration (Docker, K8s)

### ✅ Secrets
- [ ] Never commit API keys to git
- [ ] Use secret management (Vault, AWS Secrets Manager)
- [ ] Rotate secrets after any potential exposure

---

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do NOT** open a public GitHub issue
2. Email the maintainers directly
3. Include steps to reproduce
4. Allow 90 days for a fix before disclosure

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Sentry Documentation](https://docs.sentry.io/)
