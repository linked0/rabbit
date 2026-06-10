/** @type {import('next').NextConfig} */
const nextConfig = {
  // GCP Cloud Run 배포를 위한 standalone 출력 (README 섹션 9 참고)
  output: "standalone",
  async rewrites() {
    // 공개 랜딩 (plan §3): / → public/know.html
    return {
      beforeFiles: [{ source: "/", destination: "/know.html" }],
    };
  },
};

module.exports = nextConfig;
