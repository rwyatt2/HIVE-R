# Deployment Operations

## Overview

HIVE-R uses **Docker Swarm** for deployment with a two-environment pipeline:

```
push to main → staging (auto) → git tag v*.*.* → production (manual approval)
```

## Environments

| Environment | Trigger | Approval | Strategy |
|---|---|---|---|
| Staging | Push to `main` | Automatic | Rolling update |
| Production | Git tag `v*` | Manual (GitHub) | Blue-green, start-first |

## Deploy a Release

### 1. Stage on main

```bash
git checkout main
git pull
# CI runs → staging auto-deploys
```

### 2. Tag for production

```bash
git tag v1.2.0
git push origin v1.2.0
# → Builds versioned image
# → Pushes to Docker Hub
# → Requires manual approval in GitHub
# → Blue-green deploy
# → Health checks (10 attempts)
# → Auto-rollback on failure
# → Creates GitHub Release
# → Slack notification
```

### 3. Hotfix

```bash
git tag v1.2.1
git push origin v1.2.1
```

## Manual Deploy / Rollback

```bash
# Deploy a specific version
./scripts/deploy.sh v1.2.0 hive_app

# Rollback to previous version
./scripts/rollback.sh hive_app
```

## Required GitHub Secrets

| Secret | Purpose |
|---|---|
| `DOCKER_USERNAME` | Docker Hub login |
| `DOCKER_PASSWORD` | Docker Hub password or token |
| `STAGING_HOST` | Staging server IP/hostname |
| `STAGING_USER` | SSH username for staging |
| `STAGING_SSH_KEY` | SSH private key for staging |
| `STAGING_URL` | e.g. `https://staging.hive-r.com` |
| `PROD_HOST` | Production server IP/hostname |
| `PROD_USER` | SSH username for production |
| `PROD_SSH_KEY` | SSH private key for production |
| `PROD_URL` | e.g. `https://api.hive-r.com` |
| `SLACK_WEBHOOK` | Slack incoming webhook URL |

## Production Safeguards

1. **Tag format validation** — rejects invalid semver
2. **GitHub environment protection** — manual approval required
3. **Blue-green / start-first** — new container starts before old one stops
4. **Automatic rollback** — Swarm rolls back if update fails
5. **Health check gating** — 10 attempts over 100s before marking success
6. **CI gate** — staging only deploys after CI passes
7. **Concurrency lock** — only one production deploy runs at a time

## Health Check Endpoints

| Endpoint | Purpose |
|---|---|
| `/health` | Liveness — is the process running? |
| `/health/ready` | Readiness — is the app ready to serve? |

## Debugging a Failed Deploy

```bash
# Check service status
docker service ps hive_app --no-trunc

# View logs
docker service logs hive_app --tail 100

# Inspect current image
docker service inspect hive_app --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}'

# Manual rollback
./scripts/rollback.sh hive_app
```
