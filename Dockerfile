# ============================================================
# SubscriptionManager 自架版 — 單一容器：前端靜態檔 + API + 定時扣款 + Telegram 通知
# ============================================================

# ---- Stage 1: 建置前端 (Vite/React) ----
FROM node:20-bookworm-slim AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json components.json ./
COPY public ./public
COPY src ./src
RUN npm run build

# ---- Stage 2: 建置後端 (Express + better-sqlite3) ----
# 用有編譯工具的 base image 編 better-sqlite3 的原生模組，之後只把編好的 node_modules 帶到最終 image。
FROM node:20-bookworm-slim AS server-build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY server/package.json server/package-lock.json* ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build \
    && npm prune --omit=dev

# ---- Stage 3: 最終執行 image ----
FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=server-build /app/dist ./dist
COPY --from=server-build /app/node_modules ./node_modules
COPY --from=server-build /app/package.json ./package.json
COPY --from=frontend-build /app/dist ./public

RUN mkdir -p /app/data \
    && chown -R node:node /app

USER node

EXPOSE 3000
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
