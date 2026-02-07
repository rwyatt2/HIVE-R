# Secrets Management

**Date:** 2026-02-07  
**Agents:** Planner → Security → Builder → SRE

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              getSecret("OPENAI_API_KEY")        │
│                   src/lib/secrets.ts             │
└──────────────┬─────────────┬────────────────────┘
               │             │
    ┌──────────▼──┐   ┌──────▼──────────┐
    │ Development │   │   Production    │
    │  .env file  │   │ /run/secrets/*  │
    │ process.env │   │ Docker / K8s    │
    └─────────────┘   └─────────────────┘
```

| Environment | Source | Auto-detection |
|---|---|---|
| Development | `.env` → `process.env` | Default (no `/run/secrets/`) |
| Docker | `/run/secrets/<name>` files | `existsSync("/run/secrets")` |
| Kubernetes | `/run/secrets/<name>` files | `KUBERNETES_SERVICE_HOST` env |

## API Reference

```typescript
import { getSecret, requireSecret, maskSecret, hasSecret } from "./lib/secrets.js";

getSecret("OPENAI_API_KEY")      // string | undefined
requireSecret("OPENAI_API_KEY")  // string (throws if missing)
maskSecret("sk-proj-abc...xyz")  // "sk-p...xyz"
hasSecret("SENTRY_DSN")          // boolean
```

## Secret Inventory

### 🔴 Sensitive (managed by secrets.ts)

| Secret | Used By | Required |
|---|---|---|
| `OPENAI_API_KEY` | semantic-memory, agents | ✅ |
| `HIVE_API_KEY` | auth middleware | ✅ prod |
| `JWT_SECRET` | user-auth (JWT signing) | ✅ prod |
| `STRIPE_SECRET_KEY` | billing | Optional |
| `STRIPE_WEBHOOK_SECRET` | billing webhooks | Optional |
| `LANGSMITH_API_KEY` | tracing | Optional |
| `SENTRY_DSN` | error monitoring | Optional |
| `GITHUB_TOKEN` | GitHub integrations | Optional |

### 🟢 Configuration (stays as process.env)

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Environment detection |
| `PORT` | Server port |
| `DATABASE_PATH` | SQLite path |
| `LOG_LEVEL` | Logger verbosity |
| `CHROMA_HOST`, `CHROMA_PORT` | Vector DB connection |
| `CORS_ORIGINS` | Allowed origins |

## Security Model

✅ **Secrets never in env vars** in Docker/K8s — mounted as tmpfs files  
✅ **Secrets never logged** — `maskSecret()` for any logging need  
✅ **Secrets cached** — file read once, stored in memory  
✅ **Fail-fast** — `requireSecret()` throws at startup if missing  
✅ **Backward compatible** — `.env` still works for development  

## Secret Rotation

### Docker
```bash
# 1. Update the secret file
echo -n "new-key-value" > ./secrets/openai_api_key.txt

# 2. Restart with zero downtime
docker compose up -d --no-deps hive
```

### Kubernetes
```bash
# 1. Update the secret
kubectl create secret generic hive-r-secrets \
  --from-literal=openai_api_key=NEW_VALUE \
  --dry-run=client -o yaml | kubectl apply -f -

# 2. Restart pods (rolling update)
kubectl rollout restart deployment/hive-r
```

## Migration Guide (from .env)

### Step 1: Create secrets directory
```bash
mkdir -p secrets
echo "secrets/" >> .gitignore
```

### Step 2: Extract secrets from .env
```bash
# For each secret, create a file:
grep OPENAI_API_KEY .env | cut -d= -f2 > secrets/openai_api_key.txt
grep HIVE_API_KEY .env | cut -d= -f2 > secrets/hive_api_key.txt
grep JWT_SECRET .env | cut -d= -f2 > secrets/jwt_secret.txt
# ... repeat for each secret
```

### Step 3: Run with Docker
```bash
docker compose up -d
```

### Step 4: Verify
```bash
curl http://localhost:3000/health
# Check logs for: "🔐 Secrets mode: docker"
```

### For local development (no Docker)
**No changes needed.** `npm run dev` still reads from `.env` via `process.env` as before.

## Files

| File | Purpose |
|---|---|
| `src/lib/secrets.ts` | Unified secrets loader |
| `docker-compose.yml` | Dev Docker with secrets |
| `deploy/docker-compose.yml` | Prod Docker with secrets |
| `deploy/k8s/secret.yaml` | K8s Secret manifest |
| `deploy/k8s/deployment.yaml` | K8s Deployment (mounts secrets) |
| `deploy/k8s/service.yaml` | K8s Service |
