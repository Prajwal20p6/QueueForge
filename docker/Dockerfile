# ──────────────────────────────────────────────────────────────────────────────
# STAGE 1: Build & Validate Compilation
# ──────────────────────────────────────────────────────────────────────────────
FROM node:26-alpine AS builder

# Install system dependencies needed for native modules
RUN apk add --no-cache libc6-compat openssl python3 make g++

WORKDIR /app

# Install dependency files first for build cache efficiency
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install all dependencies including devDependencies
RUN npm ci

# Copy application files
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src/
COPY tests ./tests/
COPY .env.test ./

# Generate Prisma Client definition files
RUN npx prisma generate

# Compile TypeScript code
RUN npm run build

# Run unit tests to validate code stability before deployment
ENV NODE_ENV=test
RUN npm run test:unit

# Remove development modules to optimize final payload size
RUN npm prune --production

# ──────────────────────────────────────────────────────────────────────────────
# STAGE 2: Lightweight Production Execution
# ──────────────────────────────────────────────────────────────────────────────
FROM node:26-alpine AS runner

# Install runtime utilities (dumb-init for PID 1 signaling, curl for healthcheck, openssl for prisma engine)
RUN apk add --no-cache dumb-init curl openssl coreutils bash

# Create non-privileged system user for process isolation
RUN addgroup --system --gid 1001 queueforge && \
    adduser --system --uid 1001 -G queueforge queueforge

WORKDIR /app

# Copy dependency files
COPY --chown=queueforge:queueforge package.json package-lock.json ./

# Copy only production node_modules from builder
COPY --chown=queueforge:queueforge --from=builder /app/node_modules ./node_modules

# Copy compiled JavaScript target artifacts
COPY --chown=queueforge:queueforge --from=builder /app/dist ./dist

# Copy prisma migrations directory and schema definitions
COPY --chown=queueforge:queueforge --from=builder /app/prisma ./prisma

# Setup environment default variables
ENV NODE_ENV=production
ENV PORT=3000

# Switch context to non-root user
USER queueforge

# Expose service runtime port
EXPOSE 3000

# Perform healthcheck query check every 30 seconds
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Metadata Labels conforming to OCI image specs
LABEL org.opencontainers.image.title="QueueForge" \
      org.opencontainers.image.description="Guaranteed Event-Driven Delivery pipeline for AI Results" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.vendor="OneInbox" \
      org.opencontainers.image.licenses="MIT"

# Launch application under dumb-init to coordinate shutdown signal forwarding
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "/app/dist/main.js"]
