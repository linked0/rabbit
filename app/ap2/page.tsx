import Nav from "../Nav";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Target IA: AP2 Test (/ap2) — 스텁. 설계: docs/features/ap2-test.md
export default function Ap2Page() {
  const lang = getLang();
  return (
    <>
      <Nav />
      <main>
        <h1>{pick(lang, "AP2 테스트 (AP2 / x402)", "AP2 Test (AP2 / x402)")}</h1>
        <p className="sub">
          {pick(lang, "준비 중 — 곧 제공됩니다. 설계: ", "Coming soon. Design: ")}
          <code>docs/features/ap2-test.md</code>
        </p>
      </main>
    </>
  );
}
