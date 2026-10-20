"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "../LangContext";
import { pick } from "@/lib/i18n";

type Quote = {
  key: string;
  name: string;
  nameEn?: string;
  price: number;
  changePct?: number; // 못 구하면 없다 — 0% 로 꾸미지 않는다
  currency: string;
  publishTime?: number;
  stale?: boolean;
  source?: "pyth" | "yahoo";
  symbol?: string;
};

const REFRESH_MS = 60_000;

// only: 보여 줄 카드 키 목록. 없으면 /api/indices 가 주는 전부.
// /summary 는 원래의 네 장만 쓰고, /market 이 전체 보드를 쓴다 — 한 요약 화면이
// 갑자기 열 장으로 늘어나지 않게 하려는 것.
export default function IndexCards({ only }: { only?: string[] } = {}) {
  const { lang } = useLang();
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<Record<string, "pos" | "neg">>({});
  const prevPrices = useRef<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/indices");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!alive) return;

        const ticked: Record<string, "pos" | "neg"> = {};
        for (const q of data.quotes as Quote[]) {
          const prev = prevPrices.current[q.key];
          if (prev !== undefined && q.price !== prev) {
            ticked[q.key] = q.price > prev ? "pos" : "neg";
          }
          prevPrices.current[q.key] = q.price;
        }

        const all = data.quotes as Quote[];
        setQuotes(only ? all.filter((q) => only.includes(q.key)) : all);
        setError(data.errors?.length ? data.errors.join(" / ") : null);
        if (Object.keys(ticked).length) {
          setFlash(ticked);
          setTimeout(() => alive && setFlash({}), 900);
        }
      } catch (e) {
        if (alive) setError(String(e));
      }
    }
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [only?.join(",")]);

  if (!quotes) {
    return <p className={error ? "err" : "muted"}>{error ?? pick(lang, "불러오는 중…", "Loading…")}</p>;
  }

  return (
    <>
      <div className="kpis">
        {quotes.map((q) => {
          const has = typeof q.changePct === "number";
          const dir = !has ? "flat" : q.changePct! >= 0 ? "pos" : "neg";
          const flashClass = flash[q.key] ? `kpi-flash-${flash[q.key]}` : "";
          const label = lang === "en" ? (q.nameEn ?? q.name) : q.name;
          // 소수점: 원화 지수·종목은 정수까지, 달러는 둘째 자리까지가 읽기 편하다.
          const digits = q.currency === "KRW" ? 0 : 2;
          return (
            <div
              className={`kpi kpi-${dir} ${flashClass}`}
              key={q.key}
              style={q.stale ? { opacity: 0.55 } : undefined}
              title={[q.symbol, q.source ? `source: ${q.source}` : null].filter(Boolean).join(" · ")}
            >
              <div className="label">{label}</div>
              <div className="value">
                {q.price.toLocaleString(undefined, { maximumFractionDigits: digits })}
                <span className="muted" style={{ fontSize: 12, marginLeft: 5 }}>
                  {q.currency}
                </span>
              </div>
              {has ? (
                <div className={`kpi-chip ${dir}`}>
                  {dir === "pos" ? "▲" : "▼"} {Math.abs(q.changePct!).toFixed(2)}%
                </div>
              ) : (
                // 24h 전 가격을 못 받았다 — 0.00% 로 보여 주면 "안 움직였다"는 거짓말이 된다.
                <div className="kpi-chip muted" title={pick(lang, "24시간 전 가격 없음", "no 24h reference")}>
                  —
                </div>
              )}
              {q.publishTime ? (
                <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                  {q.stale ? pick(lang, "장 마감 · ", "closed · ") : ""}
                  {new Date(q.publishTime * 1000).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {error && <p className="err">{error}</p>}
    </>
  );
}
