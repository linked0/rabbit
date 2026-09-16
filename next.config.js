/** @type {import('next').NextConfig} */
const nextConfig = {
  // GCP Cloud Run 배포를 위한 standalone 출력 (README 섹션 9 참고)
  output: "standalone",
  async redirects() {
    // URI 계층을 상단 메뉴에 맞춘 이동 (2026-08-05). 공유·북마크된 옛 링크가 죽지 않게 영구로 남긴다.
    //  ① 루트에 있던 /ap2 를 상세 페이지로  ② 허브 이름을 /etc → /poc
    // 순서 주의: /ap2 규칙이 먼저여야 /etc/:path* 와 무관하게 확실히 잡힌다.
    return [
      { source: "/ap2", destination: "/live/ap2", permanent: true },
      // /devnet → /chains (2026-09-16). 데브넷 한 체인만 보여 주던 페이지가 세 체인
      // (로컬 Anvil·데브넷·Sepolia)을 함께 보여 주는 페이지가 됐다. 공유된 링크와
      // 북마크가 살아 있도록 영구 리다이렉트를 남긴다 — /etc → /poc 와 같은 처리.
      { source: "/devnet", destination: "/chains", permanent: true },
      { source: "/etc", destination: "/poc", permanent: true },
      { source: "/etc/:path*", destination: "/poc/:path*", permanent: true },
      // live 상세 5개(ap2·7702·aa·agent·toss)가 /poc → /live 로 옮겨졌다 (2026-08-26, jay).
      // **리다이렉트를 남기지 않기로 했다** — jay 결정. 옛 `/poc/<name>` 은 이제 404 다.
      // 근거: 이 다섯은 배포된 적이 없는 로컬·데모 경로가 대부분이고, 규칙 8줄을 영구히
      // 지고 가느니 URL 하나를 깨끗이 버리는 편이 낫다는 판단. 되살리려면 위 /etc 규칙과
      // 같은 모양으로 다시 넣으면 된다(와일드카드 `/poc/:path*` 는 쓰지 말 것 — /poc 에
      // 남은 dvt·oz-relayer·[key] 상세까지 존재하지 않는 /live/... 로 튄다).
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
