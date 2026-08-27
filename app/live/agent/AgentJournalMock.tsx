"use client";

// 자율 결제 에이전트 — 논의용 목업 (jay 요청, 2026-08-06).
// 설계: docs/tasks/current-plan.md · 실제 시스템: docs/features/autonomous-trading-agent.md
//
// 여기엔 체인도, 지갑도, 서버 틱도 없다. 전부 아래 SCRIPT 배열에 손으로 적은 값이다.
// 목적은 "동작한다"를 보여주는 게 아니라, 실제 페이지가 어떤 모양이어야 하는지를
// 눈앞에 두고 이야기하기 위함이다 — 저널의 열 구성, 스킵을 어떻게 보여줄지,
// 만료 이후 화면이 어떻게 되는지. 값이 마음에 안 들면 SCRIPT만 고치면 된다.
//
// **2026-08-27 전면 개작 (jay).** 이전 각본은 "ETH 가격이 2% 움직이면 세션 키로
// 2.50 USDC 를 지출한다"는 **결제** 이야기였다 — verex 연동 이전, Chainlink 가격
// 신호 설계의 잔존물이다. 그 사이 실제 에이전트는 **뉴스 → LLM 추정 → 결정론적
// 규칙 → verex CTF 주문**으로 바뀌었고, 목업만 옛 이야기를 하고 있었다. 방문자가
// 이 페이지를 읽고 조작판을 열면 서로 다른 두 에이전트를 보게 되는 상태였다.
//
// 이제 둘은 같은 이야기를 한다. 열 구성과 판정 이름은 조작판의 JournalPanel 과
// 일치시켰다 — 이 표는 다른 설계가 아니라 그것의 축소판이어야 한다.

import { useState } from "react";
import { useLang } from "../../LangContext";
import { pick } from "@/lib/i18n";

// 목업 마켓 — verex 가 실제로 seed 하는 슬러그를 쓴다. 지어낸 마켓을 쓰면
// 조작판에서 같은 것을 찾을 수 없어 삽화와 실물이 다시 갈라진다.
const MARKET = {
  slug: "eth-above-10k-2026",
  question: "Will ETH close above $10,000 in 2026?",
  questionKo: "ETH가 2026년에 $10,000 위에서 마감할까?",
  outcome: "Yes",
};

const MANDATE = {
  cap: 10.0, // USDC 총 한도
  deadline: "16:00", // 만료 (블록 시간 기준)
  owner: "0xA1b2…9F3d",
  agent: "0x7C4e…21aB",
  edgeThreshold: 0.05, // |p − 체결가| 최소 edge. 퍼센트포인트가 아니라 확률 단위
};

type Verdict =
  | "TRADED"
  | "SKIP_NO_ESTIMATE"
  | "SKIP_EDGE"
  | "SKIP_COOLDOWN"
  | "SKIP_BUDGET"
  | "SKIP_EXHAUSTED"
  | "SKIP_EXPIRED";

type Tick = {
  time: string;
  /// 체결되는 쪽 가격(BUY 면 ask). null = 호가를 보기 전에 걸린 틱.
  ask: number | null;
  /// LLM 의 확률 추정. null = 추정 자체를 부르지 않은 틱.
  p: number | null;
  verdict: Verdict;
  /// 이 추정이 인용한 헤드라인. 저널 행이 증거를 들고 다닌다는 점이 요지다.
  cited?: string;
  citedKo?: string;
  note: string;
  noteKo: string;
  spent?: number;
  tx?: string;
};

