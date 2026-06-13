# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/schemas/package.json ./packages/schemas/
RUN npm install --workspaces --no-audit --no-fund

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM deps AS build
WORKDIR /app
COPY . .
# Build schemas first (web imports from it)
RUN npm --workspace packages/schemas run build
# Build Next.js
RUN npm --workspace apps/web run build

# ── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Standalone output contains everything needed
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
