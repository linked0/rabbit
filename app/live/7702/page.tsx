import Nav from "../../Nav";
import BackLink from "../../BackLink";
import TechNotes from "../../TechNotes";
import TechNotesLink from "../../TechNotesLink";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { LazyAccountInspector } from "./Lazy7702";
import { POC_CARDS } from "@/lib/poc-cards";

const CARD = POC_CARDS.find((c) => c.key === "erc-7702")!;

// EIP-7702 — /live/aa 에서 "보이지 않는 전제조건"으로만 등장하던 표준을 따로 떼어낸 페이지.
// 시연할 버튼이 없다고 봤지만(2026-08-05, jay 지적으로 재검토) eth_getCode 로 계정 상태 변화를
// 직접 보여줄 수 있어, 가스 없는 읽기 전용 인스펙터 + 활용 사례 카탈로그로 구성했다.
export default function Erc7702Page() {
  const lang = getLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);

  const usages: { title: string; titleKo: string; body: string; bodyKo: string }[] = [
    {
      title: "Batching",
      titleKo: "배치 실행",
      body: "approve + swap in one atomic transaction with a single signature — today's most common real-world use.",
      bodyKo: "approve + swap을 서명 한 번으로 원자적 트랜잭션 하나에 — 현재 가장 흔한 실사용 사례입니다.",
    },
    {
      title: "Gas sponsorship",
      titleKo: "가스 대납",
      body: "the EOA becomes an ERC-4337 account, so a paymaster can pay its gas — no new wallet, same address.",
      bodyKo: "EOA가 ERC-4337 계정이 되어 paymaster가 가스를 대신 냅니다 — 새 지갑 없이, 같은 주소로.",
    },
    {
      title: "Session keys / delegation",
      titleKo: "세션 키 / 위임",
      body: "grant a bounded, expiring permission to another key — this is what /live/aa demonstrates.",
      bodyKo: "다른 키에 한도와 만료가 걸린 권한을 부여합니다 — /live/aa가 시연하는 것이 이것입니다.",
    },
    {
      title: "Passkey signers",
      titleKo: "패스키 서명자",
      body: "sign with Face ID / WebAuthn instead of a seed phrase, while keeping the address you already have.",
      bodyKo: "시드 구문 대신 Face ID / WebAuthn으로 서명하면서, 이미 쓰던 주소를 그대로 유지합니다.",
    },
    {
      title: "Social recovery",
      titleKo: "소셜 리커버리",
      body: "add recovery guardians to an address that already holds your funds, instead of migrating first.",
      bodyKo: "자금을 옮기지 않고, 이미 자금이 든 주소에 복구 보호자를 추가합니다.",
    },
    {
      title: "Spending policies",
      titleKo: "지출 정책",
      body: "daily limits or allowlisted contracts, enforced by the account itself rather than by a UI.",
      bodyKo: "일일 한도나 허용 컨트랙트 목록을, UI가 아니라 계정 스스로 강제합니다.",
    },
  ];

  return (
    <>
      <Nav />
      <main>
        <BackLink lang={lang} href="/live" ko="라이브" en="Live" />
        <h1>{t("EIP-7702 — 주소를 바꾸지 않는 스마트 계정", "EIP-7702 — A Smart Account Without a New Address")}</h1>
        <p className="sub">
          {t(
            "EOA는 서명만, 컨트랙트는 실행만 — 이더리움의 오래된 이분법을 EIP-7702가 깹니다. 내 주소가 코드를 가리키게 만들어, 주소·잔액·이력을 그대로 둔 채 스마트 계정 기능을 얻습니다. 아래 인스펙터는 읽기 전용이라 가스도 지갑도 필요 없습니다.",
            "EOAs can only sign; contracts can only execute. EIP-7702 breaks that old dichotomy by pointing your address at code — you gain smart-account behavior while keeping the same address, balance, and history. The inspector below is read-only: no gas, no wallet needed."
          )}
        </p>
        <TechNotesLink lang={lang} />

        <LazyAccountInspector />

        <h2 style={{ marginTop: 32 }}>{t("이 스펙으로 만들 수 있는 것들", "What the spec is used for")}</h2>
        <p className="sub">
          {t(
            "\"내 EOA가 아무 코드나 가리키게 한다\"는 한 줄이 전부라, 응용은 구현체를 무엇으로 두느냐에 달려 있습니다.",
            "The spec says only one thing — \"point my EOA at some code\" — so the applications depend entirely on which implementation you point at."
          )}
        </p>
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {usages.map((u) => (
            <div key={u.title} className="panel" style={{ maxWidth: 620 }}>
              <strong>{t(u.titleKo, u.title)}</strong>
              <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
                {t(u.bodyKo, u.body)}
              </p>
            </div>
          ))}
        </div>

        <h2 style={{ marginTop: 32 }}>{t("⚠️ 트레이드오프", "⚠️ The tradeoff")}</h2>
        <p className="sub" style={{ maxWidth: 620 }}>
          {t(
            "힘이 큰 만큼 위험도 큽니다. 7702 인가에 서명하는 것은 지정한 컨트랙트에 계정의 완전한 통제권을 넘기는 일이고, 해제하기 전까지 지속됩니다. 더 미묘한 위험도 있습니다 — 구현체를 바꿔도 이전 구현체가 쓴 스토리지는 남기 때문에, 잘못 설계된 구현체는 기존 데이터와 충돌할 수 있습니다.",
            "The power cuts both ways. Signing a 7702 authorization hands complete control of your account to whatever contract it names, and it persists until you revoke it. There is a subtler hazard too: switching implementations leaves the previous one's storage in place, so a poorly designed implementation can collide with data that is already there."
          )}
        </p>

        <TechNotes cards={[CARD]} lang={lang} />
      </main>
    </>
  );
}
