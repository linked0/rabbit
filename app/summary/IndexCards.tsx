"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/indices");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!alive) return;
        setQuotes(data.quotes);
        setError(data.errors?.length ? data.errors.join(" / ") : null);
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
        {quotes.map((q) => (
          <div className="kpi" key={q.key}>
            <div className="label">{q.name}</div>
            <div className="value">
              {q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              <span className="muted" style={{ fontSize: 12, marginLeft: 5 }}>
                {q.currency}
              </span>
            </div>
            <div
              className={q.changePct >= 0 ? "pos" : "neg"}
              style={{ fontSize: 13 }}
            >
              {q.changePct >= 0 ? "▲" : "▼"} {Math.abs(q.changePct).toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
      {error && <p className="err">{error}</p>}
    </>
  );
}
