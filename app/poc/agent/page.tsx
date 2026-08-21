import Nav from "../../Nav";
import BackLink from "../../BackLink";
import TechNotes from "../../TechNotes";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { POC_CARDS } from "@/lib/poc-cards";
import AgentJournalMock from "./AgentJournalMock";

const AGENT_CARD = POC_CARDS.find((c) => c.key === "agent")!;

// 자율 결제 에이전트 — 논의용 목업 (jay 요청, 2026-08-06). 설계: docs/tasks/current-plan.md.
// 아직 구현이 아니다. 화면에 보이는 값은 전부 AgentJournalMock.tsx의 각본이고, 체인·지갑·
// 스케줄러 어느 것도 붙어 있지 않다. PoCs 카드가 "준비 중"인 이유도 그것 — 카드에서 링크되지
// 않으므로 이 페이지는 URL로만 들어온다. 실제 구현(M3)에서 카드를 live로 바꾼다.
export default function AgentMockPage() {
  const lang = getLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);

  return (
    <>
      <Nav />
      <main>
        <BackLink lang={lang} />
        <h1>{t("자율 결제 에이전트", "Autonomous payment agent")}</h1>
        <p className="sub">
          {t(
            "타이머에 깨어나 스스로 지출 여부를 판단하고, 받은 위임을 넘길 수 없는 에이전트.",
            "An agent that wakes on a timer, decides on its own whether to spend, and cannot exceed the mandate it was given."
          )}
        </p>

        <div
          className="panel"
          style={{ marginTop: 16, borderColor: "#f59e0b", borderWidth: 2, borderStyle: "solid" }}
        >
          <strong style={{ color: "#b45309" }}>
            {t("목업 — 아직 아무것도 실제로 돌지 않습니다", "Mock — nothing here is running yet")}
          </strong>
          <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
            {t(
              "체인도, 지갑도, 스케줄러도 붙어 있지 않습니다. 아래 값은 전부 손으로 적은 각본이고, 「다음 틱」 버튼이 그것을 한 줄씩 보여줄 뿐입니다. 만들기 전에 화면의 모양을 두고 이야기하기 위한 페이지입니다.",
              "No chain, no wallet, no scheduler. Every value below is a hand-written script, and the “next tick” button just reveals it one row at a time. This page exists so the shape can be argued about before it is built."
            )}
          </p>
        </div>

        <div className="panel" style={{ marginTop: 24 }}>
          <strong>{t("무엇을 보아야 하나", "What to look for")}</strong>
          <ol className="sub" style={{ marginTop: 8, paddingLeft: 20, fontSize: 13.5 }}>
            <li>
              {t(
                "위임 안에서 아무것도 하지 않는 틱 — 대부분이 이렇다. 결제 성공만 보여주는 페이지였다면 이건 그냥 능력 데모의 반복이었을 것이다.",
                "Ticks where the agent does nothing — most of them. A page showing only successful payments would just be the capability demo again."
              )}
            </li>
            <li>
              {t("위임 안에서 실제로 지출하는 틱 — 한도가 눈앞에서 줄어든다.", "Ticks where it does spend — the budget decrements in front of you.")}
            </li>
            <li>
              {t(
                "만료 이후 — 같은 코드가 계속 돌면서 계속 무해하게 거부당한다. 안전이 신뢰가 아니라 산수라는 말의 뜻이 여기서 보인다.",
                "After expiry — the same code keeps running and keeps failing harmlessly. This is where “safety is arithmetic, not trust” becomes visible."
              )}
            </li>
          </ol>
        </div>

        <AgentJournalMock />

        {/* 2026-08-11 — jay와 이 시나리오를 한 줄씩 따라가며 나온 오해들을 그대로 옮겼다.
            전부 "물어볼 만해서 물어본" 것들이다: 이름이 겹치거나(delegation이 셋),
            비유가 새거나(코드가 계정을 "호출"한다), 표준의 범위를 넓게 잡아서(7710이
            강제까지 정의할 것 같다) 생긴다. 목업 옆에 붙여 두는 이유는, 화면만 보면
            정확히 이 여섯 가지를 틀리게 읽게 되기 때문이다. */}
        <div className="panel" style={{ marginTop: 24 }}>
          <strong>{t("여기서 거의 모두가 틀리는 여섯 가지", "Six things this stack is routinely misread as")}</strong>
          <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
            {t(
              "화면을 보고 자연스럽게 도달하지만 틀린 결론들. 각 항목은 「흔한 읽기 → 실제」다.",
              "Conclusions the screen invites, and none of them right. Each item reads: the common reading, then what is actually true."
            )}
          </p>
          <ol className="sub" style={{ marginTop: 8, paddingLeft: 20, fontSize: 13.5 }}>
            <li>
              {t(
                "「delegation이 하나다」 → 셋이고 서로 무관하다. EIP-7702의 delegation designator(내 EOA가 어떤 코드로 도는가), ERC-7710의 delegation(에이전트가 받은 위임), 그리고 DelegationManager(에이전트가 호출하는 컨트랙트). 같은 단어일 뿐이다 — 문서에서는 각각 account implementation · mandate · permission manager로 부르는 게 낫다.",
                "“Delegation means one thing” → it means three unrelated things. EIP-7702's delegation designator (which code your EOA runs), ERC-7710's delegation (the mandate the agent holds), and the DelegationManager (the contract the agent calls). Shared noun, nothing else. Call them account implementation, mandate, and permission manager instead."
              )}
            </li>
            <li>
              {t(
                "「구현체(DeleGator)가 내 계정을 대신해 돈을 보낸다」 → 대신이 아니라 내 계정으로서다. 구현체는 호출되지 않는다 — EVM이 그 코드를 로드해 내 주소의 컨텍스트로 실행한다. USDC가 보는 msg.sender는 내 EOA이고, 구현체의 USDC 잔액은 영원히 0이다. 코드는 구현체에서, 정체성은 EOA에서.",
                "“The implementation (DeleGator) sends money on my behalf” → not on your behalf — as you. It is never called; the EVM loads its code and runs it in your address's context. USDC sees msg.sender as your EOA, and the implementation's own USDC balance is zero forever. Code from the implementation, identity from the EOA."
              )}
            </li>
            <li>
              {t(
                "「enforcer가 잔액을 들고 있다」 → 정수 하나를 들고 있다. 담보도 에스크로도 없고, 예약되는 자금도 없다. 그리고 그 카운터는 세션 키가 아니라 위임 해시로 키잉된다 — 같은 키에 위임을 둘 부여하면 예산도 둘이고 합산되지 않는다.",
                "“The enforcer holds a balance” → it holds an integer. No custody, no escrow, nothing set aside. And that counter is keyed by delegation hash, not by session key — grant the same key two mandates and you get two budgets that never pool."
              )}
            </li>
            <li>
              {t(
                "「한도는 표준이 강제한다」 → ERC-7710이 정의하는 건 redeemDelegations() 하나뿐이다. permission context는 bytes[], 즉 불투명 타입으로 선언되어 있어서 caveat이라는 개념 자체가 스펙 범위 밖이다. 실제로 「아니오」라고 말하는 enforcer들은 MetaMask의 delegation-framework다. 「온체인 컨트랙트가 강제」는 참이지만 「표준이 강제」는 거짓이다.",
                "“The cap is enforced by a standard” → ERC-7710 defines exactly one function, redeemDelegations(). The permission context is typed bytes[] — opaque — so caveats are outside the spec's scope entirely. The enforcers that actually say no are MetaMask's delegation-framework. “Enforced on-chain by contract” is true; “enforced by a standard” is not."
              )}
            </li>
            <li>
              {t(
                "「위임을 부여하면 체인에 기록된다」 → 아무것도 기록되지 않는다. grantPermissions는 트랜잭션이 아니라 서명된 객체를 돌려줄 뿐이고, 가스도 흔적도 없다. 서명한 수표와 같다 — 은행은 누가 현금화하기 전까지 그게 있는 줄도 모른다. 따라오는 결과 둘: 미사용 위임은 체인 스캔으로 감사할 수 없고, 취소는 부여와 대칭이 아니다(가스가 드는 온체인 트랜잭션이다). 만료가 중요한 진짜 이유가 이것이다 — 아무 행동도 가스도 주의도 필요 없는 유일한 취소다.",
                "“Granting a mandate writes it to the chain” → nothing is written. grantPermissions is not a transaction; it returns a signed object, with no gas and no footprint. It is a signed cheque — the bank does not know it exists until someone cashes it. Two consequences: an unused mandate cannot be audited by scanning the chain, and revocation is not symmetric with granting (it costs an on-chain transaction). That is the real argument for the expiry field — it is the only revocation that needs no action, no gas, and nobody paying attention."
              )}
            </li>
            <li>
              {t(
                "「예산은 하나다」 → 셋이고, 지키는 주체가 다르다. ① 위임 한도 — enforcer가 강제. ② 실제 자금(오너의 USDC) — 토큰 컨트랙트가 강제, 위임과 독립이라 「한도는 남았는데 잔고가 없음」이 가능하다. ③ 세션 계정의 가스 — 강제하는 것이 아무것도 없다. 셋째가 떨어지면 에이전트는 revert도 저널 행도 알림도 없이 조용히 멈춘다. 무인 에이전트가 실제로 죽는 방식이라면, 잔여 가스는 비용 열이 아니라 자체 만료를 가진 두 번째 예산으로 헤더에 있어야 한다.",
                "“There is one budget” → there are three, with different guardians. ① The mandate — enforced by a caveat contract. ② The actual funds (the owner's USDC) — enforced by the token, and independent of the mandate, so “allowance left, balance empty” is a real state. ③ The session account's gas — enforced by nothing at all. When the third runs out the agent stops silently: no revert, no journal row, no notification. If that is how unattended agents really die, remaining gas belongs in the header as a second budget with its own expiry, not as a cost column."
              )}
            </li>
          </ol>
        </div>

        <div className="panel" style={{ marginTop: 24 }}>
          <strong>{t("이 목업을 두고 정해야 할 것", "What this mock is meant to settle")}</strong>
          <ul className="sub" style={{ marginTop: 8, paddingLeft: 20, fontSize: 13.5 }}>
            <li>
              {t(
                "저널의 열 구성이 맞나 — 시각·관측·규칙·결과·기록. 빠진 열(가스비, 누적 지출, 다음 틱 예정 시각)이 있나?",
                "Are these the right columns — time, observation, rule, outcome, note? Anything missing (gas cost, cumulative spend, next scheduled tick)?"
              )}
            </li>
            <li>
              {t(
                "신호를 무엇으로 할까 — 지금 각본은 ETH/USD 가격 변동이다. 이 데모에서 가격이 그럴듯한 방아쇠인가, 아니면 「구독 갱신」처럼 더 단순한 게 나은가?",
                "What should the signal be? The script uses an ETH/USD move. Is a price the right trigger here, or is something plainer — a subscription renewal — a better fit?"
              )}
            </li>
            <li>
              {t(
                "직접 조작할 부분이 어디까지인가 — 방문자가 위임을 직접 부여하나, 아니면 내 위임으로 도는 걸 읽기만 하나? 후자면 지갑 없이도 볼 수 있다.",
                "How much should a visitor drive? Do they grant their own mandate, or only read a journal from mine? The latter works with no wallet at all."
              )}
            </li>
            <li>
              {t(
                "만료 상태를 어떻게 유지해 보여줄까 — 실제로는 만료된 위임을 계속 두면 저널이 거부로만 채워진다. 그게 좋은 건가, 아니면 새 위임으로 리셋할 수단이 필요한가?",
                "How do we keep the expiry state visible? In reality a lapsed mandate fills the journal with nothing but rejections. Is that the point, or does it need a reset?"
              )}
            </li>
          </ul>
          <p className="sub" style={{ marginTop: 8, fontSize: 13 }}>
            {t(
              "가스·키 보관·스케줄러 호스트·저널 저장소 결정은 docs/features/README.md의 백로그 B1에 D1–D5로 있다.",
              "The gas, key-custody, scheduler-host, and journal-storage decisions live in docs/features/README.md, backlog item B1, as D1–D5."
            )}
          </p>
        </div>

        <div className="panel" style={{ marginTop: 24 }}>
          <strong>{t("이 데모가 증명하지 않는 것", "What this demo does not prove")}</strong>
          <ul className="sub" style={{ marginTop: 8, paddingLeft: 20, fontSize: 13.5 }}>
            <li>
              {t(
                "자율적인 목표 설정이 아니다 — 정책을 쓰고 위임을 부여하는 건 여전히 사람이다. 에이전트가 정하는 건 「언제」와 「할지 말지」이지 「무엇을 위해」가 아니다.",
                "Not autonomous goal-setting — a human still writes the policy and grants the mandate. The agent chooses when and whether, not what for."
              )}
            </li>
            <li>
              {t(
                "운영 수준의 키 보관이 아니다 — 서버가 세션 키를 들고 있는 건 데모의 타협이다.",
                "Not production custody — a server holding the session key is a demo compromise."
              )}
            </li>
            <li>
              {t(
                "투자 전략이 아니다 — 가격 규칙은 그럴듯한 방아쇠일 뿐 조언이 아니다. 이 데모의 주제는 거래가 아니라 결제 위임이다.",
                "Not a market strategy — the price rule is a plausible trigger, not advice. The subject here is the payment mandate, not the trade."
              )}
            </li>
            <li>
              {t(
                "만료 판정은 벽시계가 아니라 블록 시간 기준이고, 위임이 끝났다고 알려주는 것도 없다 — 에이전트가 자기 거부를 스스로 알아채야 한다.",
                "Expiry is judged by block time, not your wall clock, and nothing notifies the owner when the mandate lapses — the agent has to notice its own rejection."
              )}
            </li>
          </ul>
        </div>

        <TechNotes cards={[AGENT_CARD]} lang={lang} />
      </main>
    </>
  );
}
