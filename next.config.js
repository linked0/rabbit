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
      beforeFiles: [{ source: "/", destination: "/home" }],
    };
  },
};

module.exports = nextConfig;
