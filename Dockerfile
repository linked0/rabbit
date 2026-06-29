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
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]
