# rabbit — Cloud Run용 멀티스테이지 빌드 (README §9)
# Node 22 필수: pnpm 11이 node:sqlite를 사용 (Node 20에는 없음)
# build
FROM node:22-slim AS builder
WORKDIR /app
# pnpm-workspace.yaml 포함 — allowBuilds(@prisma/*) 승인이 컨테이너 안에서도 적용되어야
# pnpm 11의 ERR_PNPM_IGNORED_BUILDS 없이 설치된다.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# vendor/verex-sdk — `@verex/sdk` 는 `file:` 의존성이라 **install 이 돌기 전에**
# 존재해야 한다. 아래 `COPY . .` 는 install 다음이므로 그때는 이미 늦다
# (2026-08-28: 이 순서 때문에 컨테이너 빌드가 ENOENT 로 죽었다).
COPY vendor ./vendor
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
# Prisma 클라이언트 생성 (스키마가 있어야 하므로 소스 복사 후)
RUN pnpm exec prisma generate
# next build 시 NextAuth 설정 평가용 더미 시크릿 — 런타임에는 Cloud Run env가 덮어씀
ENV AUTH_SECRET=build-time-dummy-secret
RUN pnpm build

# run
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Prisma 의 쿼리 엔진(debian-openssl-3.0.x)은 시스템 libssl3 에 동적 링크된다.
# node:22-slim 은 libssl 을 담지 않아, 이게 없으면 엔진 require 가 실패하고 모든 DB
# 쿼리가 "cannot find libssl" 로 죽는다 — mandate 패널만이 아니라 전부 (jay, 2026-09-08).
# 빌더 단계는 prisma generate 만 하므로 libssl 이 필요 없지만, 런타임은 필요하다.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# content/ — Jay Chat's RAG corpus depth (content/profile/*.md). Without this the
# About-me feature still works from lib/home-content.ts, just without the markdown depth.
COPY --from=builder /app/content ./content
# docs/code/ — per-PoC-card runnable snippets that TechNotes.tsx reads at request time
# (jay, 2026-08-13). Only this subfolder, not all of docs/ — same "exact output paths" rule.
COPY --from=builder /app/docs/code ./docs/code
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]
