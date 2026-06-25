# =============================================================================
# PixelForge backend image
# -----------------------------------------------------------------------------
# Node 20 (Alpine) image that ships the Express API together with the static
# frontend it serves. server.js resolves the frontend as `../frontend`, so the
# container reproduces the repo layout:
#
#   /app/backend   ← this service (server.js, routes, db, lib, …)
#   /app/frontend  ← the static site served by express.static
#
# IMPORTANT: this Dockerfile expects the BUILD CONTEXT to be the repo root (so
# it can copy both `backend/` and `frontend/`). docker-compose builds it as
# `context: .  dockerfile: backend/Dockerfile`. Schema + seed are applied
# separately via `npm run db:setup` (see docker-compose.yml), keeping the image
# stateless.
# =============================================================================
FROM node:20-alpine

# App lives under /app/backend so the sibling /app/frontend path matches the
# repo layout that server.js relies on.
WORKDIR /app/backend

# 1) Install production dependencies first for better layer caching: only a
#    manifest change invalidates this layer, not every source edit.
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# 2) Copy the backend source …
COPY backend/ ./

# 3) … and the static frontend as a sibling directory.
COPY frontend/ ../frontend/

# Document the listening port; the host mapping is done by compose.
EXPOSE 3000

# Drop to the unprivileged user shipped with the node image.
USER node

CMD ["node", "server.js"]
