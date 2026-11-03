"use client";

import dynamic from "next/dynamic";
import type { Lang } from "@/lib/i18n";

// WebGL 은 브라우저에서만 돈다 — 서버 렌더에서 빼고 불러온다 (VerexBallLazy 와 같은 처리).
const MetaverseRun = dynamic(() => import("./MetaverseRun"), { ssr: false });

export default function MetaverseLazy({ lang }: { lang: Lang }) {
  return <MetaverseRun lang={lang} />;
}
