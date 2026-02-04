# =============================================================================
# HIVE-R Production Dockerfile
# Multi-stage build for optimized production image
# =============================================================================

# Stage 1: Build all frontend assets
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY landing/package*.json ./landing/
COPY client/package*.json ./client/
COPY docs-site/package*.json ./docs-site/

# Install dependencies
RUN npm install
RUN cd landing && npm install
RUN cd client && npm install
RUN cd docs-site && npm install

# Copy source code
COPY . .

# Build landing page
RUN cd landing && npm run build

# Build client
ENV VITE_API_URL=""
RUN cd client && npm run build

# Build docs
RUN cd docs-site && npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --production && npm cache clean --force

# Copy built backend
COPY --from=backend-builder /app/dist ./dist

# Copy static files
COPY --from=frontend-builder /app/landing/dist ./static/landing
COPY --from=frontend-builder /app/client/dist ./static/client
COPY --from=frontend-builder /app/docs-site/.vitepress/dist ./static/docs

# Create data directory
RUN mkdir -p /data

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Environment
ENV NODE_ENV=production
ENV DATABASE_PATH=/data/hive.db
ENV PORT=3000

EXPOSE 3000

# Run the server
CMD ["node", "dist/index.js"]
