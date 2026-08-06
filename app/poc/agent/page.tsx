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
              "가스·키 보관·스케줄러 호스트·저널 저장소 결정은 docs/tasks/current-plan.md의 D1–D5에 있다.",
              "The gas, key-custody, scheduler-host, and journal-storage decisions live in docs/tasks/current-plan.md as D1–D5."
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
