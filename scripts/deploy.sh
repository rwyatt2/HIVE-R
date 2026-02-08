#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# HIVE-R Deploy Script
# Usage: ./scripts/deploy.sh <image_tag> [service_name]
# Example: ./scripts/deploy.sh v1.2.0 hive_app
# ──────────────────────────────────────────────────────────────
set -euo pipefail

TAG="${1:?Usage: deploy.sh <image_tag> [service_name]}"
SERVICE="${2:-hive_app}"
REGISTRY="${DOCKER_REGISTRY:-docker.io}"
IMAGE="${DOCKER_IMAGE:-hive-r}"
FULL_IMAGE="${REGISTRY}/${IMAGE}:${TAG}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/health}"
MAX_RETRIES=10
RETRY_DELAY=10

echo "═══════════════════════════════════════════"
echo "  🚀 HIVE-R Deploy"
echo "  Image:   ${FULL_IMAGE}"
echo "  Service: ${SERVICE}"
echo "═══════════════════════════════════════════"

# ── Save rollback info ─────────────────────────────────────
CURRENT_IMAGE=$(docker service inspect "${SERVICE}" \
    --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' 2>/dev/null || echo "none")
echo "${CURRENT_IMAGE}" > /tmp/hive-rollback-image
echo "📌 Rollback image saved: ${CURRENT_IMAGE}"

# ── Pull image ─────────────────────────────────────────────
echo "📦 Pulling ${FULL_IMAGE}..."
docker pull "${FULL_IMAGE}"

# ── Update service ─────────────────────────────────────────
echo "🔄 Updating ${SERVICE}..."
docker service update \
    --image "${FULL_IMAGE}" \
    --update-parallelism 1 \
    --update-delay 15s \
    --update-order start-first \
    --update-failure-action rollback \
    "${SERVICE}"

# ── Health check ───────────────────────────────────────────
echo "🏥 Running health checks..."
sleep 10

for i in $(seq 1 "${MAX_RETRIES}"); do
    HTTP_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "${HEALTH_URL}" 2>/dev/null || true)
    if [ "${HTTP_STATUS}" = "200" ]; then
        echo "✅ Health check passed (attempt ${i}/${MAX_RETRIES})"
        echo ""
        echo "═══════════════════════════════════════════"
        echo "  ✅ Deploy complete: ${TAG}"
        echo "═══════════════════════════════════════════"
        exit 0
    fi
    echo "⏳ Attempt ${i}/${MAX_RETRIES}: status=${HTTP_STATUS}, retrying in ${RETRY_DELAY}s..."
    sleep "${RETRY_DELAY}"
done

echo "❌ Health check failed after ${MAX_RETRIES} attempts"
echo "💡 Run: ./scripts/rollback.sh ${SERVICE}"
exit 1