// 각본은 **일곱 판정을 전부** 지나간다. 카탈로그처럼 보이는 것을 감수한 이유:
// 계획서가 내세우는 주장이 "거절 사유 여섯 갈래가 서로 구별돼야 한다"이고,
// 하나로 뭉개지면 데모의 주장 자체가 사라지기 때문이다. 끝의 두 줄이 본체다.
const SCRIPT: Tick[] = [
  {
    time: "09:00",
    ask: 0.45,
    p: null,
    verdict: "SKIP_NO_ESTIMATE",
    note: "No stored news for this market — the model was not called at all. A pure prior is frozen at the training cutoff and competes with a live book; the book wins by construction.",
    noteKo: "이 마켓에 저장된 뉴스가 없음 — 모델을 아예 부르지 않았다. 순수 사전확률은 학습 시점에 얼어붙어 있고 살아 있는 호가와 겨루면 구조적으로 진다.",
  },
  {
    time: "09:30",
    ask: 0.45,
    p: 0.42,
    verdict: "SKIP_EDGE",
    cited: "The CLARITY Act has not been approved by the Senate before recess",
    citedKo: "CLARITY 법안, 휴회 전 상원 통과 무산",
    note: "book 0.45, model 0.42, edge 0.03 < 0.05 — a real signal whose link to this market is indirect. Regulatory delay slows institutional allocation; it does not change ETH's supply today.",
    noteKo: "호가 0.45, 모델 0.42, edge 0.03 < 0.05 — 실재하는 신호지만 이 마켓과의 연결이 간접적이다. 규제 지연은 기관 자금 배분을 늦출 뿐, 오늘의 ETH 수급을 바꾸지 않는다.",
  },
  {
    time: "10:00",
    ask: 0.45,
    p: 0.58,
    verdict: "TRADED",
    cited: "Spot ETH ETFs post record $1.2B weekly inflow",
    citedKo: "현물 ETH ETF, 주간 12억 달러 사상 최대 순유입",
    note: "book 0.45, model 0.58, edge 0.13 ≥ 0.05 → BUY 2.50 USDC of Yes. Signed with the agent's own key; verex's operator sent the match.",
    noteKo: "호가 0.45, 모델 0.58, edge 0.13 ≥ 0.05 → Yes 2.50 USDC 매수. 에이전트 자기 키로 서명했고, 체결 트랜잭션은 verex operator 가 보냈다.",
    spent: 2.5,
    tx: "0x9f31…c40e",
  },
  {
    time: "10:05",
    ask: null,
    p: null,
    verdict: "SKIP_COOLDOWN",
    note: "cooldown 3,540s remaining → no action. This is the gate that makes calling the tick twice in a row safe.",
    noteKo: "쿨다운 3,540초 남음 → 행동 없음. 틱을 연달아 두 번 불러도 안전하게 만드는 검사가 이것이다.",
  },
  {
    time: "11:00",
    ask: 0.51,
    p: 0.62,
    verdict: "TRADED",
    cited: "Second ETF issuer files for staking-enabled ETH product",
    citedKo: "두 번째 ETF 발행사, 스테이킹 포함 ETH 상품 신청",
    note: "book 0.51, model 0.62, edge 0.11 ≥ 0.05 → BUY 2.50. The ask has moved up since the last buy — partly the agent's own fill.",
    noteKo: "호가 0.51, 모델 0.62, edge 0.11 ≥ 0.05 → 2.50 매수. 직전 매수 이후 호가가 올라와 있다 — 일부는 에이전트 자신의 체결 때문이다.",
    spent: 2.5,
    tx: "0x2ad7…8b11",
  },
  {
    time: "12:00",
    ask: 0.55,
    p: 0.71,
    verdict: "SKIP_BUDGET",
    cited: "Second ETF issuer files for staking-enabled ETH product",
    citedKo: "두 번째 ETF 발행사, 스테이킹 포함 ETH 상품 신청",
    note: "Size dial raised to 6.00, but only 5.00 USDC of the mandate remains → no action. The order is not shrunk to fit: shrinking would erase why this size was chosen.",
    noteKo: "주문 크기 손잡이를 6.00 으로 올렸지만 위임 잔액이 5.00 USDC 뿐 → 행동 없음. 맞춰서 줄이지 않는다 — 줄이면 왜 이 크기였는지가 저널에서 사라진다.",
  },
  {
    time: "13:00",
    ask: 0.56,
    p: 0.70,
    verdict: "TRADED",
    cited: "Spot ETH ETFs post record $1.2B weekly inflow",
    citedKo: "현물 ETH ETF, 주간 12억 달러 사상 최대 순유입",
    note: "Size dial back to 2.50. book 0.56, model 0.70, edge 0.14 ≥ 0.05 → BUY 2.50.",
    noteKo: "주문 크기를 2.50 으로 되돌림. 호가 0.56, 모델 0.70, edge 0.14 ≥ 0.05 → 2.50 매수.",
    spent: 2.5,
    tx: "0x5c08…a713",
  },
  {
    time: "14:00",
    ask: 0.59,
    p: 0.72,
    verdict: "TRADED",
    cited: "Spot ETH ETFs post record $1.2B weekly inflow",
    citedKo: "현물 ETH ETF, 주간 12억 달러 사상 최대 순유입",
    note: "book 0.59, model 0.72, edge 0.13 ≥ 0.05 → BUY 2.50. That is the mandate's last 2.50.",
    noteKo: "호가 0.59, 모델 0.72, edge 0.13 ≥ 0.05 → 2.50 매수. 위임의 마지막 2.50 이다.",
    spent: 2.5,
    tx: "0x7be2…4d90",
  },
  {
    time: "15:00",
    ask: null,
    p: null,
    verdict: "SKIP_EXHAUSTED",
    note: "budget fully drawn (10.00 / 10.00 USDC) → no action. Note this is not the same event as expiry, and it does not look like it either.",
    noteKo: "예산 전액 인출됨 (10.00 / 10.00 USDC) → 행동 없음. 만료와 같은 사건이 아니고, 화면에서도 같아 보이지 않는다.",
  },
  {
    time: "16:05",
    ask: null,
    p: null,
    verdict: "SKIP_EXPIRED",
    note: "The rule said act. TimestampEnforcer:expired-delegation — block time is past 16:00. The tick asks the chain rather than reading its own database and asserting.",
    noteKo: "규칙은 행동하라고 했다. TimestampEnforcer:expired-delegation — 블록 시간이 16:00 을 지났다. 틱은 자기 DB 를 읽고 단정하는 대신 체인에 물어본다.",
  },
  {
    time: "16:10",
    ask: null,
    p: null,
    verdict: "SKIP_EXPIRED",
    note: "Same code, same key, same rejection. Nothing was revoked — the window simply closed.",
    noteKo: "같은 코드, 같은 키, 같은 거부. 취소한 것은 없다 — 창이 닫혔을 뿐.",
  },
];

