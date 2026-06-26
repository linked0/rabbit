"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fmtKRW,
  fmtNum,
  fmtPct,
  type Position,
  type PortfolioTotals,
  type Side,
  type TradeRow,
} from "@/lib/portfolio";

type PortfolioResp = {
  positions: Position[];
  totals: PortfolioTotals;
  fetchedAt: string;
};

export default function InvestClient() {
  const [portfolio, setPortfolio] = useState<PortfolioResp | null>(null);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 거래 추가 폼 (Transactions History) — 평균단가 계산을 위해 단가(price) 포함
  const [side, setSide] = useState<Side>("BUY");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, tRes] = await Promise.all([
        fetch("/api/portfolio"),
        fetch("/api/trades"),
      ]);
      const p = await pRes.json();
      const t = await tRes.json();
      if (!pRes.ok) throw new Error(p?.error ?? "포트폴리오 조회 실패");
      if (!tRes.ok) throw new Error(t?.error ?? "거래 조회 실패");
      setPortfolio(p);
      setTrades(t);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function addTrade() {
    const q = Number(quantity);
    const pr = Number(price);
    if (!symbol.trim() || !Number.isFinite(q) || q <= 0 || !Number.isFinite(pr) || pr < 0) {
      setError("심볼·수량·단가(KRW)를 올바르게 입력하세요.");
      return;
    }
    setError(null);
    const res = await fetch("/api/trades", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ side, symbol, quantity: q, price: pr, assetType: "CRYPTO" }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d?.error ?? "거래 추가 실패");
      return;
    }
    setSymbol("");
    setQuantity("");
    setPrice("");
    await reload(); // 거래 추가 → Current Portfolio 자동 갱신
  }

  async function removeTrade(id: string) {
    await fetch(`/api/trades/${id}`, { method: "DELETE" });
    await reload();
  }

  const totals = portfolio?.totals;

  return (
    <main>
      <h1>🐇 투자 입력 · Current Portfolio</h1>
      <p className="sub">거래를 입력하면 포트폴리오가 자동 갱신됩니다 — KRW 기준 · 현재가 Upbit</p>

      {error && <div className="err">{error}</div>}

      {/* Current Portfolio */}
      <section className="panel">
        <h2>Current Portfolio</h2>
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Amount</th>
              <th>Average Cost</th>
              <th>Market Value</th>
              <th>손익</th>
              <th>수익률</th>
            </tr>
          </thead>
          <tbody>
            {(portfolio?.positions ?? []).map((p) => (
              <tr key={p.symbol}>
                <td>{p.symbol}</td>
                <td>{fmtNum(p.quantity)}</td>
                <td>{p.symbol === "KRW" ? "1" : fmtKRW(p.avgCost)}</td>
                <td>{fmtKRW(p.marketValue)}</td>
                <td className={toneClass(p.pnl)}>{fmtKRW(p.pnl)}</td>
                <td className={toneClass(p.pnl)}>{fmtPct(p.pnlPct)}</td>
              </tr>
            ))}
            {(!portfolio || portfolio.positions.length === 0) && (
              <tr>
                <td colSpan={6} className="muted" style={{ textAlign: "center" }}>
                  {loading ? "불러오는 중…" : "아래에서 거래를 추가하세요."}
                </td>
              </tr>
            )}
          </tbody>
          {totals && portfolio!.positions.length > 0 && (
            <tfoot>
              <tr>
                <td>합계</td>
                <td></td>
                <td>{fmtKRW(totals.cost)}</td>
                <td>{fmtKRW(totals.marketValue)}</td>
                <td className={toneClass(totals.pnl)}>{fmtKRW(totals.pnl)}</td>
                <td className={toneClass(totals.pnl)}>{fmtPct(totals.pnlPct)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </section>

      {/* Transactions History */}
      <section className="panel">
        <h2>Transactions History</h2>

        <div className="row-form" style={{ gridTemplateColumns: "auto 1.2fr 1fr 1.2fr auto" }}>
          <div className="field">
            <label>구분</label>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                type="button"
                className={side === "BUY" ? "" : "ghost"}
                onClick={() => setSide("BUY")}
              >
                Buy
              </button>
              <button
                type="button"
                className={side === "SELL" ? "" : "ghost"}
                onClick={() => setSide("SELL")}
              >
                Sell
              </button>
            </div>
          </div>
          <div className="field">
            <label>Token Name</label>
            <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="BTC" />
          </div>
          <div className="field">
            <label>Token Amount</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.5"
            />
          </div>
          <div className="field">
            <label>단가 (KRW)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="95000000"
            />
          </div>
          <button type="button" onClick={addTrade}>
            + Add
          </button>
        </div>

        <table style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>구분</th>
              <th>Token</th>
              <th>Amount</th>
              <th>단가 (KRW)</th>
              <th>일시</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id}>
                <td className={t.side === "BUY" ? "pos" : "neg"}>
                  {t.side === "BUY" ? "Buy" : "Sell"}
                </td>
                <td>{t.symbol}</td>
                <td>{fmtNum(t.quantity)}</td>
                <td>{fmtKRW(t.price)}</td>
                <td className="muted">{new Date(t.tradedAt).toLocaleString("ko-KR")}</td>
                <td>
                  <button className="trash" type="button" onClick={() => removeTrade(t.id)}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {trades.length === 0 && (
              <tr>
                <td colSpan={6} className="muted" style={{ textAlign: "center" }}>
                  {loading ? "불러오는 중…" : "거래 내역이 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="muted" style={{ marginTop: 10 }}>
          ※ 와이어프레임 대비 <b>단가(KRW)</b> 입력을 추가했습니다 — 평균 매수가/평가손익 계산에 필요. UI는 이후 리파인 가능.
        </p>
      </section>
    </main>
  );
}

function toneClass(n?: number | null): string {
  if (n === undefined || n === null || n === 0) return "";
  return n > 0 ? "pos" : "neg";
}
