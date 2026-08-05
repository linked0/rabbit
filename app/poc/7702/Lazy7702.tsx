"use client";

// 서버 컴포넌트에서는 next/dynamic 에 ssr:false 를 줄 수 없어, 클라이언트 래퍼를 따로 둔다
// (/poc/aa 의 LazyAA.tsx 와 같은 이유 — viem 번들을 초기 페이로드에서 빼기 위함).
import dynamic from "next/dynamic";

const loading = () => <p className="sub">Loading…</p>;

export const LazyAccountInspector = dynamic(() => import("./AccountInspector"), {
  ssr: false,
  loading,
});
