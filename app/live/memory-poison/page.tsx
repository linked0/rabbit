import Nav from "../../Nav";
import BackLink from "../../BackLink";
import TechNotes from "../../TechNotes";
import TechNotesLink from "../../TechNotesLink";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { POC_CARDS } from "@/lib/poc-cards";
import MemoryPoisonSim from "./MemoryPoisonSim";

const CARD = POC_CARDS.find((c) => c.key === "memory-poison")!;

// The fake letter (jay, 2026-10-29): Patlan et al. (2025)'s ElizaOS memory-injection case,
// replayed as a scripted simulation with jay's X handle as the owner. Pure client-side —
// no model call, no key, no transaction — so a public page cannot be turned into a live
// injection harness or spend the API credit.
export default function MemoryPoisonPage() {
  const lang = getLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);

  return (
    <>
      <Nav />
      <main>
        <BackLink lang={lang} href="/live" ko="데모" en="Demo" />
        <h1>{t("가짜 편지 — 오염된 메모리가 송금을 돌린다", "The fake letter — poisoned memory redirects a transfer")}</h1>
        <p className="sub">
          {t(
            "Patlan 외(2025)는 ElizaOS 에이전트의 메모리에 Discord 로 올린 위조 '지난 대화'를 심었고, 나중에 X 에서 들어온 송금 요청이 공격자 주소로 갔습니다(Sepolia, 연구 데모). 아래는 그 흐름을 주인 @kindofblue91 로 다시 짠 시뮬레이션입니다. 모델 호출도, 서명도, 트랜잭션도 없습니다.",
            "Patlan et al. (2025) planted a forged \"past conversation\", posted on Discord, in an ElizaOS agent's memory; a transfer later requested on X went to the attacker's address (on Sepolia, a research demo). Below, that flow is replayed with @kindofblue91 as the owner. It is a scripted simulation: no model call, no signature, no transaction."
          )}
        </p>
        <TechNotesLink lang={lang} />

        <MemoryPoisonSim lang={lang} />

        <h2 style={{ marginTop: 32 }}>{t("무엇을 보여 주나", "What it shows")}</h2>
        <div style={{ display: "grid", gap: 12, maxWidth: 620 }}>
          <div className="panel">
            <strong>{t("메모리는 출처 없는 입력이다", "Memory is input without provenance")}</strong>
            <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
              {t(
                "모든 플랫폼이 하나의 메모리 로그를 공유하면, 누구든 글 한 줄로 '주인이 예전에 한 말'을 만들 수 있습니다. 간접 프롬프트 인젝션(Greshake 외)이 한 번으로 끝나지 않고 저장되어 계속 작동합니다.",
                "When every platform writes to one memory log, anyone can manufacture \"something the owner said earlier\" with one post. This is indirect prompt injection (Greshake et al.) made persistent."
              )}
            </p>
          </div>
          <div className="panel">
            <strong>{t("검증자 다섯이 같은 걸 보면 하나다", "Five validators checking the same thing are one")}</strong>
            <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
              {t(
                "에이전트는 자기 키로 서명하므로 서명은 진짜이고, 금액도 한도 안입니다. 검증자가 그 둘만 보면 5/5 로 통과합니다 — Bybit 의 '유효한 서명 세 개'와 같은 구조입니다.",
                "The agent signs with its own key, so the signature is genuine and the amount is under the cap. Validators that check only those pass it 5/5, the same shape as Bybit's three valid signatures."
              )}
            </p>
          </div>
          <div className="panel">
            <strong>{t("방어는 모델 밖에서, 원래 요청에 묶는다", "The defense lives outside the model, bound to the original request")}</strong>
            <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
              {t(
                "방어를 켜면 각 검증자가 주인이 서명한 X 요청에서 수신자를 직접 꺼내 tx.to 와 비교합니다. 메모리는 이 검사의 입력이 아니므로, 메모리를 아무리 오염시켜도 결과가 바뀌지 않습니다.",
                "With the defense on, each validator reads the recipient straight from the owner's signed X request and compares it with tx.to. Memory is not an input to that check, so no amount of poisoning changes the outcome."
              )}
            </p>
          </div>
        </div>

        <TechNotes cards={[CARD]} lang={lang} />
      </main>
    </>
  );
}
