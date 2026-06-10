import Dashboard from "../Dashboard";
import Nav from "../Nav";

// v0 포트폴리오 대시보드 — 보조 탭으로 이동 (plan §4). 인증은 middleware가 보장.
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <>
      <Nav />
      <Dashboard />
    </>
  );
}
