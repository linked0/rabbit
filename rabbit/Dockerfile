# rabbit — Cloud Run용 멀티스테이지 빌드 (README §9)
# Node 22 필수: pnpm 11이 node:sqlite를 사용 (Node 20에는 없음)
# build
FROM node:22-slim AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
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
