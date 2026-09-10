import Nav from "../../Nav";
import NotifyPageView from "@/app/NotifyPageView";
import { Auditor } from "@/components/auditor/Auditor";

// Authority Auditor, ported into rabbit as a live demo (jay, 2026-09-10).
// The auditor is pure client-side (evaluate() runs in the browser, no backend),
// so this route just mounts the copied <Auditor/> client component inside rabbit's
// chrome. Logic lives in lib/auditor/, UI in components/auditor/.
export const metadata = {
  title: "Authority Auditor — Jayverse",
  description: "Who can act alone on your wallet/dapp — a per-action authority matrix.",
};

export default function AuditorPage() {
  return (
    <>
      <Nav />
      <NotifyPageView path="/live/auditor" />
      <main className="auditor-scope">
        <h1>Authority Auditor</h1>
        <p className="muted">
          Who can <strong>sign / recover / export keys / change policy / pause / upgrade</strong> —
          alone, or only in cooperation. Read-only: no keys, no custody, no transactions.
        </p>
        <p className="small muted">
          Pick a preset, fill the guided form, or paste a provider&apos;s exported config. The
          per-provider parsers (Privy, Dynamic, Web3Auth, Turnkey) map it to the authority matrix.
          On-chain verification (viem reads) is Phase 3.
        </p>
        <Auditor />
      </main>
    </>
  );
}
