#!/bin/bash
# =============================================================================
# HIVE-R Build All Script
# Builds landing page, client, docs, and backend for production deployment
# =============================================================================

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/dist-deploy"

echo "🐝 HIVE-R Build Script"
echo "======================"
echo "Project root: $PROJECT_ROOT"
echo "Build output: $BUILD_DIR"
echo ""

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# =============================================================================
# 1. BUILD LANDING PAGE
# =============================================================================
echo ""
echo "🏠 Building Landing Page..."
cd "$PROJECT_ROOT/landing"
npm install
npm run build
cp -r dist "$BUILD_DIR/landing"
echo "   ✅ Landing page built"

# =============================================================================
# 2. BUILD HIVE-R STUDIO (Client)
# =============================================================================
echo ""
echo "📱 Building HIVE-R Studio..."
cd "$PROJECT_ROOT/client"
npm install

# Set production API URL
export VITE_API_URL="https://hive-r.com"

npm run build
cp -r dist "$BUILD_DIR/client"
echo "   ✅ Client built"

# =============================================================================
# 3. BUILD DOCUMENTATION SITE
# =============================================================================
echo ""
echo "📚 Building Documentation..."
cd "$PROJECT_ROOT/docs-site"
npm install
npm run build
cp -r .vitepress/dist "$BUILD_DIR/docs"
echo "   ✅ Documentation built"

# =============================================================================
# 4. BUILD BACKEND
# =============================================================================
echo ""
echo "⚙️ Building Backend..."
cd "$PROJECT_ROOT"
npm install
npm run build
mkdir -p "$BUILD_DIR/server"
cp -r dist "$BUILD_DIR/server/dist"
cp package.json "$BUILD_DIR/server/"
cp package-lock.json "$BUILD_DIR/server/" 2>/dev/null || true
echo "   ✅ Backend built"

# =============================================================================
# 5. COPY DEPLOYMENT FILES
# =============================================================================
echo ""
echo "📦 Copying deployment files..."
cp "$PROJECT_ROOT/deploy/nginx.conf" "$BUILD_DIR/"
cp "$PROJECT_ROOT/deploy/docker-compose.yml" "$BUILD_DIR/" 2>/dev/null || true
cp "$PROJECT_ROOT/deploy/Dockerfile" "$BUILD_DIR/" 2>/dev/null || true

# Create .env.example for deployment
cat > "$BUILD_DIR/.env.example" << 'EOF'
# Required
OPENAI_API_KEY=sk-...

# Optional: Authentication
JWT_SECRET=your-jwt-secret-min-32-chars
HIVE_API_KEY=your-api-key

# Optional: Database
DATABASE_PATH=/data/hive.db

# Optional: Model configuration
OPENAI_MODEL_MAIN=gpt-4o
OPENAI_MODEL_FAST=gpt-4o-mini
EOF

echo "   ✅ Deployment files copied"

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo "=============================================="
echo "✅ Build Complete!"
echo "=============================================="
echo ""
echo "Output structure:"
echo "  $BUILD_DIR/"
echo "  ├── landing/      # Landing page static files"
echo "  ├── client/       # HIVE-R Studio static files"
echo "  ├── docs/         # Documentation static files"
echo "  ├── server/       # Backend Node.js app"
echo "  ├── nginx.conf    # Nginx configuration"
echo "  └── .env.example  # Environment template"
echo ""
echo "To deploy:"
echo "  1. Copy $BUILD_DIR to your server"
echo "  2. Configure .env from .env.example"
echo "  3. Install nginx and copy nginx.conf"
echo "  4. Run: cd server && npm install --production && npm start"
echo ""
