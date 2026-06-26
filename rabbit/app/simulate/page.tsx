import Nav from "../Nav";
import SimulateClient from "./SimulateClient";

// Task 2 — 투자 정책 시뮬레이션 v1. 인증은 middleware가 보장.
export const dynamic = "force-dynamic";

export default function SimulatePage() {
  return (
    <>
      <Nav />
      <SimulateClient />
    </>
  );
}
