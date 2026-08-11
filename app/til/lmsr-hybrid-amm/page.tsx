import Nav from "../../Nav";
import BackLink from "../../BackLink";
import TechNotes from "../../TechNotes";
import { TIL_CARDS } from "@/lib/til-cards";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

const CARD = TIL_CARDS.find((c) => c.key === "lmsr-hybrid-amm")!;

// LMSR & 하이브리드 AMM 정독 노트 (jay 요청, 2026-08-06). /poc/dvt 와 같은 성격의 페이지 —
// 돌려보는 데모가 아니라 읽는 분석이라 지갑도 상태도 없다. 내용의 출처는 verex Phase A
// 마켓메이킹을 두고 나눈 대화이고, 두 갈래로 나뉜다: ① 스프레드를 누가 정하고 누가 내는가,
// ② 그 설계를 Polymarket은 왜 안 쓰는데 우리는 왜 써야 하는가.
// 인터랙티브 계산기(슬라이더)는 아직 — 카드의 howItWorks 에 계획으로 남겨둠.
export default function LmsrPage() {
  const lang = getLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);

  return (
    <>
      <Nav />
      <main>
        {/* TIL 허브가 /poc 로 흡수된 뒤(2026-08-11)에도 "← TIL"(→ /til → /poc 리다이렉트)로
            남아 있었다 — 존재하지 않는 메뉴를 가리키는 라벨. 기본값(← PoCs)으로 되돌린다. */}
        <BackLink lang={lang} />
        <h1>{t("LMSR과 하이브리드 AMM", "LMSR & the hybrid AMM")}</h1>
        <p className="sub">
          {t(
            "첫 유동성을 돈으로 사는 방법과, 그 값이 왜 미리 아는 숫자인가 — 그리고 이 설계에 유효기간이 있다는 것.",
            "How to buy the first liquidity, why its price is a number you know in advance — and why this design has an expiry date."
          )}
        </p>

        <section className="panel">
          <h2>{t("공식", "The formula")}</h2>
          <p className="sub">
            {t(
              "LMSR(로그 시장 스코어링 규칙)은 미결제 주식 벡터 q에 대해 하나의 비용 함수를 정의합니다:",
              "LMSR (Logarithmic Market Scoring Rule) defines a single cost function over the vector q of outstanding shares:"
            )}
          </p>
          <pre
            style={{
              marginTop: 8,
              padding: 12,
              overflowX: "auto",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontSize: 13.5,
            }}
          >{`C(q) = b · ln( Σᵢ e^(qᵢ / b) )

pᵢ(q) = e^(qᵢ/b) / Σⱼ e^(qⱼ/b)      →  Σ pᵢ = 1  ${t("(항상)", "(always)")}

${t("최악 손실", "worst-case loss")} = b · ln(n)      →  b=250, n=2  ⇒  ≈ 173 USDC`}</pre>
          <p className="sub" style={{ marginTop: 8, fontSize: 13.5 }}>
            {t(
              "여기서 중요한 건 세 번째 줄입니다. b·ln(n)은 리스크 추정치가 아니라 최댓값입니다 — 예산 항목에 적을 수 있는 숫자죠. b는 깊이와 슬리피지를 맞바꾸는 손잡이입니다: b가 크면 호가가 두꺼워지고 가격이 덜 밀리지만, 그만큼 최대 보조금도 커집니다.",
              "The third line is the one that matters. b·ln(n) is not a risk estimate — it is a maximum, a number you can put in a budget line. b is the knob that trades depth against slippage: a larger b means thicker quotes and less price impact, and a proportionally larger maximum subsidy."
            )}
          </p>
        </section>

        <section className="panel">
          <h2>{t("스프레드는 누가 정하고, 누가 지불하는가", "Who sets a spread, and who pays it")}</h2>
          <p className="sub">
            {t(
              "\"스프레드가 넓다\"는 사실 하나에 서로 다른 질문 셋이 섞여 있습니다. 나누면 혼란이 풀립니다.",
              "One fact — “the spread is wide” — hides three separate questions. Splitting them dissolves the confusion."
            )}
          </p>
          <table style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>{t("질문", "Question")}</th>
                <th>{t("답", "Answer")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t("스프레드는 왜 넓은가?", "Why is the spread wide?")}</td>
                <td>
                  {t(
                    "정보 거래자가 존재하기 때문 — 그 위험을 가격에 반영한 것",
                    "Informed traders exist — that risk is what's being priced"
                  )}
                </td>
              </tr>
              <tr>
                <td>{t("왜 경쟁이 좁히지 않는가?", "Why doesn't competition narrow it?")}</td>
                <td>{t("그 마켓에서 경쟁하는 메이커가 적기 때문", "Few makers competing on that market")}</td>
              </tr>
              <tr>
                <td>{t("그런데 왜 누군가는 그 값을 내는가?", "Why does anyone pay it?")}</td>
                <td>{t("무지한 거래자가 존재하기 때문", "Uninformed traders exist")}</td>
              </tr>
            </tbody>
          </table>
          <p style={{ marginTop: 14, fontSize: 16, fontWeight: 600 }}>
            {t(
              "스프레드는 정보 거래자 때문에 설정되고, 무지한 거래자에 의해 지불된다.",
              "A spread is set because of informed traders, and paid by uninformed ones."
            )}
          </p>
          <p className="sub" style={{ marginTop: 6, fontSize: 13.5 }}>
            {t(
              "두 사실이 같은 숫자 안에 함께 삽니다. 2센트에서 8센트로 벌리는 건 동시에 두 가지를 말합니다 — \"여러분 중 의미 있는 비율이 뭔가를 안다고 본다\", 그리고 \"모르는 사람이 충분히 많아서 이 값을 여전히 받을 수 있다\".",
              "Both facts live in the same number. Widening from 2¢ to 8¢ says two things at once: “I think a meaningful share of you know something,” and “enough of you don't that I can still charge this.”"
            )}
          </p>
        </section>

        <section className="panel">
          <h2>{t("정보 비율을 올리면 — 시장이 사라진다", "Push the informed share up — and the market stops existing")}</h2>
          <pre
            style={{
              marginTop: 4,
              padding: 12,
              overflowX: "auto",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontSize: 13.5,
            }}
          >{`${t("정보", "informed")}  5%  →  ${t("2센트 스프레드로 가능", "2¢ spread works")}
${t("정보", "informed")} 15%  →  ${t("8센트 스프레드로 가능", "8¢ spread works")}
${t("정보", "informed")} 40%  →  ${t("어떤 스프레드로도 불가능", "no spread works")}`}</pre>
          <p className="sub" style={{ marginTop: 10, fontSize: 13.5 }}>
            {t(
              "어느 지점부터는 정보 흐름을 견딜 만큼 넓은 스프레드가 너무 넓어서 무지한 거래자 누구도 지불하지 않습니다. 메이커의 유일한 합리적 선택은 호가를 접는 것입니다. 이것이 고전적인 시장 붕괴(market breakdown) 결과이고, 실제 시장에서 형편없는 호가 대신 아예 호가가 없는 상태를 보게 되는 이유이기도 합니다. 호가가 없는 시장은 고장난 시장이 아니라 올바르게 가격이 매겨진 시장입니다.",
              "At some point every spread wide enough to survive the informed flow is too wide for any uninformed trader to pay. The maker's only rational move is to stop quoting. That is the classic market-breakdown result, and it is why you sometimes see a real market with no quotes at all rather than terrible ones. A market with no quotes is not a broken market; it is a correctly priced one."
            )}
          </p>
          <p className="sub" style={{ marginTop: 10, fontSize: 13.5 }}>
            {t(
              "그래서 \"스프레드가 넓으니 정보 거래자가 적다\"는 아니고, 한 단계 강한 다음 문장이 맞습니다:",
              "So the claim is not “the spread is wide, therefore few informed traders.” It is a step stronger:"
            )}
          </p>
          <p style={{ marginTop: 6, fontSize: 15, fontWeight: 600 }}>
            {t(
              "시장이 존재한다는 것 자체가 — 스프레드가 얼마든 — 그것을 지탱할 무지한 흐름이 충분하다는 증거다.",
              "A market that exists at all — at any spread — proves there is enough uninformed flow to fund it."
            )}
          </p>
        </section>

        <section className="panel">
          <h2>{t("넓은 스프레드의 두 가지 해석", "Two readings of a wide spread")}</h2>
          <p className="sub">
            {t(
              "위와 무관한 두 번째 이유가 있습니다 — 경쟁. 열 명의 메이커가 한 마켓을 호가하면 서로 깎아 진짜 정보비용까지 내려갑니다. 한 명뿐이면 그 위로 받고 차액을 챙길 수 있습니다. 밖에서는 둘을 구별하기 어렵습니다.",
              "There is a second reason, independent of all the above: competition. If ten makers quote a market they undercut each other down to the true informed-flow cost. If one makes it, they can charge above that and keep the difference. From outside, the two are hard to tell apart."
            )}
          </p>
          <table style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>{t("해석", "Reading")}</th>
                <th>{t("뜻", "Meaning")}</th>
                <th>{t("신호", "Tell")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pos">{t("정직", "Honest")}</td>
                <td>{t("실제로 위험한 마켓, 올바르게 가격 매겨짐", "Genuinely risky market, correctly priced")}</td>
                <td>{t("넓은데 거래량이 많음", "Wide, with heavy volume")}</td>
              </tr>
              <tr>
                <td className="neg">{t("지대(rent)", "Rent")}</td>
                <td>{t("경쟁 없는 메이커 하나가 마음대로 받는 값", "One maker with no competition, charging what they like")}</td>
                <td>{t("넓은데 거래량이 얇음", "Wide, with thin volume")}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h2>{t("그럼 Polymarket은 왜 안 쓰는가", "So why doesn't Polymarket use it")}</h2>
          <p className="sub">
            {t(
              "먼저 프레임부터 바로잡아야 합니다: 하이브리드 AMM은 더 발전된 설계가 아닙니다. 정말 우월하다면 Polymarket이 안 쓴다는 사실 자체가 문제의 증거일 겁니다. 더 발전된 게 아니라 트레이드오프 위의 다른 지점이고, 그 거래는 특정 단계에서만 말이 됩니다.",
              "The framing has to be corrected first: the hybrid AMM is not a more advanced design. If it were strictly better, Polymarket's absence would be evidence that something is wrong with it. It is not more advanced — it is a different point on a trade-off, and the trade only makes sense at one particular stage."
            )}
          </p>
          <ol className="sub" style={{ marginTop: 12, paddingLeft: 20, fontSize: 13.5, lineHeight: 1.7 }}>
            <li>
              <strong>{t("그들에겐 그 문제가 없다.", "They don't have the problem.")}</strong>{" "}
              {t(
                "LMSR 호가는 콜드 스타트를 해결합니다. Polymarket은 유동성 있는 모든 마켓에 전문 마켓메이커가 경쟁합니다. 거기에 보조금 사다리를 얹는 건 이미 공짜로 얻는 유동성과 경쟁하려고 돈을 쓰는 일 — 이미 다른 방법으로 나은 병에 대한 치료제입니다.",
                "LMSR quoting solves cold start. Polymarket has professional market makers competing on every liquid market. Adding a subsidized ladder there means paying to compete against liquidity they already get for free — a cure for a disease they cured differently."
              )}
            </li>
            <li>
              <strong>{t("보조금은 상장 수에 비례한다.", "The subsidy scales with listings.")}</strong>{" "}
              {t(
                "b=250 이진 마켓 하나당 최악 ≈173 USDC. 10개면 괜찮고, 수천 개면 구조적 비용 센터입니다. 게다가 돌아오는 수수료가 아니라 손실입니다. 그들의 경제 구조는 수수료·리워드 기반이고 이건 보조금 기반이라, 규모가 커지면 잘 섞이지 않습니다.",
                "≈173 USDC worst case per binary market at b=250. Fine across 10 markets; across thousands it is a structural cost center — and it is a loss, not a fee that comes back. Their economics are fee- and rewards-based; this one is subsidy-based, and the two don't mix well at scale."
              )}
            </li>
            <li>
              <strong>{t("역선택 — 실제로 물어뜯는 문제.", "Adverse selection — the one that actually bites.")}</strong>{" "}
              {t(
                "LMSR에는 견해가 없습니다. 뉴스가 터져도 공식대로 계속 호가합니다. 사람 메이커는 정보 냄새를 맡으면 벌리거나 취소하지만, 사다리는 그냥 앉아서 털립니다. b·ln(n)이 총손실 상한이긴 하나 — 가장 크게 틀린 마켓에서 정확히 그 상한에 빠르게 도달합니다. 정교한 트레이더가 많은 거래소에서 오퍼레이터는 구조적으로 항상 마지막에 아는 사람입니다.",
                "An LMSR has no view. News breaks and it keeps quoting the formula. A human maker widens or cancels when it smells information; the ladder sits there and gets picked off. b·ln(n) does bound the loss — but you reach that bound precisely on the markets where you were most wrong, and you reach it fast. On a venue full of sophisticated traders, the operator is systematically the last to know."
              )}
            </li>
            <li>
              <strong>{t("상대방이 되는 것과 거래장소가 되는 것은 위치가 다르다.", "Being the counterparty is a different posture than being the venue.")}</strong>{" "}
              {t(
                "주문만 매칭하는 CLOB 운영자는 중립적 중개자입니다. 양방향 호가를 내고 재고를 지는 운영자는 마켓메이킹 — 대리인(agent)이 아니라 본인(principal)입니다. Polymarket의 규제 이력을 보면 구조적 중립성 유지는 실수가 아니라 의도로 보입니다. \"하우스가 자기 테이블에서 같이 플레이한다\"는 인상 문제도 있고요.",
                "A CLOB operator that only matches orders is a neutral facilitator. An operator that quotes both sides and carries inventory is making markets — principal, not agent. Given their regulatory history, staying structurally neutral looks deliberate rather than an oversight. There is also the plain optics of the house playing at its own table."
              )}
            </li>
          </ol>
          <p className="sub" style={{ marginTop: 12, fontSize: 13.5 }}>
            {t(
              "그리고 역사적 사실 하나: 그들은 이미 AMM(FPMM)을 운영했고 폐기했습니다. 진짜 메이커들이 들어온 뒤로는 오더북보다 스프레드도 자본 효율도 나빴기 때문입니다. 이 설계를 건너뛴 게 아니라 졸업한 겁니다.",
              "And the historical point: they already ran an AMM (an FPMM) and retired it. Once real makers showed up, it gave worse spreads and worse capital efficiency than the book. They did not skip this design — they graduated out of it."
            )}
          </p>
        </section>

        <section className="panel">
          <h2>{t("그럼에도 신규 거래소가 써야 하는 이유", "Why a new venue should use it anyway")}</h2>
          <p style={{ fontSize: 15, fontWeight: 600 }}>
            {t(
              "그들이 다른 방식으로 푼 그 문제가 우리에겐 있고, 그들의 해법은 우리가 쓸 수 없다.",
              "We have the problem they solved differently, and their solution isn't available to us."
            )}
          </p>
          <p className="sub" style={{ marginTop: 8, fontSize: 13.5 }}>
            {t(
              "빈 거래소에 마켓메이커를 데려올 수는 없습니다. 빈 호가창 → 가격 없음 → 트레이더 없음 → 거래량 없음 → 메이커가 올 이유 없음 → 빈 호가창. Polymarket은 이미 그 루프를 빠져나왔기 때문에 빠져나온 상태입니다. 신규 거래소는 첫 유동성을 스스로 사는 것 외에 방법이 없고, LMSR은 그걸 미리 아는 상한으로 해내는 가장 저렴한 알려진 방법입니다.",
              "You cannot recruit market makers to an empty venue. Empty book → no price → no traders → no volume → no reason for a maker to show up → empty book. Polymarket exits that loop by having already exited it. A new venue can only exit it by buying the first liquidity itself, and LMSR is the cheapest known way to do that with a bound known in advance."
            )}
          </p>
          <p className="sub" style={{ marginTop: 10, fontSize: 13.5 }}>
            {t(
              "위의 네 반론은 전부 규모(scale)에 관한 것이고, 초기 단계에서는 하나도 구속력이 없습니다:",
              "All four objections above are scale objections, and none of them binds at an early stage:"
            )}
          </p>
          <table style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>{t("그들의 반론", "Their objection")}</th>
                <th>{t("초기 단계에서 안 걸리는 이유", "Why it doesn't bind early")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t("진짜 메이커와 중복", "Redundant with real makers")}</td>
                <td>{t("한 명도 없음", "There are zero")}</td>
              </tr>
              <tr>
                <td>{t("상장 수에 비례하는 보조금", "Subsidy scales with listings")}</td>
                <td>{t("마켓 10개지 10,000개가 아님", "10 markets, not 10,000")}</td>
              </tr>
              <tr>
                <td>{t("역선택", "Adverse selection")}</td>
                <td>{t("정보 흐름은 거래량의 함수 — 둘 다 없음", "Informed flow is a function of volume; there is neither")}</td>
              </tr>
              <tr>
                <td>{t("본인 vs 거래장소 포지션", "Principal vs. venue posture")}</td>
                <td>{t("진짜 문제지만 출시 전이 아니라 제품화 이후의 문제", "Real, but a pre-product concern, not a pre-launch one")}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h2>{t("이 채택을 안전하게 만드는 설계 결정", "The design decision that makes it safe")}</h2>
          <p className="sub">
            {t(
              "정당한 수준을 넘어 안전하게 만드는 건, 이 단계가 제거를 전제로 만들어졌다는 점입니다. 풀 컨트랙트가 없습니다. LP 지분도 없습니다. 별도 거래장소도 없습니다. AMM이 시스템에 물리적으로 존재하는 형태는 같은 오더북 안의 평범한 지정가 주문뿐입니다. 그래서 끄는 방법은 — 그냥 게시를 멈추는 것. 마이그레이션 없음, LP 청산 없음, 폐기할 컨트랙트 없음, 자금이 묶이는 사용자 없음.",
              "What makes adopting it safe rather than merely justified is that this phase is built to be removed. There is no pool contract. No LP shares. No separate venue. The AMM's entire physical presence in the system is ordinary limit orders in the same book. So turning it off is: stop posting. No migration, no LP unwind, no deprecated contract, no user with stranded capital."
            )}
          </p>
          <p className="sub" style={{ marginTop: 10, fontSize: 13.5 }}>
            {t(
              "Polymarket이 자기 AMM을 떠나며 해야 했던 일과 비교해 보세요 — 실제 LP 자금이 든 라이브 컨트랙트를 폐기하고 전원을 이전시켜야 했습니다. 그들이 버린 아이디어인데도 이 버전이 옳은 이유가 그것입니다. 그들은 비계를 건물 안에 지어 넣었고, 이쪽은 바깥에 볼트로 붙였습니다.",
              "Compare what Polymarket had to do to leave their AMM — deprecate a live contract holding real LP money and migrate everyone off it. That is why this is the right version of an idea they abandoned. They built the scaffolding into the building; this bolts it to the outside."
            )}
          </p>
        </section>

        <section className="panel">
          <h2>{t("솔직한 실패 시나리오", "The honest failure mode")}</h2>
          <p className="sub">
            {t(
              "위험은 LMSR이 틀렸다는 게 아닙니다. 사다리가 영구화되는 것입니다 — 제3자 메이커가 끝내 오지 않고, 거래소는 영원히 하우스가 호가를 대는 곳으로 남아, 사용자는 계속 오퍼레이터를 상대로 거래하고 보조금은 무기한 나갑니다. 이건 버그가 아니라 사업 결과이고, 코드에서는 절대 보이지 않습니다.",
              "The risk isn't that LMSR is wrong. It's that the ladder becomes permanent — third-party makers never arrive, the venue stays a house-run book forever, users keep trading against the operator, and the subsidy keeps going out. That is a business outcome, not a bug, and it will never show up in the code."
            )}
          </p>
          <p className="sub" style={{ marginTop: 10, fontSize: 13.5 }}>
            {t(
              "그래서 명시적인 종료 조건이 필요합니다 — 예를 들어 제3자 메이커 체결 비중이 X%를 넘으면 그 마켓의 b를 낮추고, 오퍼레이터 비중이 일정 아래로 떨어지면 게시를 완전히 중단. 상수 b에 아무 정책도 붙어 있지 않다면, 그 공백 자체가 다음 단계 전에 짚어야 할 항목입니다.",
              "Which is why it needs an explicit exit criterion — say, when third-party makers account for more than X% of volume on a market, drop b there; below some threshold of operator share, stop posting entirely. If b is a constant with no policy attached to it, that gap is itself the thing to name before the next phase."
            )}
          </p>
        </section>

        <section className="panel">
          <h2>{t("한 줄 요약", "The one-line version")}</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7 }}>
            {t(
              "Polymarket은 이게 필요 없고, 그들 규모에서는 감당이 안 되며, 채택하면 포지션이 나빠진다. 신규 거래소는 필요하고, 그 규모에서는 감당되며, 필요 없어지는 날 버릴 수 있게 만들면 된다. 성공한다면 결국 Polymarket처럼 보여야 한다 — 사다리는 거기까지 가는 수단이지 도착지가 아니다.",
              "Polymarket doesn't need it, can't afford it at their scale, and would take on a worse posture by adopting it. A new venue needs it, can afford it at its own scale, and should build it so it can be dropped the day it isn't needed. If it succeeds, it should end up looking like Polymarket — the ladder is how it gets there, not what it becomes."
            )}
          </p>
        </section>

        <TechNotes cards={[CARD]} lang={lang} />
      </main>
    </>
  );
}
