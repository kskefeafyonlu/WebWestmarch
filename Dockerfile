# Multi-stage Dockerfile for WebWestmarch Colyseus Server
FROM node:22-slim AS builder

WORKDIR /app

# Copy root manifest and workspaces
COPY package*.json tsconfig.base.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/
COPY apps/server/tsconfig.json ./apps/server/

# Install dependencies
RUN npm install

# Copy source files
COPY packages/shared/src ./packages/shared/src
COPY apps/server/src ./apps/server/src

# Build packages
RUN npm run build:shared
RUN npm run build:server

# Production runner image
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=2567

# Copy package manifests and production dependencies
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/

RUN npm install --omit=dev

# Copy compiled artifacts from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/server/dist ./apps/server/dist

EXPOSE 2567

CMD ["node", "apps/server/dist/index.js"]
