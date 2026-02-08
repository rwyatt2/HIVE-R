#!/bin/bash
# Dependency security audit script

echo "🔍 Dependency Security Audit"
echo "============================"
echo ""

# Backend audit
echo "📦 Backend Dependencies:"
cd /Users/mnstr/Desktop/HIVE-R
npm audit 2>/dev/null || echo "Run 'npm install' first"
echo ""

echo "📊 Outdated Packages:"
npm outdated 2>/dev/null | head -20
echo ""

# Client audit
echo "📦 Frontend Dependencies:"
cd /Users/mnstr/Desktop/HIVE-R/client
npm audit 2>/dev/null || echo "Run 'npm install' first"
echo ""

echo "📊 Outdated Packages:"
npm outdated 2>/dev/null | head -20
echo ""

cd /Users/mnstr/Desktop/HIVE-R

# Summary
echo "=== SUMMARY ==="
echo "Run 'npm audit fix' to auto-fix vulnerabilities"
echo "Run 'npm outdated' to see all outdated packages"
echo "Run 'npm update' to update to latest minor/patch versions"
