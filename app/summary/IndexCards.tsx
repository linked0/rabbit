"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "../LangContext";
import { pick } from "@/lib/i18n";

type Quote = {
  key: string;
  name: string;
  price: number;
  changePct: number;
  currency: string;
};

const REFRESH_MS = 60_000;

export default function IndexCards() {
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

        setQuotes(data.quotes);
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
  }, []);

  if (!quotes) {
    return <p className={error ? "err" : "muted"}>{error ?? pick(lang, "불러오는 중…", "Loading…")}</p>;
  }

  return (
    <>
      <div className="kpis">
        {quotes.map((q) => {
          const dir = q.changePct >= 0 ? "pos" : "neg";
          const flashClass = flash[q.key] ? `kpi-flash-${flash[q.key]}` : "";
          return (
            <div className={`kpi kpi-${dir} ${flashClass}`} key={q.key}>
              <div className="label">{q.name}</div>
              <div className="value">
                {q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                <span className="muted" style={{ fontSize: 12, marginLeft: 5 }}>
                  {q.currency}
                </span>
              </div>
              <div className={`kpi-chip ${dir}`}>
                {dir === "pos" ? "▲" : "▼"} {Math.abs(q.changePct).toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
      {error && <p className="err">{error}</p>}
    </>
  );
}
