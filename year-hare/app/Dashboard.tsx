"use client";

import { useMemo, useState } from "react";
import {
  Holding,
  computeHolding,
  computeTotals,
  projectOneYear,
  symbolToId,
  fmtUSD,
  fmtPct,
} from "@/lib/coins";

// PoC 시작값 — 직접 입력으로 덮어쓰면 됨 (Excel 업로드는 후속 단계)
const SEED: Holding[] = [
  { symbol: "BTC", quantity: 0.25, avgBuyPrice: 42000, buyDate: "2024-01-15" },
  { symbol: "ETH", quantity: 3, avgBuyPrice: 2300, buyDate: "2024-03-01" },
];

const SCENARIOS = [
  { key: "bear", label: "보수 (Bear)", growth: -20 },
  { key: "base", label: "기본 (Base)", growth: 30 },
  { key: "bull", label: "낙관 (Bull)", growth: 100 },
];

export default function Dashboard() {
  const [holdings, setHoldings] = useState<Holding[]>(SEED);
  const [priceById, setPriceById] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  // 입력 폼 상태
  const [form, setForm] = useState<Holding>({
    symbol: "",
    quantity: 0,
    avgBuyPrice: 0,
    buyDate: "",
  });

  const rows = useMemo(
    () => holdings.map((h) => computeHolding(h, priceById)),
    [holdings, priceById]
  );
  const totals = useMemo(() => computeTotals(rows), [rows]);

  function addHolding() {
    if (!form.symbol || form.quantity <= 0 || form.avgBuyPrice <= 0) {
      setError("심볼·수량·평균 매수가를 올바르게 입력하세요.");
      return;
    }
    setError(null);
    setHoldings((prev) => [...prev, form]);
    setForm({ symbol: "", quantity: 0, avgBuyPrice: 0, buyDate: "" });
  }

  function removeHolding(i: number) {
    setHoldings((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function fetchPrices() {
    setLoading(true);
    setError(null);
    try {
      const ids = Array.from(
        new Set(holdings.map((h) => symbolToId(h.symbol)))
      ).join(",");
      if (!ids) {
        setError("먼저 보유 코인을 추가하세요.");
        return;
      }
      const res = await fetch(`/api/prices?ids=${encodeURIComponent(ids)}&vs=usd`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "시세 조회 실패");
      setPriceById(data);
      setFetchedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  }

  const hasPrices = Object.keys(priceById).length > 0;

  return (
    <main>
      <h1>🐇 year-hare</h1>
      <p className="sub">
        내 암호화폐 포트폴리오 — 현재 수익성과 1년 후 전망 (PoC · 수동 입력)
      </p>

      {/* 입력 */}
      <section className="panel">
        <h2>보유 코인 입력</h2>
        <div className="row-form">
          <div className="field">
            <label>심볼 (BTC)</label>
            <input
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              placeholder="BTC"
            />
          </div>
          <div className="field">
            <label>수량</label>
            <input
              type="number"
              value={form.quantity || ""}
              onChange={(e) =>
                setForm({ ...form, quantity: Number(e.target.value) })
              }
              placeholder="0.5"
            />
          </div>
          <div className="field">
            <label>평균 매수가 (USD)</label>
            <input
              type="number"
              value={form.avgBuyPrice || ""}
              onChange={(e) =>
                setForm({ ...form, avgBuyPrice: Number(e.target.value) })
              }
              placeholder="42000"
            />
          </div>
          <div className="field">
            <label>매수일 (선택)</label>
            <input
              type="date"
              value={form.buyDate}
              onChange={(e) => setForm({ ...form, buyDate: e.target.value })}
            />
          </div>
          <button onClick={addHolding}>+ 추가</button>
        </div>
        {error && <div className="err">{error}</div>}
        <p className="muted" style={{ marginTop: 10 }}>
          ※ Excel 업로드는 다음 단계. 지금은 직접 입력만 지원합니다.
        </p>
      </section>

      {/* 현재 수익성 */}
      <section className="panel">
        <h2>현재 수익성</h2>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <button onClick={fetchPrices} disabled={loading}>
            {loading ? "불러오는 중…" : "현재가 불러오기 (CoinGecko)"}
          </button>
          {fetchedAt && (
            <span className="muted" style={{ alignSelf: "center" }}>
              마지막 조회 {fetchedAt}
            </span>
          )}
        </div>

        <div className="kpis">
          <Kpi label="총 매수원가" value={fmtUSD(totals.cost)} />
          <Kpi label="현재 평가액" value={hasPrices ? fmtUSD(totals.value) : "—"} />
          <Kpi
            label="평가손익"
            value={hasPrices ? fmtUSD(totals.pnl) : "—"}
            tone={totals.pnl}
          />
          <Kpi
            label="수익률"
            value={hasPrices ? fmtPct(totals.pnlPct) : "—"}
            tone={totals.pnl}
          />
        </div>

        <table style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>코인</th>
              <th>수량</th>
              <th>매수가</th>
              <th>현재가</th>
              <th>평가액</th>
              <th>손익</th>
              <th>수익률</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.symbol.toUpperCase()}</td>
                <td>{r.quantity}</td>
                <td>{fmtUSD(r.avgBuyPrice)}</td>
                <td>{fmtUSD(r.currentPrice)}</td>
                <td>{fmtUSD(r.value)}</td>
                <td className={toneClass(r.pnl)}>{fmtUSD(r.pnl)}</td>
                <td className={toneClass(r.pnl)}>{fmtPct(r.pnlPct)}</td>
                <td>
                  <button className="trash" onClick={() => removeHolding(i)}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="muted" style={{ textAlign: "center" }}>
                  보유 코인을 추가하세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* 미래 전망 */}
      <section className="panel">
        <h2>1년 후 전망 (시나리오)</h2>
        {!hasPrices ? (
          <p className="muted">현재가를 먼저 불러오면 전망이 계산됩니다.</p>
        ) : (
          <div className="scenario-grid">
            {SCENARIOS.map((s) => {
              const projected = projectOneYear(totals.value, s.growth);
              const gain = projected - totals.value;
              return (
                <div className="kpi" key={s.key}>
                  <div className="label">
                    {s.label} · 연 {s.growth > 0 ? "+" : ""}
                    {s.growth}%
                  </div>
                  <div className="value">{fmtUSD(projected)}</div>
                  <div className={toneClass(gain)} style={{ fontSize: 13 }}>
                    {fmtUSD(gain)} ({fmtPct(s.growth)})
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="muted" style={{ marginTop: 12 }}>
          ※ 단순 가정에 따른 추정치이며 투자 조언이 아닙니다.
        </p>
      </section>
    </main>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: number | null;
}) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className={`value ${toneClass(tone)}`}>{value}</div>
    </div>
  );
}

function toneClass(n?: number | null): string {
  if (n === undefined || n === null || n === 0) return "";
  return n > 0 ? "pos" : "neg";
}
