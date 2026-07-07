"use client";

import { useEffect, useState } from "react";
import { useLang } from "../LangContext";
import { pick } from "@/lib/i18n";

type Level = { px: number; sz: number };
type Book = { coin: string; bids: Level[]; asks: Level[]; fetchedAt: string };

// REST 폴링 1차 (design §3 — WebSocket은 다음 단계). 기본 마켓 BTC 퍼프.
const REFRESH_MS = 5_000;
const DEPTH = 8;

// HL 가격은 유효숫자 최대 5자리 (BTC 63,614 / ETC 7.0283 모두 커버)
const px = (n: number) => n.toLocaleString(undefined, { maximumSignificantDigits: 5 });
const sz = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 4 });

export default function OrderBook({ coin = "BTC" }: { coin?: string }) {
  const { lang } = useLang();
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch(`/api/orderbook?coin=${coin}`);
        const data = await res.json();
        if (!alive) return;
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        setBook(data);
        setError(null);
      } catch (e) {
        if (alive) setError(String(e instanceof Error ? e.message : e));
      }
    }
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [coin]);

  if (!book) {
    return <p className={error ? "err" : "muted"}>{error ?? pick(lang, "불러오는 중…", "Loading…")}</p>;
  }

  const bestBid = book.bids[0]?.px;
  const bestAsk = book.asks[0]?.px;
  const spread = bestBid != null && bestAsk != null ? bestAsk - bestBid : null;
  const asks = book.asks.slice(0, DEPTH).reverse(); // 최우선 매도가 아래로 (스프레드에 붙게)

  return (
    <div className="panel">
      <h2>
        {coin} Perp — Hyperliquid{" "}
        <span className="muted" style={{ textTransform: "none", letterSpacing: 0 }}>
          {pick(lang, "(5초마다 갱신)", "(refreshes every 5s)")}
        </span>
      </h2>
      <table>
        <thead>
          <tr>
            <th>{pick(lang, "구분", "Side")}</th>
            <th>{pick(lang, "가격 (USD)", "Price (USD)")}</th>
            <th>{pick(lang, "수량", "Size")}</th>
          </tr>
        </thead>
        <tbody>
          {asks.map((l) => (
            <tr key={`a${l.px}`}>
              <td className="neg">{pick(lang, "매도", "Ask")}</td>
              <td className="neg">{px(l.px)}</td>
              <td>{sz(l.sz)}</td>
            </tr>
          ))}
          <tr>
            <td className="muted">{pick(lang, "스프레드", "Spread")}</td>
            <td className="muted">{spread != null ? px(spread) : "—"}</td>
            <td />
          </tr>
          {book.bids.slice(0, DEPTH).map((l) => (
            <tr key={`b${l.px}`}>
              <td className="pos">{pick(lang, "매수", "Bid")}</td>
              <td className="pos">{px(l.px)}</td>
              <td>{sz(l.sz)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p className="err">{error}</p>}
    </div>
  );
}
