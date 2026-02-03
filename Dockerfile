# Multi-stage build for smaller image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hive

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R hive:nodejs /app/data

USER hive

# Environment
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/hive.db
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]
