"use client";

// /live/aa 의 LazyAA 와 같은 이유로 code-split: thirdweb SDK 는 무겁고, 마켓 그리드의
// 골격(제목·카드 목록)은 지갑 없이도 즉시 떠야 한다. 서버 컴포넌트(page.tsx)에서
// `ssr:false` 를 직접 못 쓰므로 이 클라이언트 래퍼가 필요하다.
import dynamic from "next/dynamic";

export const LazyMarkets = dynamic(() => import("./MarketsClient"), {
  ssr: false,
  loading: () => (
    <p className="sub" style={{ marginTop: 16 }}>
      불러오는 중… / Loading…
    </p>
  ),
});
