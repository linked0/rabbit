import Nav from "../Nav";

// Knowledge (/knowledge) — know.html(워크스페이스 인덱스)을 iframe으로 서빙 (Jun-30 design §4).
// 원본: public/knowledge/know.html (루트에서 이동). 정적 파일이라 미들웨어 matcher에서 knowledge/ 제외.
export const metadata = { title: "지식 (Knowledge)" };

export default function KnowledgePage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: 1100 }}>
        <h1>지식 (Knowledge)</h1>
        <iframe
          src="/knowledge/know.html"
          title="Knowledge — Workspace Index"
          style={{
            width: "100%",
            height: "calc(100vh - 160px)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            background: "#fff",
          }}
        />
      </main>
    </>
  );
}
