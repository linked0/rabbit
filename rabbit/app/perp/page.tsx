import Nav from "../Nav";
import PerpClient from "./PerpClient";

// Task 3 — Hyperliquid ETH-PERP 표시 (Phase 1, 읽기 전용). 인증은 middleware가 보장.
export const dynamic = "force-dynamic";

export default function PerpPage() {
  return (
    <>
      <Nav />
      <PerpClient />
    </>
  );
}
