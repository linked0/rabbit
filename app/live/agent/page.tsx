import Nav from "../../Nav";
import BackLink from "../../BackLink";
import TechNotes from "../../TechNotes";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { POC_CARDS } from "@/lib/poc-cards";
import AgentJournalMock from "./AgentJournalMock";

const AGENT_CARD = POC_CARDS.find((c) => c.key === "agent")!;

// 자율 거래 에이전트 — 공개 개요 페이지. 설계: docs/tasks/current-plan.md,
// 실제 구조: docs/features/autonomous-trading-agent.md.
//
// 2026-08-26, 카드가 live 로 올라갔다(jay). 그래서 이 페이지의 역할이 바뀐다 — 예전엔
// "아직 아무것도 안 돈다"고 말하는 목업 페이지였지만, 이제는 **무엇이 만들어졌는지 보여주는
// 공개 페이지**다. 조작판(`/live/agent/console`)은 anvil 과 verex API 가 도는 기계에서만
// 열리므로 카드가 그쪽을 걸 수 없고, 그 역할을 이 페이지가 대신한다.
//
// 아래 AgentJournalMock 은 **지우지 않았다.** 손으로 쓴 각본이지만 저널의 모양을 설명하는
// 삽화로는 여전히 최선이고, 방문자는 체인 없이 그 모양을 볼 방법이 달리 없다. 다만 "이건
// 각본"이라고 그 자리에서 말한다 — 실제 저널은 조작판에 있다.
export default function AgentMockPage() {
  const lang = getLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);

  return (
    <>
      <Nav />
      <main>
        <BackLink lang={lang} href="/live" ko="라이브" en="Live" />
        <h1>{t("자율 결제 에이전트", "Autonomous payment agent")}</h1>
        <p className="sub">
          {t(
            "타이머에 깨어나 스스로 지출 여부를 판단하고, 받은 위임을 넘길 수 없는 에이전트.",
            "An agent that wakes on a timer, decides on its own whether to spend, and cannot exceed the mandate it was given."
          )}
        </p>

        <div
          className="panel"
          style={{ marginTop: 16, borderColor: "#16a34a", borderWidth: 2, borderStyle: "solid" }}
        >
          <strong style={{ color: "#166534" }}>
            {t("만들어졌고, 로컬 체인 위에서 돕니다", "Built, and running against a local chain")}
          </strong>
          <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
            {t(
              "에이전트가 뉴스를 읽고, LLM 에게 확률을 묻고, 살아 있는 호가와 비교해, 계정도 없는 예측시장(verex)에서 거래합니다. 상한과 기한은 제 코드가 아니라 온체인 컨트랙트 둘이 강제합니다 — ",
              "The agent reads news, asks an LLM for a probability, compares it to a live order book, and trades on a prediction market (verex) it has no account with. The cap and the deadline are enforced not by its own code but by two on-chain contracts — ",
            )}
            <code>ERC20TransferAmountEnforcer</code>
            {t(" 와 ", " and ")}
            <code>TimestampEnforcer</code>.
          </p>
          <p className="sub" style={{ marginTop: 8, fontSize: 13 }}>
            {t("조작하려면 ", "To drive it, the ")}
            <a href="/live/agent/console">{t("조작판", "operator console")}</a>
            {t(
              " 이 있습니다 — 다만 anvil 과 verex API 가 도는 기계에서만 열립니다. 그래서 이 페이지가 대신 설명합니다.",
              " is where you do it — but it only opens in front of a running anvil and verex API. Hence this page.",
            )}
          </p>
        </div>

        {/* 데모의 주장이 참인지 방문자가 코드 없이 확인할 수 있는 유일한 지점 — 컨트랙트가
            실제로 뭐라고 거절했는지 그대로 옮긴다. `pnpm delegation:verify` 의 출력이다. */}
        <div className="panel" style={{ marginTop: 16 }}>
          <strong>{t("경계가 진짜라는 증거", "The boundaries, actually refusing")}</strong>
          <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
            {t(
              "verex 도 지갑도 없이 로컬 체인 하나만으로 재현됩니다 (rabbit 저장소에서 ",
              "Reproducible on a bare local chain — no verex, no wallet (in the rabbit repo: ",
            )}
            <code>pnpm delegation:verify</code>
            {t("):", "):")}
          </p>
          <pre className="sub" style={{ marginTop: 8, fontSize: 12.5, overflowX: "auto" }}>{`1. draw 4 of 10 …………  agent USDC: 4
2. cap exceeded ………  ERC20TransferAmountEnforcer:allowance-exceeded   (still 4)
3. after expiry ………  TimestampEnforcer:expired-delegation             (still 4)`}</pre>
          <p className="sub" style={{ marginTop: 8, fontSize: 13 }}>
            {t(
              "3번이 이 데모의 전부입니다 — 아무도 취소하지 않았습니다. 창이 닫혔을 뿐인데 같은 코드가 같은 키로 계속 돌면서 계속 무해하게 거절당합니다.",
              "Line 3 is the whole argument — nobody revoked anything. The window closed, and the same code with the same key keeps running and keeps being harmlessly refused.",
            )}
          </p>
        </div>

        {/* 아직 아닌 것을 카드가 live 라는 이유로 숨기지 않는다. */}
        <div className="panel" style={{ marginTop: 16, borderColor: "#f59e0b", borderWidth: 2, borderStyle: "solid" }}>
          <strong style={{ color: "#b45309" }}>
            {t("아직 무인 운영은 아닙니다", "Not unattended yet")}
          </strong>
          <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
            {t(
              "스케줄러가 아직 붙지 않아 지금은 사람이 틱을 누릅니다. 그러니 이 데모가 증명하는 것은 무인 운영이 아니라 경계 지어진 자율성입니다 — 판단은 에이전트가 하고, 피해의 크기는 컨트랙트가 정합니다. 그리고 이 페이지도, 배포된 사이트에서는 체인이 없어 조작판이 열리지 않습니다.",
              "The scheduler is not wired, so a human presses tick. What this proves is therefore bounded autonomy, not unattended operation — the agent makes the judgement, the contracts fix the worst case. And on the deployed site there is no chain, so the console will not run.",
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

        {/* 손으로 쓴 각본이다. 실제 저널은 조작판에 있고 체인이 필요하다 — 방문자가 저널의
            모양을 볼 수 있는 유일한 방법이라 남겨두되, 그 사실을 여기서 말한다. */}
        <p className="sub" style={{ marginTop: 24, fontSize: 13 }}>
          {t(
            "아래는 저널의 모양을 보여주는 손으로 쓴 삽화입니다 — 체인 없이도 열리도록. 진짜 저널은 조작판에 있습니다.",
            "Below is a hand-written illustration of the journal's shape, so it opens with no chain attached. The real journal lives in the console.",
          )}
        </p>
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

        {/* 2026-08-26 — 이 자리는 원래 "이 목업을 두고 정해야 할 것"이라는 열린 질문 넷이었다.
            구현이 끝나면서 전부 답해졌으므로 질문을 지우지 않고 **답과 함께** 남긴다. 무엇을
            물었는지가 사라지면 왜 지금 모양이 이런지도 사라진다. */}
        <div className="panel" style={{ marginTop: 24 }}>
          <strong>{t("이 목업이 물었던 것, 그리고 구현이 낸 답", "What this mock asked, and what the build answered")}</strong>
          <ul className="sub" style={{ marginTop: 8, paddingLeft: 20, fontSize: 13.5 }}>
            <li>
              {t(
                "「저널의 열 구성이 맞나」 → 두 열이 더 필요했다. **인용한 증거**(어떤 뉴스를 근거로 삼았나 — 삭제된 항목도 「삭제됨」으로 남는다)와 **그 시점의 남은 예산**. 두 번째는 나중에 계산하지 않고 찍어 둔다 — 위임이 바뀌어도 그때 무엇을 보고 판단했는지가 남아야 한다.",
                "“Are these the right columns?” → two more were needed. **The evidence cited** (which news items backed the estimate — a deleted one still shows as “deleted”), and **the budget as it stood at that moment**, stamped rather than recomputed: the mandate can change, but what the agent was looking at when it decided must not.",
              )}
            </li>
            <li>
              {t(
                "「신호를 무엇으로 할까」 → 가격이 아니라 **뉴스**다. 가격 방아쇠는 에이전트를 규칙 실행기로 만든다. 뉴스를 읽고 확률을 스스로 추정하게 하면 판단이 실제로 판단이 되고, 그 판단을 살아 있는 호가라는 **독립된 기준**과 겨룰 수 있다.",
                "“What should the signal be?” → **news**, not a price. A price trigger makes the agent a rule-executor. Reading news and forming its own probability makes the judgement real — and gives it an independent yardstick to be wrong against: the live order book.",
              )}
            </li>
            <li>
              {t(
                "「방문자가 어디까지 조작하나」 → 방문자는 읽고, 소유자는 조작한다. 조작판은 anvil 과 verex 가 도는 기계에서만 열리므로 갈림길이 저절로 정해졌다.",
                "“How much should a visitor drive?” → visitors read, the owner drives. The console needs a running anvil and verex, so the split decided itself.",
              )}
            </li>
            <li>
              {t(
                "「만료 상태를 어떻게 보여줄까」 → 저널이 거부로 채워지는 것이 **맞다.** 다만 DB 의 시각만 보고 「체인이 거절했다」고 적으면 거짓말이므로, 틱이 실제로 체인에 물어보고(가스 0 시뮬레이션) enforcer 가 낸 문장을 그대로 적는다.",
                "“How do we keep the expiry visible?” → a journal filling with refusals **is** the point. But reading the DB's timestamp and writing “the chain refused” would be a lie, so the tick actually asks the chain — a zero-gas simulation — and records the enforcer's own words.",
              )}
            </li>
          </ul>
          <p className="sub" style={{ marginTop: 8, fontSize: 13 }}>
            {t(
              "가스·키 보관·스케줄러 호스트·저널 저장소 결정은 docs/features/README.md 의 백로그 B1 에 D1–D5 로 있고, 지금 도는 구조는 docs/features/autonomous-trading-agent.md 에 있다.",
              "The gas, key-custody, scheduler-host, and journal-storage decisions live in docs/features/README.md, backlog item B1, as D1–D5; the architecture as it now runs is in docs/features/autonomous-trading-agent.md.",
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
