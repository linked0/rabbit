"use client";

// J2 / R-E — 저널.
//
// **skip 이 핵심이다.** 거래만 보여주는 저널은 능력을 보여주고, 대부분의 행이
// "edge 0.02 < 0.05 → 행동 없음"인 저널은 판단이 판단임을 보여준다. 체인만으로는
// 재구성할 수 없는 것이 정확히 이것 — 하지 않은 일은 체인에 없다.
//
// 그래서 여섯 가지 거절은 **서로 다른 색과 이름**을 갖는다. 특히
// SKIP_EXHAUSTED(예산 소진)와 SKIP_EXPIRED(만료)는 다른 경계가 작동한 것이라
// 같은 모양으로 렌더링되면 데모의 주장이 지워진다.
import { useCallback, useEffect, useState } from "react";
import { useLang } from "../../../LangContext";
import { pick } from "@/lib/i18n";
import { fetchJson } from "./fetchJson";

type Cited = { id: string; headline: string | null; source: string | null; missing: boolean };
type Tick = {
  id: string;
  createdAt: string;
  marketSlug: string;
  outcome: string;
  bestBid: string | null;
  bestAsk: string | null;
  p: string | null;
  rationale: string | null;
  verdict: string;
  reason: string;
  spentJusd: string;
  budgetLeftJusd: string | null;
  cited: Cited[];
};

const VERDICT_STYLE: Record<string, { bg: string; fg: string }> = {
  TRADED: { bg: "#dcfce7", fg: "#166534" },
  SKIP_COOLDOWN: { bg: "#e0f2fe", fg: "#075985" },
  SKIP_EDGE: { bg: "#f1f5f9", fg: "#475569" },
  SKIP_BUDGET: { bg: "#fef3c7", fg: "#92400e" },
  SKIP_EXHAUSTED: { bg: "#ffedd5", fg: "#9a3412" },
  SKIP_EXPIRED: { bg: "#fee2e2", fg: "#991b1b" },
  SKIP_NO_ESTIMATE: { bg: "#ede9fe", fg: "#5b21b6" },
};

// 수동 "틱 한 번 실행" 버튼은 제거됐다 (jay, 2026-09-02) — 틱을 부르는 것은 이제
// 스케줄러(R-F)뿐이다. 저널은 읽기 전용 관측 창이 된다.
export default function JournalPanel({
  refreshKey,
}: {
  refreshKey: number;
}) {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(async () => {
    // 읽기 실패도 화면에 남긴다. 이 catch 가 없으면 처리되지 않은 rejection 이
    // 되어 브라우저 콘솔에만 뜨고, 페이지는 빈 저널을 정상인 척 보여준다.
    try {
      const r = await fetchJson<{ error?: string; ticks: Tick[] }>("/api/agent/tick");
      if (r.error) return setErr(r.error);
      setTicks(r.ticks);
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  const skips = ticks.filter((x) => x.verdict !== "TRADED").length;

  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <strong>{t("3 · 저널 (R-E)", "3 · Journal (R-E)")}</strong>
        <span className="sub" style={{ fontSize: 13 }}>
          {t(
            `${ticks.length}건 중 ${skips}건이 행동하지 않음`,
            `${skips} of ${ticks.length} ticks did nothing`,
          )}
        </span>
      </div>
      <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
        {t(
          "틱은 스케줄러가 부릅니다. 짧은 간격으로 돌리면 연속 실행은 SKIP_COOLDOWN 이어야 합니다 — 그것이 「두 번 불러도 안전」의 증거입니다.",
          "Ticks come from the scheduler. Run it on a short interval and consecutive runs must read SKIP_COOLDOWN — that is the evidence for “calling it twice is safe”.",
        )}
      </p>

      {err && <p className="err" style={{ marginTop: 10 }}>{err}</p>}

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        {/* tableLayout fixed + 비율 폭 (jay, 2026-09-02). 거절 사유에는 revert 데이터의
            끊기지 않는 16진수 덩어리가 실려 오는데, auto 레이아웃은 그 한 칸에 맞춰
            표 전체를 넓힌다. 폭을 고정하고 산문 칸은 아무 데서나 줄바꿈하게 한다. */}
        <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ padding: "6px 8px", width: "8%" }}>{t("시각", "Time")}</th>
              <th style={{ padding: "6px 8px", width: "13%" }}>{t("판정", "Verdict")}</th>
              <th style={{ padding: "6px 8px", width: "12%" }}>{t("관측 / 모델", "Book / model")}</th>
              <th style={{ padding: "6px 8px", width: "35%" }}>{t("이유", "Reason")}</th>
              <th style={{ padding: "6px 8px", width: "22%" }}>{t("인용한 증거", "Evidence cited")}</th>
              <th style={{ padding: "6px 8px", width: "10%", textAlign: "right" }}>{t("예산", "Budget")}</th>
            </tr>
          </thead>
          <tbody>
            {ticks.map((x) => {
              const st = VERDICT_STYLE[x.verdict] ?? { bg: "#f1f5f9", fg: "#475569" };
              return (
                <tr key={x.id} style={{ borderTop: "1px solid #e2e8f0", verticalAlign: "top" }}>
                  <td style={{ padding: "6px 8px", fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
                    {new Date(x.createdAt).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <span
                      className="poc-badge"
                      style={{ background: st.bg, color: st.fg, display: "inline-block" }}
                    >
                      {x.verdict}
                    </span>
                  </td>
                  <td style={{ padding: "6px 8px", fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
                    {x.bestBid ?? "—"} / {x.bestAsk ?? "—"}
                    {x.p !== null && <> → {Number(x.p).toFixed(2)}</>}
                  </td>
                  <td style={{ padding: "6px 8px", overflowWrap: "anywhere" }}>
                    {x.reason}
                    {x.rationale && <div className="sub" style={{ fontSize: 12 }}>{x.rationale}</div>}
                  </td>
                  <td style={{ padding: "6px 8px", overflowWrap: "anywhere" }}>
                    {x.cited.length === 0 ? (
                      <span className="sub">—</span>
                    ) : (
                      x.cited.map((c) => (
                        <div key={c.id} className="sub" style={{ fontSize: 12 }}>
                          {/* 삭제된 증거는 조용히 빠지지 않는다 — 그 사실이 기록이다. */}
                          {c.missing ? (
                            <em style={{ color: "#b45309" }}>{t("삭제된 항목", "deleted item")} {c.id.slice(0, 6)}</em>
                          ) : (
                            <>
                              {c.headline}
                              {c.source && <> · {c.source}</>}
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
                    {Number(x.spentJusd) > 0 && <>−{Number(x.spentJusd).toFixed(2)} · </>}
                    {x.budgetLeftJusd === null ? "—" : Number(x.budgetLeftJusd).toFixed(2)}
                  </td>
                </tr>
              );
            })}
            {ticks.length === 0 && (
              <tr>
                <td colSpan={6} className="sub" style={{ padding: "10px 8px" }}>
                  {t("아직 틱이 없습니다.", "No ticks yet.")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
