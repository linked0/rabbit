# rabbit — Cloud Run용 멀티스테이지 빌드 (README §9)
# Node 22 필수: pnpm 11이 node:sqlite를 사용 (Node 20에는 없음)
# build
FROM node:22-slim AS builder
WORKDIR /app
# pnpm-workspace.yaml 포함 — allowBuilds(@prisma/*) 승인이 컨테이너 안에서도 적용되어야
# pnpm 11의 ERR_PNPM_IGNORED_BUILDS 없이 설치된다.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
# Prisma 클라이언트 생성 (스키마가 있어야 하므로 소스 복사 후)
RUN pnpm exec prisma generate
# JayVerse 게임(games/jayverse-game 서브모듈) → public/jayverse-game/ 정적 번들.
# 게임은 Next 16 / React 19 라 이 앱(Next 14 / React 18)과 같은 트리에서 컴파일될 수 없다.
# 자기 node_modules 로 따로 빌드해 내보낸 정적 파일만 public/ 에 얹는다 — 이 앱의
# `pnpm build` 는 그걸 그냥 정적 파일로 본다. 반드시 아래 `pnpm build` 보다 먼저 와야 한다.
# 서브모듈이 비어 있으면 스크립트가 명시적으로 실패한다 (조용히 빠진 /game 방지).
RUN pnpm game:build
# next build 시 NextAuth 설정 평가용 더미 시크릿 — 런타임에는 Cloud Run env가 덮어씀
ENV AUTH_SECRET=build-time-dummy-secret
RUN pnpm build

# run
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
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
