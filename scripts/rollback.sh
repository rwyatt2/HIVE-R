#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# HIVE-R Rollback Script
# Usage: ./scripts/rollback.sh [service_name]
# Example: ./scripts/rollback.sh hive_app
# ──────────────────────────────────────────────────────────────
set -euo pipefail

SERVICE="${1:-hive_app}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/health}"
ROLLBACK_FILE="/tmp/hive-rollback-image"

echo "═══════════════════════════════════════════"
echo "  🔴 HIVE-R Rollback"
echo "  Service: ${SERVICE}"
echo "═══════════════════════════════════════════"

# ── Determine rollback target ──────────────────────────────
if [ -f "${ROLLBACK_FILE}" ]; then
    ROLLBACK_IMAGE=$(cat "${ROLLBACK_FILE}")
    if [ -n "${ROLLBACK_IMAGE}" ] && [ "${ROLLBACK_IMAGE}" != "none" ]; then
        echo "⬅️ Rolling back to: ${ROLLBACK_IMAGE}"
        docker service update --image "${ROLLBACK_IMAGE}" "${SERVICE}"
    else
        echo "⬅️ Using Docker Swarm native rollback..."
        docker service rollback "${SERVICE}"
    fi
else
    echo "⬅️ No rollback file found, using Docker Swarm native rollback..."
    docker service rollback "${SERVICE}"
fi

# ── Wait and verify ────────────────────────────────────────
echo "⏳ Waiting for rollback to stabilize..."
sleep 20

for i in 1 2 3 4 5; do
    HTTP_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "${HEALTH_URL}" 2>/dev/null || true)
    if [ "${HTTP_STATUS}" = "200" ]; then
        CURRENT=$(docker service inspect "${SERVICE}" \
            --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' 2>/dev/null || echo "unknown")
        echo ""
        echo "═══════════════════════════════════════════"
        echo "  ✅ Rollback complete"
        echo "  Running: ${CURRENT}"
        echo "═══════════════════════════════════════════"
        exit 0
    fi
    echo "⏳ Attempt ${i}/5: status=${HTTP_STATUS}, retrying in 5s..."
    sleep 5
done

echo ""
echo "═══════════════════════════════════════════"
echo "  🔴 CRITICAL: Rollback health check failed!"
echo "  Manual intervention required."
echo "  Check: docker service ps ${SERVICE}"
echo "═══════════════════════════════════════════"
exit 1
