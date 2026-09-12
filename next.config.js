/** @type {import('next').NextConfig} */
const nextConfig = {
  // GCP Cloud Run 배포를 위한 standalone 출력 (README 섹션 9 참고)
  output: "standalone",
  async redirects() {
    // URI 계층을 상단 메뉴에 맞춘 이동 (2026-08-05). 공유·북마크된 옛 링크가 죽지 않게 영구로 남긴다.
    //  ① 루트에 있던 /ap2 를 PoCs 하위로  ② 허브 이름을 /etc → /poc (메뉴 라벨·lib/poc-cards.ts와 일치)
    // 순서 주의: /ap2 규칙이 먼저여야 /etc/:path* 와 무관하게 확실히 잡힌다.
    return [
      { source: "/ap2", destination: "/poc/ap2", permanent: true },
      { source: "/etc", destination: "/poc", permanent: true },
      { source: "/etc/:path*", destination: "/poc/:path*", permanent: true },
    ];
  },
  async rewrites() {
    // 홈(/) = 프로필 페이지(/home, linked0.github.io 미러)를 URL 유지한 채 서빙.
    // (기존 워크스페이스 인덱스는 /know.html 에서 계속 접근 가능)
    return {
      beforeFiles: [
        { source: "/", destination: "/home" },
        // jayverse-game 정적 번들(public/jayverse-game/, scripts/build-game.mjs 산출물)의
        // 확장자 없는 경로를 실제 파일로 잇는다. 게임은 자기 링크를 /jayverse-game/street
        // 처럼 내보내는데, public/ 정적 서빙은 street.html 만 안다 — 이 규칙이 없으면
        // 게임 안에서 페이지를 이동하는 순간 404 가 난다.
        // `:slug([^/.]+)` 는 점도 슬래시도 없는 한 조각만 잡는다 → _next/static/... 이나
        // favicon.ico 같은 실제 파일 요청은 그대로 통과한다.
        { source: "/jayverse-game", destination: "/jayverse-game/index.html" },
        { source: "/jayverse-game/:slug([^/.]+)", destination: "/jayverse-game/:slug.html" },
      ],
    };
  },
};

module.exports = nextConfig;
