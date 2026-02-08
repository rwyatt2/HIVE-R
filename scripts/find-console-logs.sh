#!/bin/bash
# Find all console.log statements in the codebase

echo "🔍 Finding console statements..."
echo ""

echo "=== Backend (src/) ==="
BACKEND_COUNT=$(grep -rn "console\." src/ --include="*.ts" --include="*.js" 2>/dev/null | wc -l | tr -d ' ')
echo "Total: $BACKEND_COUNT occurrences"
grep -rn "console\." src/ --include="*.ts" --include="*.js" 2>/dev/null | head -15
echo ""

echo "=== Frontend (client/src/) ==="
FRONTEND_COUNT=$(grep -rn "console\." client/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo "Total: $FRONTEND_COUNT occurrences"
grep -rn "console\." client/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -15
echo ""

TOTAL=$((BACKEND_COUNT + FRONTEND_COUNT))
echo "=== SUMMARY ==="
echo "Backend:  $BACKEND_COUNT"
echo "Frontend: $FRONTEND_COUNT"
echo "Total:    $TOTAL"
echo ""

if [ "$TOTAL" -eq 0 ]; then
    echo "✅ No console statements found!"
else
    echo "⚠️  Replace these with logger imports"
    echo "   Backend:   import { logger } from './lib/logger.js';"
    echo "   Frontend:  import { logger } from './lib/logger';"
fi
