"use client";

import dynamic from "next/dynamic";

// WebGL needs the browser — no SSR, and no point paying the three.js bundle
// cost until this client component actually mounts.
const VerexBall = dynamic(() => import("./VerexBall"), { ssr: false });

export default function VerexBallLazy() {
  return <VerexBall />;
}
