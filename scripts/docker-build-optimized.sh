#!/bin/bash
# Optimized Docker build script with BuildKit caching

set -e

echo "🐳 Building optimized Docker image..."

# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build with cache
docker build \
    --cache-from hive-r:latest \
    --tag hive-r:latest \
    --tag hive-r:$(git rev-parse --short HEAD 2>/dev/null || echo "dev") \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    --progress=plain \
    .

echo ""
echo "📊 Image Analysis:"
docker images hive-r:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo "✅ Build complete!"
echo ""
echo "Run with: docker-compose up -d"
