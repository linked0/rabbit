"use client";

// J2 — 콘솔 셸. 마켓 선택 + 튜닝 손잡이 + 세 패널.
//
// **로컬 전용**이다. anvil 과 verex API 가 이 기계에서 돌고 있어야 한다. 배포된
// 사이트에서 열면 프리플라이트가 그렇게 말해 줄 것이다 — 그래서 목업 페이지
// (`/live/agent`)를 이걸로 덮어쓰지 않았다. 저쪽은 어디서나 열리는 논증이고,
// 이쪽은 기계 앞에서만 열리는 조작판이다.
//
// 손잡이(쿨다운·edge·규모·뉴스 창)를 노출하는 이유: 기본값(1시간 쿨다운, 5pp edge)
// 으로는 한 번의 세션에서 여섯 가지 판정을 다 볼 수 없다. 값을 줄여야 만료·소진·
// 쿨다운을 몇 분 안에 재현할 수 있고, 그 재현이 이 페이지의 목적이다.
import { useCallback, useEffect, useState } from "react";
import { useLang } from "../../../LangContext";
import { pick } from "@/lib/i18n";
import { fetchJson } from "./fetchJson";
import Preflight from "./Preflight";
import ParticipantsPanel from "./ParticipantsPanel";
import MandatePanel from "./MandatePanel";
import NewsPanel from "./NewsPanel";
import JournalPanel from "./JournalPanel";
import SchedulerPanel from "./SchedulerPanel";

type Market = { slug: string; title: string; status: string; outcomes: { label: string }[] };

export default function Console() {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);

  const [markets, setMarkets] = useState<Market[]>([]);
  const [slug, setSlug] = useState<string | null>(null);
  const [outcome, setOutcome] = useState("Yes");
  const [owner, setOwner] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [marketsErr, setMarketsErr] = useState<string | null>(null);

  const [cooldownSec, setCooldownSec] = useState(60);
  const [edgeThreshold, setEdgeThreshold] = useState(0.05);
  const [sizeJusd, setSizeJusd] = useState(2.5);
  const [newsWithinHours, setNewsWithinHours] = useState(48);

  const bump = useCallback(() => setRefreshKey((n) => n + 1), []);

  useEffect(() => {
    fetchJson<{ error?: string; markets: Market[] }>("/api/agent/markets")
      .then((j) => {
        if (j.error) return setMarketsErr(j.error);
        setMarkets(j.markets);
        setSlug((s) => s ?? j.markets[0]?.slug ?? null);
      })
      .catch((e) => setMarketsErr(String(e)));
  }, []);

  const market = markets.find((m) => m.slug === slug) ?? null;

  return (
    <>
      <Preflight owner={owner} refreshKey={refreshKey} />

      <ParticipantsPanel owner={owner} refreshKey={refreshKey} onChanged={bump} />

      <div className="panel" style={{ marginTop: 24 }}>
        <strong>{t("마켓과 손잡이", "Market and dials")}</strong>
        {marketsErr && (
          <p className="err" style={{ marginTop: 8 }}>
            {t("verex 에서 마켓을 읽지 못했습니다: ", "Could not read markets from verex: ")}
            {marketsErr}
          </p>
        )}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginTop: 12 }}>
          <label className="field" style={{ flex: "2 1 300px" }}>
            <span>{t("마켓", "Market")}</span>
            <select value={slug ?? ""} onChange={(e) => setSlug(e.target.value || null)}>
              <option value="">—</option>
              {markets.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.title} {m.status !== "OPEN" ? `(${m.status})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t("결과", "Outcome")}</span>
            <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              {(market?.outcomes ?? [{ label: "Yes" }, { label: "No" }]).map((o) => (
                <option key={o.label} value={o.label}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginTop: 10 }}>
          <label className="field">
            <span>{t("쿨다운 (초)", "Cooldown (s)")}</span>
            <input type="number" value={cooldownSec} onChange={(e) => setCooldownSec(Number(e.target.value))} style={{ width: 90 }} />
          </label>
          <label className="field">
            <span>{t("edge 문턱", "Edge threshold")}</span>
            <input type="number" step="0.01" value={edgeThreshold} onChange={(e) => setEdgeThreshold(Number(e.target.value))} style={{ width: 90 }} />
          </label>
          <label className="field">
            <span>{t("주문 규모 (jUSD)", "Order size (jUSD)")}</span>
            <input type="number" step="0.5" value={sizeJusd} onChange={(e) => setSizeJusd(Number(e.target.value))} style={{ width: 90 }} />
          </label>
          <label className="field">
            <span>{t("뉴스 창 (시간)", "News window (h)")}</span>
            <input type="number" value={newsWithinHours} onChange={(e) => setNewsWithinHours(Number(e.target.value))} style={{ width: 90 }} />
          </label>
        </div>
        <p className="sub" style={{ marginTop: 8, fontSize: 12 }}>
          {t(
            "기본값(쿨다운 3600초, edge 0.05)으로는 한 세션에서 여섯 판정을 다 볼 수 없습니다. 쿨다운을 60초로, 상한을 작게 잡으면 몇 분 안에 재현됩니다.",
            "The defaults (3600s cooldown, 0.05 edge) will not show you all six verdicts in one sitting. Drop the cooldown to 60s and keep the cap small to reproduce them in minutes.",
          )}
        </p>
      </div>

      <MandatePanel onOwner={setOwner} onChanged={bump} refreshKey={refreshKey} />
      <NewsPanel marketSlug={slug} withinHours={newsWithinHours} onChanged={bump} />
      <SchedulerPanel
        marketSlug={slug}
        outcome={outcome}
        settings={{ cooldownSec, edgeThreshold, sizeJusd, newsWithinHours }}
        onChanged={bump}
      />
      <JournalPanel refreshKey={refreshKey} />
    </>
  );
}
