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
COPY . .
# Generate Prisma client (has internet in build stage)
RUN DATABASE_URL=postgresql://fake:fake@localhost/fake \
    PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 \
    node node_modules/prisma/build/index.js generate \
    --schema apps/api/prisma/schema.prisma || true
# Build schemas package
RUN npm --workspace packages/schemas run build
# Build API
RUN npm --workspace apps/api run build

# ── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy everything needed to run
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/packages/schemas/dist ./packages/schemas/dist
COPY --from=build /app/packages/schemas/package.json ./packages/schemas/package.json
CMD ["node", "apps/api/dist/src/main.js"]
