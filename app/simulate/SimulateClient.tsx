"use client";

import { useEffect, useMemo, useState } from "react";
import { fmtKRW, fmtPct, type PortfolioTotals } from "@/lib/portfolio";
import {
  DEFAULT_SCENARIOS,
  projectValue,
  projectDCA,
  type Scenario,
} from "@/lib/simulate";

export default function SimulateClient() {
  const [current, setCurrent] = useState<number | null>(null); // 현재 평가액 (KRW)
  const [error, setError] = useState<string | null>(null);

  const [years, setYears] = useState(3);
  const [monthly, setMonthly] = useState(0); // 매월 추가 매수 (DCA)
  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/portfolio");
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error ?? "포트폴리오 조회 실패");
        const totals = j.totals as PortfolioTotals;
        setCurrent(totals?.marketValue ?? 0);
      } catch (e) {
        setError(String(e instanceof Error ? e.message : e));
      }
    })();
  }, []);

  const rows = useMemo(() => {
    if (current === null) return [];
    const months = years * 12;
    return scenarios.map((s) => {
      const hold = projectValue(current, s.annualReturnPct, years);
      const dca = monthly > 0 ? projectDCA(current, monthly, s.annualReturnPct, months) : hold;
      const invested = current + monthly * months;
      return {
        ...s,
        hold,
        dca,
        gain: dca - invested, // DCA 포함 총 투입 대비 손익
        invested,
      };
    });
  }, [current, scenarios, years, monthly]);

  const maxVal = Math.max(1, ...rows.map((r) => r.dca));

  function setReturn(key: string, v: number) {
    setScenarios((prev) => prev.map((s) => (s.key === key ? { ...s, annualReturnPct: v } : s)));
  }

  return (
    <main>
      <h1>📈 투자 정책 시뮬레이션</h1>
      <p className="sub">
        현재 평가액 기준 {years}년 전방 추정 (시나리오별 연수익률 + 선택적 월 적립). v1 — 과거 백테스트는 후속.
      </p>

      {error && <div className="err">{error}</div>}

      <section className="panel">
        <h2>설정</h2>
        <div className="kpis" style={{ marginBottom: 14 }}>
          <Kpi label="현재 평가액 (포트폴리오)" value={current === null ? "…" : fmtKRW(current)} />
        </div>
        <div className="row-form" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="field">
            <label>기간 (년)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={years}
              onChange={(e) => setYears(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="field">
            <label>매월 추가 매수 (KRW, DCA)</label>
            <input
              type="number"
              min={0}
              value={monthly || ""}
              onChange={(e) => setMonthly(Math.max(0, Number(e.target.value) || 0))}
              placeholder="0"
            />
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>시나리오 결과</h2>
        <table>
          <thead>
            <tr>
              <th>시나리오</th>
              <th>연수익률 (%)</th>
              <th>{years}년 후 (Hold)</th>
              <th>{years}년 후 (DCA 포함)</th>
              <th>총 투입</th>
              <th>손익</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td>
                  <input
                    type="number"
                    value={r.annualReturnPct}
                    onChange={(e) => setReturn(r.key, Number(e.target.value))}
                    style={{ width: 80 }}
                  />
                </td>
                <td>{fmtKRW(r.hold)}</td>
                <td>{fmtKRW(r.dca)}</td>
                <td className="muted">{fmtKRW(r.invested)}</td>
                <td className={r.gain >= 0 ? "pos" : "neg"}>
                  {fmtKRW(r.gain)} ({fmtPct(r.invested > 0 ? (r.gain / r.invested) * 100 : 0)})
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="muted" style={{ textAlign: "center" }}>
                  {current === null ? "불러오는 중…" : "먼저 투자입력에서 거래를 추가하세요."}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 간단 막대 비교 (DCA 포함 기준) */}
        {rows.length > 0 && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map((r) => (
              <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 90, fontSize: 13 }} className="muted">
                  {r.label}
                </span>
                <div style={{ flex: 1, background: "#0e1116", borderRadius: 6, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(r.dca / maxVal) * 100}%`,
                      background: r.annualReturnPct >= 0 ? "var(--green)" : "var(--red)",
                      height: 22,
                    }}
                  />
                </div>
                <span style={{ width: 130, textAlign: "right", fontSize: 13 }}>{fmtKRW(r.dca)}</span>
              </div>
            ))}
          </div>
        )}
        <p className="muted" style={{ marginTop: 12 }}>
          ※ 단순 복리 가정에 따른 추정치이며 투자 조언이 아닙니다.
        </p>
      </section>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
