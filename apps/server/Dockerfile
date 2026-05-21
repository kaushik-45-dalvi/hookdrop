# ─── Build Stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy monorepo root
COPY package.json package-lock.json turbo.json ./

# Copy only what's needed for server + types
COPY packages/types ./packages/types
COPY apps/server ./apps/server

# Install all dependencies
RUN npm install --workspace=apps/server --workspace=packages/types

# Build the server
RUN npm run build --workspace=apps/server

# ─── Production Stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built output
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./package.json
COPY --from=builder /app/apps/server/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "dist/src/index.js"]
