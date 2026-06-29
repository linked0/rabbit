/** @type {import('next').NextConfig} */
const nextConfig = {
  // GCP Cloud Run 배포를 위한 standalone 출력 (README 섹션 9 참고)
  output: "standalone",
  async rewrites() {
    // 홈(/) = 프로필 페이지(/home, linked0.github.io 미러)를 URL 유지한 채 서빙.
    // (기존 워크스페이스 인덱스는 /know.html 에서 계속 접근 가능)
    return {
      beforeFiles: [{ source: "/", destination: "/home" }],
    };
  },
};

module.exports = nextConfig;
