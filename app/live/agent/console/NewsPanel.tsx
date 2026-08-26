"use client";

// J2 / R-I — 증거 저장소의 화면.
//
// 그어둔 선: **헤드라인은 증거, 입장은 조종.** 여기 들어가는 것은 사실 진술이어야
// 하고 "강세로 봐" 같은 지시여선 안 된다. 그 구분이 데모의 주장("에이전트가 스스로
// 견해를 형성한다")을 지킨다 — 그래서 입력창 옆에 그 문장을 적어 둔다.
//
// 창(window) 배지가 있는 이유: 저장된 전체가 아니라 **추정이 실제로 볼 것**을
// 보여줘야 한다. 저장은 됐는데 창 밖이라 무시된 항목은, 화면이 말해 주지 않으면
// "LLM 이 왜 이걸 안 봤지"라는 잘못된 디버깅으로 이어진다.
import { useCallback, useEffect, useState } from "react";
import { useLang } from "../../../LangContext";
import { pick } from "@/lib/i18n";

type NewsRow = {
  id: string;
  marketSlug: string;
  headline: string;
  body: string | null;
  source: string | null;
  publishedAt: string;
  origin: string;
};

export default function NewsPanel({
  marketSlug,
  withinHours,
  onChanged,
}: {
  marketSlug: string | null;
  withinHours: number;
  onChanged: () => void;
}) {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);

  const [rows, setRows] = useState<NewsRow[]>([]);
  const [headline, setHeadline] = useState("");
  const [source, setSource] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!marketSlug) return setRows([]);
    const r = await fetch(`/api/agent/news?marketSlug=${encodeURIComponent(marketSlug)}`).then((x) => x.json());
    if (r.error) return setErr(r.error);
    setRows(r.news);
  }, [marketSlug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function add() {
    if (!marketSlug || !headline.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/agent/news", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketSlug, headline, source: source || undefined, body: body || undefined }),
      }).then((x) => x.json());
      if (r.error) throw new Error(r.error);
      setHeadline("");
      setSource("");
      setBody("");
      await reload();
      onChanged();
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/agent/news?id=${id}`, { method: "DELETE" });
      await reload();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  const cutoff = Date.now() - withinHours * 3_600_000;
  const inWindow = rows.filter((r) => new Date(r.publishedAt).getTime() >= cutoff).length;

  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <strong>{t("2 · 뉴스 저장소 (R-I)", "2 · News store (R-I)")}</strong>
      <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
        {t(
          "헤드라인은 증거이고 입장은 조종입니다. 사실 진술을 넣으세요 — 「강세로 봐」가 아니라 「상원의원 X 가 찬성 투표를 예고했다」.",
          "A headline is evidence; a position is steering. Enter statements of fact — “Senator X said they will vote yes”, not “treat this as bullish”.",
        )}
      </p>

      {!marketSlug ? (
        <p className="sub" style={{ marginTop: 10 }}>{t("먼저 마켓을 고르세요.", "Pick a market first.")}</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginTop: 12 }}>
            <label className="field" style={{ flex: "2 1 320px" }}>
              <span>{t("헤드라인", "Headline")}</span>
              <input value={headline} onChange={(e) => setHeadline(e.target.value)} />
            </label>
            <label className="field" style={{ flex: "1 1 140px" }}>
              <span>{t("출처", "Source")}</span>
              <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Reuters" />
            </label>
            <button onClick={add} disabled={busy || !headline.trim()}>{t("추가", "Add")}</button>
          </div>
          <label className="field" style={{ marginTop: 8, display: "block" }}>
            <span>{t("본문 또는 URL (선택)", "Body or URL (optional)")}</span>
            <input value={body} onChange={(e) => setBody(e.target.value)} style={{ width: "100%" }} />
          </label>

          <p className="sub" style={{ marginTop: 12, fontSize: 13 }}>
            {/* 저장된 수가 아니라 추정이 볼 수를 강조한다. */}
            <strong>{inWindow}</strong>{" "}
            {t(`건이 최근 ${withinHours}시간 창 안에 있습니다`, `inside the ${withinHours}h window`)}
            {rows.length !== inWindow && (
              <> · {t(`${rows.length - inWindow}건은 창 밖이라 추정이 보지 않습니다`, `${rows.length - inWindow} outside it, invisible to the estimate`)}</>
            )}
          </p>

          <ul style={{ marginTop: 8, paddingLeft: 0, listStyle: "none" }}>
            {rows.map((r) => {
              const fresh = new Date(r.publishedAt).getTime() >= cutoff;
              return (
                <li key={r.id} style={{ padding: "6px 0", borderTop: "1px solid #e2e8f0", opacity: fresh ? 1 : 0.45 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                    <span style={{ flex: 1 }}>{r.headline}</span>
                    <span className="sub" style={{ fontSize: 12 }}>
                      {r.source ?? "—"} · {new Date(r.publishedAt).toLocaleString()}
                    </span>
                    <button className="trash" onClick={() => remove(r.id)} disabled={busy} aria-label="delete">×</button>
                  </div>
                  {r.body && <div className="sub" style={{ fontSize: 12 }}>{r.body}</div>}
                </li>
              );
            })}
            {rows.length === 0 && (
              <li className="sub" style={{ fontSize: 13 }}>
                {t(
                  "아직 없습니다 — 이 상태로 틱을 돌리면 SKIP_NO_ESTIMATE 가 나옵니다. 뉴스가 없으면 LLM 을 부르지 않습니다.",
                  "Nothing yet — tick now and you get SKIP_NO_ESTIMATE. With no news the LLM is not called at all.",
                )}
              </li>
            )}
          </ul>
        </>
      )}
      {err && <p className="err" style={{ marginTop: 10 }}>{err}</p>}
    </div>
  );
}
