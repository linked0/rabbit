"use client";

// SessionKeyDemo/AgenticPillars를 code-split — viem + @metamask/smart-accounts-kit + thirdweb를
// 합치면 번들이 커서(651kB) 첫 방문 시 페이지 골격(Nav·제목·설명)까지 늦게 뜨는 문제가 있었다
// (jay, 2026-08-04 — "클릭하면 오래 걸린다"). next/dynamic(ssr:false)로 분리해 페이지 골격은
// 즉시 그리고, 무거운 SDK는 그 뒤에 별도 청크로 불러온다. 서버 컴포넌트(page.tsx)에서
// `ssr:false`를 직접 못 쓰기 때문에 이 클라이언트 래퍼가 필요하다.
import dynamic from "next/dynamic";

const loading = () => (
  <p className="sub" style={{ marginTop: 16 }}>
    불러오는 중… / Loading…
  </p>
);

export const LazySessionKeyDemo = dynamic(() => import("./SessionKeyDemo"), {
  ssr: false,
  loading,
});

export const LazyAgenticPillars = dynamic(() => import("./AgenticPillars"), {
  ssr: false,
  loading,
});
