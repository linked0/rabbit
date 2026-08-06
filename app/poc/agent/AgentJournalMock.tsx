"use client";

// 자율 결제 에이전트 — 논의용 목업 (jay 요청, 2026-08-06). 설계: docs/tasks/current-plan.md.
//
// 여기엔 체인도, 지갑도, 서버 틱도 없다. 전부 아래 SCRIPT 배열에 손으로 적은 값이다.
// 목적은 "동작한다"를 보여주는 게 아니라, 실제 페이지가 어떤 모양이어야 하는지를
// 눈앞에 두고 이야기하기 위함이다 — 저널의 열 구성, 스킵을 어떻게 보여줄지,
// 만료 이후 화면이 어떻게 되는지. 값이 마음에 안 들면 SCRIPT만 고치면 된다.

import { useState } from "react";
import { useLang } from "../../LangContext";
import { pick } from "@/lib/i18n";

// 목업 위임 조건 — 실제 구현에서는 ERC-7715 권한 부여로 들어간다.
const MANDATE = {
  cap: 10.0, // USDC 총 한도
  perAction: 2.5, // 1회 지출액
  deadline: "04:00", // 만료 (블록 시간 기준)
  owner: "0xA1b2…9F3d",
  agent: "0x7C4e…21aB",
  threshold: 2.0, // 행동 임계치 (%)
};

type Tick = {
  time: string;
  price: number; // 관측한 ETH/USD
  movePct: number; // 마지막 행동 대비 변동률
  outcome: "skip" | "paid" | "rejected";
  note: string;
  noteKo: string;
  tx?: string;
};

// 세 가지 상태를 순서대로 보여주는 각본 — ① 위임 내 무행동(대부분) ② 위임 내 행동
// ③ 만료 후 무해한 실패. ③이 이 데모의 본체라 각본이 거기서 끝나지 않고 두 틱 더 간다:
// "한 번 거부됐다"가 아니라 "계속 돌면서 계속 거부된다"가 보여야 하기 때문.
const SCRIPT: Tick[] = [
  {
    time: "03:00",
    price: 2412.3,
    movePct: 0.4,
    outcome: "skip",
    note: "0.4% move, below the 2% threshold — no action.",
    noteKo: "0.4% 변동, 2% 임계 미달 — 행동 없음.",
  },
  {
    time: "03:05",
    price: 2418.9,
    movePct: 0.7,
    outcome: "skip",
    note: "0.7% move — still below threshold.",
    noteKo: "0.7% 변동 — 여전히 임계 미달.",
  },
  {
    time: "03:10",
    price: 2455.4,
    movePct: 2.2,
    outcome: "paid",
    note: "2.2% ≥ 2% — spent 2.50 USDC through the session key.",
    noteKo: "2.2% ≥ 2% — 세션 키로 2.50 USDC 지출.",
    tx: "0x9f31…c40e",
  },
  {
    time: "03:15",
    price: 2451.1,
    movePct: 0.2,
    outcome: "skip",
    note: "0.2% from the new baseline — no action.",
    noteKo: "새 기준선 대비 0.2% — 행동 없음.",
  },
  {
    time: "03:20",
    price: 2502.6,
    movePct: 2.1,
    outcome: "paid",
    note: "2.1% ≥ 2% — spent 2.50 USDC. 5.00 USDC of the mandate left.",
    noteKo: "2.1% ≥ 2% — 2.50 USDC 지출. 위임 잔액 5.00 USDC.",
    tx: "0x2ad7…8b11",
  },
  {
    time: "04:05",
    price: 2571.4,
    movePct: 2.7,
    outcome: "rejected",
    note: "Rule said act. TimestampEnforcer rejected it — block time is past 04:00.",
    noteKo: "규칙은 행동하라고 했다. TimestampEnforcer가 거부 — 블록 시간이 04:00을 지남.",
  },
  {
    time: "04:10",
    price: 2588.0,
    movePct: 3.4,
    outcome: "rejected",
    note: "Same code, same rejection. Nothing was revoked — the window simply closed.",
    noteKo: "같은 코드, 같은 거부. 취소한 것은 없다 — 창이 닫혔을 뿐.",
  },
];

export default function AgentJournalMock() {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  // 1 = 첫 틱만 보인 상태. 0부터 시작하면 빈 표라 무엇을 볼지 알 수 없다.
  const [shown, setShown] = useState(1);

  const rows = SCRIPT.slice(0, shown);
  const spent = rows.filter((r) => r.outcome === "paid").length * MANDATE.perAction;
  const remaining = MANDATE.cap - spent;
  const expired = rows.some((r) => r.outcome === "rejected");
  const done = shown >= SCRIPT.length;

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
            <div className="label">{t("행동 임계치", "Act threshold")}</div>
            <div className="value">±{MANDATE.threshold}%</div>
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
            `오너 ${MANDATE.owner}가 부여 — 최대 ${MANDATE.cap.toFixed(2)} USDC, ${MANDATE.deadline}까지, 지정한 수취인에게만. 한도와 기한 모두 에이전트 코드가 아니라 컨트랙트가 강제한다.`,
            `Granted by owner ${MANDATE.owner} — up to ${MANDATE.cap.toFixed(2)} USDC, until ${MANDATE.deadline}, to one recipient. Both bounds are enforced by contracts, not by the agent's own code.`
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
            "에이전트가 몇 분마다 깨어나 남기는 기록. 지출한 틱만이 아니라 지출하지 않기로 한 틱도 같은 무게로 남는다 — 그래야 판단이 판단으로 읽힌다.",
            "What the agent leaves behind each time it wakes. Ticks where it declined to spend are recorded as carefully as ticks where it spent — that is what makes a decision legible as a decision."
          )}
        </p>
        <table style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>{t("시각", "Time")}</th>
              <th>{t("관측 (ETH/USD)", "Observed (ETH/USD)")}</th>
              <th>{t("규칙", "Rule")}</th>
              <th>{t("결과", "Outcome")}</th>
              <th>{t("기록", "Note")}</th>
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().map((r) => (
              <tr key={r.time}>
                <td style={{ fontFamily: "ui-monospace, monospace" }}>{r.time}</td>
                <td>{r.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className={r.movePct >= MANDATE.threshold ? "pos" : "muted"}>
                  {r.movePct >= MANDATE.threshold ? "≥" : "<"} {MANDATE.threshold}% ({r.movePct}%)
                </td>
                <td>
                  {r.outcome === "paid" && <span className="pos">{t("지출", "Paid")}</span>}
                  {r.outcome === "skip" && <span className="muted">{t("건너뜀", "Skipped")}</span>}
                  {r.outcome === "rejected" && <span className="neg">{t("거부됨", "Rejected")}</span>}
                </td>
                <td style={{ fontSize: 13 }}>
                  {pick(lang, r.noteKo, r.note)}
                  {r.tx && (
                    <>
                      {" "}
                      <span className="muted" style={{ fontFamily: "ui-monospace, monospace" }}>
                        {r.tx}
                      </span>
                    </>
                  )}
                </td>
              </tr>
            ))}
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
