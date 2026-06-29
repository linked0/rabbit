import Nav from "../Nav";
import InvestClient from "./InvestClient";

// Task 1 — 투자 입력 + Current Portfolio (KRW, Postgres). 인증은 middleware가 보장.
export const dynamic = "force-dynamic";

export default function InvestPage() {
  return (
    <>
      <Nav />
      <InvestClient />
    </>
  );
}