// 조작판의 JournalPanel 과 같은 색이어야 한다 — 두 화면에서 같은 판정이 다른
// 색이면 축소판이라는 말이 거짓이 된다.
const VERDICT_STYLE: Record<Verdict, { bg: string; fg: string }> = {
  TRADED: { bg: "#dcfce7", fg: "#166534" },
  SKIP_COOLDOWN: { bg: "#e0f2fe", fg: "#075985" },
  SKIP_EDGE: { bg: "#f1f5f9", fg: "#475569" },
  SKIP_BUDGET: { bg: "#fef3c7", fg: "#92400e" },
  SKIP_EXHAUSTED: { bg: "#ffedd5", fg: "#9a3412" },
  SKIP_EXPIRED: { bg: "#fee2e2", fg: "#991b1b" },
  SKIP_NO_ESTIMATE: { bg: "#ede9fe", fg: "#5b21b6" },
};

export default function AgentJournalMock() {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  // 1 = 첫 틱만 보인 상태. 0부터 시작하면 빈 표라 무엇을 볼지 알 수 없다.
  const [shown, setShown] = useState(1);

  const rows = SCRIPT.slice(0, shown);
  const spent = rows.reduce((sum, r) => sum + (r.spent ?? 0), 0);
  const remaining = MANDATE.cap - spent;
  const expired = rows.some((r) => r.verdict === "SKIP_EXPIRED");
  const done = shown >= SCRIPT.length;
  const skips = rows.filter((r) => r.verdict !== "TRADED").length;

  return (
    <>
      <div className="panel" style={{ marginTop: 24 }}>
        <strong>{t("위임 (한 번 부여하고 탭을 닫는다)", "The mandate (granted once, then you close the tab)")}</strong>
        <div className="kpis" style={{ marginTop: 12 }}>
          <div className="kpi">
            <div className="label">{t("남은 한도", "Budget left")}</div>
            <div className="value">
              {remaining.toFixed(2)} <span style={{ fontSize: 13, fontWeight: 400 }}>/ {MANDATE.cap.toFixed(2)} USDC</span>
            </div>
          </div>
          <div className="kpi">
            <div className="label">{t("만료 (블록 시간)", "Expiry (block time)")}</div>
            <div className="value" style={{ color: expired ? "#dc2626" : undefined }}>
              {MANDATE.deadline} {expired && t("— 지남", "— passed")}
            </div>
          </div>
          <div className="kpi">
            <div className="label">{t("edge 임계치", "Edge threshold")}</div>
            <div className="value">{MANDATE.edgeThreshold.toFixed(2)}</div>
          </div>
          <div className="kpi">
            <div className="label">{t("에이전트 주소", "Agent address")}</div>
            <div className="value" style={{ fontSize: 14, fontFamily: "ui-monospace, monospace" }}>
              {MANDATE.agent}
            </div>
          </div>
        </div>
        <p className="sub" style={{ marginTop: 12, fontSize: 13 }}>
          {t(
            `오너 ${MANDATE.owner}가 부여 — 최대 ${MANDATE.cap.toFixed(2)} USDC, ${MANDATE.deadline}까지. 한도와 기한 모두 에이전트 코드가 아니라 컨트랙트가 강제한다. 무엇을 살지는 강제하지 않는다 — **얼마나 가질 수 있는지**만 강제한다.`,
            `Granted by owner ${MANDATE.owner} — up to ${MANDATE.cap.toFixed(2)} USDC, until ${MANDATE.deadline}. Both bounds are enforced by contracts, not by the agent's own code. What it may buy is not bounded — **only how much it can ever hold**.`
          )}
        </p>
      </div>

      <div className="panel" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <strong>{t("결정 저널", "Decision journal")}</strong>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setShown((n) => n + 1)} disabled={done}>
              {done ? t("각본 끝", "End of script") : t("▶ 다음 틱", "▶ Next tick")}
            </button>
            <button type="button" onClick={() => setShown(1)}>
              {t("↺ 처음부터", "↺ Reset")}
            </button>
          </div>
        </div>
        <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
          {t(
            `마켓: “${MARKET.questionKo}” (${MARKET.slug}) — verex 가 실제로 seed 하는 마켓이다. 에이전트는 몇 분마다 깨어나 저장된 뉴스를 읽고, 모델이 확률 p 를 내놓고, 결정론적 규칙이 그 p 를 호가와 비교한다. 지출한 틱만이 아니라 지출하지 않기로 한 틱도 같은 무게로 남는다 — 그래야 판단이 판단으로 읽힌다.`,
            `Market: “${MARKET.question}” (${MARKET.slug}) — one verex actually seeds. The agent wakes every few minutes, reads the stored news, the model returns a probability p, and a deterministic rule compares that p to the book. Ticks where it declined to spend are recorded as carefully as ticks where it spent — that is what makes a decision legible as a decision.`
          )}
        </p>
        <p className="sub" style={{ marginTop: 8, fontSize: 13 }}>
          <strong>
            {t(
              `${rows.length}개 틱 중 ${skips}개가 아무것도 하지 않았다.`,
              `${skips} of ${rows.length} ticks did nothing.`
            )}
          </strong>
        </p>
        <table style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>{t("시각", "Time")}</th>
              <th>{t("호가 (Yes)", "Book (Yes)")}</th>
              <th>{t("모델 p", "Model p")}</th>
              <th>{t("edge", "Edge")}</th>
              <th>{t("판정", "Verdict")}</th>
              <th>{t("기록", "Note")}</th>
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().map((r) => {
              const st = VERDICT_STYLE[r.verdict];
              const edge = r.ask !== null && r.p !== null ? Math.abs(r.p - r.ask) : null;
              return (
                <tr key={r.time} style={{ verticalAlign: "top" }}>
                  <td style={{ fontFamily: "ui-monospace, monospace", whiteSpace: "nowrap" }}>{r.time}</td>
                  <td>{r.ask === null ? <span className="muted">—</span> : r.ask.toFixed(2)}</td>
                  <td>{r.p === null ? <span className="muted">—</span> : r.p.toFixed(2)}</td>
                  <td className={edge !== null && edge >= MANDATE.edgeThreshold ? "pos" : "muted"}>
                    {edge === null ? "—" : edge.toFixed(2)}
                  </td>
                  <td>
                    <span
                      style={{
                        background: st.bg,
                        color: st.fg,
                        borderRadius: 4,
                        padding: "2px 6px",
                        fontSize: 12,
                        fontFamily: "ui-monospace, monospace",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.verdict}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {pick(lang, r.noteKo, r.note)}
                    {r.cited && (
                      <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                        {t("인용: ", "Cited: ")}“{pick(lang, r.citedKo ?? r.cited, r.cited)}”
                      </div>
                    )}
                    {r.tx && (
                      <div className="muted" style={{ marginTop: 4, fontSize: 12, fontFamily: "ui-monospace, monospace" }}>
                        {r.tx}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {expired && (
          <p className="sub" style={{ marginTop: 12, fontSize: 13 }}>
            {t(
              "여기서부터가 이 데모의 본체다 — 스케줄러는 여전히 돌고 있고, 에이전트는 여전히 시도하며, 체인은 계속 거부한다. 아무도 아무것도 끄지 않았다.",
              "This is the part the demo exists for — the scheduler is still running, the agent is still trying, and the chain keeps saying no. Nobody turned anything off."
            )}
          </p>
        )}
      </div>
    </>
  );
}
