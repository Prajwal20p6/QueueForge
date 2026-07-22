# Production Multi-Stage Dockerfile for QueueForge with OpenSSL support for Prisma
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL and build dependencies for Prisma engine generation
RUN apk add --no-cache openssl ca-certificates libc6-compat

# Copy package files and install dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source code and build
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime OpenSSL and SSL certificates for Prisma Query Engine
RUN apk add --no-cache openssl ca-certificates libc6-compat

ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules, package.json, prisma, and compiled dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Run Prisma schema push on startup followed by application main process
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
