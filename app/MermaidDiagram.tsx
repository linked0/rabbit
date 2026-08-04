"use client";

// 카드별 흐름도(시퀀스 다이어그램) 렌더러 — TechNotes 섹션 전용 (jay, 2026-08-04).
// mermaid는 브라우저 전용 SVG 렌더링이라 서버 컴포넌트에서 못 씀 → 클라이언트 컴포넌트로 분리.
import { useEffect, useId, useRef, useState } from "react";

export default function MermaidDiagram({ definition }: { definition: string }) {
  const id = useId().replace(/:/g, "-");
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" });
      try {
        const { svg } = await mermaid.render(`mmd-${id}`, definition);
        if (!cancelled && containerRef.current) containerRef.current.innerHTML = svg;
      } catch (e) {
        if (!cancelled) setError(String(e instanceof Error ? e.message : e));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, definition]);

  if (error) return <p className="sub" style={{ color: "#dc2626" }}>{error}</p>;
  return <div ref={containerRef} style={{ overflowX: "auto", margin: "12px 0" }} />;
}
