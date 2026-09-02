"use client";

// J2 / R-F — 스케줄러 패널 (jay, 2026-09-02). 카드가 "빠진 조각"이라 적어 온 것.
// 시작하면 서버의 타이머가 지금 화면의 마켓·손잡이 값으로 틱을 돌린다 — 탭을 닫아도
// 계속 돈다. 그래서 상태(몇 번 돌았고 마지막 판정이 무엇인지)를 서버에 물어서 그린다.
import { useCallback, useEffect, useState } from "react";
import { useLang } from "../../../LangContext";
import { pick } from "@/lib/i18n";
import { fetchJson } from "./fetchJson";

type State = {
  running: boolean;
  intervalSec: number;
  settings: { marketSlug: string; outcome?: string } | null;
  startedAt: string | null;
  runs: number;
  lastRunAt: string | null;
  lastVerdict: string | null;
  lastError: string | null;
  busy: boolean;
};

export default function SchedulerPanel({
  marketSlug,
  outcome,
  settings,
  onChanged,
}: {
  marketSlug: string | null;
  outcome: string;
  settings: { cooldownSec: number; edgeThreshold: number; sizeUsdc: number; newsWithinHours: number };
  onChanged: () => void;
}) {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  const [state, setState] = useState<State | null>(null);
  const [intervalSec, setIntervalSec] = useState(60);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetchJson<State & { error?: string }>("/api/agent/scheduler")
      .then((j) => (j.error ? setErr(j.error) : (setState(j), setErr(null))))
      .catch((e) => setErr(String(e)));
  }, []);

  // 돌고 있는 동안은 5초마다 상태를 물어 저널도 함께 새로고침한다 — 스케줄러의 틱은
  // 이 탭이 모르는 사이에 행을 만들기 때문이다.
  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);
  const runs = state?.runs ?? 0;
  useEffect(() => {
    if (runs > 0) onChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runs]);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetchJson<State & { error?: string }>("/api/agent/scheduler", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.error) setErr(r.error);
      else setState(r);
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  const start = () =>
    post({ action: "start", intervalSec, marketSlug, outcome, ...settings });
  const stop = () => post({ action: "stop" });

  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <strong>{t("스케줄러 (R-F)", "Scheduler (R-F)")}</strong>
      <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
        {t(
          "빠져 있던 조각 — 방에 아무도 없을 때 틱을 부르는 서버 타이머. 시작하면 지금 화면의 마켓과 손잡이 값으로 돌고, 탭을 닫아도 계속 돕니다. 경계는 여전히 체인이 지킵니다 — 상한과 만료는 스케줄러가 몇 번을 돌든 변하지 않습니다.",
          "The missing piece — a server timer that calls the tick with nobody in the room. It runs with the market and dials currently on screen, and keeps running when this tab closes. The boundaries still hold on-chain: cap and expiry do not care how often the scheduler fires.",
        )}{" "}
        <em>
          {t(
            "마켓·손잡이 값은 시작 순간에 고정됩니다 — 바꾼 값은 정지 후 다시 시작해야 적용됩니다.",
            "Market and dial values are captured at Start — changes apply only after Stop → Start.",
          )}
        </em>
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginTop: 12 }}>
        <label className="field">
          <span>{t("간격 (초)", "Interval (s)")}</span>
          <input
            type="number"
            value={intervalSec}
            onChange={(e) => setIntervalSec(Number(e.target.value))}
            style={{ width: 90 }}
            disabled={state?.running}
          />
        </label>
        {state?.running ? (
          <button onClick={stop} disabled={busy} className="trash">
            {busy ? "…" : t("정지", "Stop")}
          </button>
        ) : (
          <button onClick={start} disabled={busy || !marketSlug}>
            {busy ? "…" : t("시작", "Start")}
          </button>
        )}
      </div>

      {state?.running && state.settings && (
        <p className="sub" style={{ marginTop: 10, fontSize: 13, fontFamily: "ui-monospace, monospace" }}>
          {t("실행 중", "running")} · {state.settings.marketSlug} / {state.settings.outcome ?? "Yes"} ·{" "}
          {t("매", "every")} {state.intervalSec}s · {t("실행", "runs")} {state.runs}
          {state.lastVerdict && ` · ${t("마지막", "last")} ${state.lastVerdict}`}
          {state.busy && ` · ${t("틱 진행 중…", "tick in flight…")}`}
        </p>
      )}
      {!state?.running && state && state.runs > 0 && (
        <p className="sub" style={{ marginTop: 10, fontSize: 13 }}>
          {t("정지됨", "stopped")} — {state.runs} {t("회 실행, 마지막 판정", "runs, last verdict")}{" "}
          {state.lastVerdict ?? "—"}
        </p>
      )}
      {state?.lastError && (
        <p className="err" style={{ marginTop: 8, fontSize: 13 }}>
          {t("마지막 실행 오류: ", "last run error: ")}
          {state.lastError}
        </p>
      )}
      {err && <p className="err" style={{ marginTop: 8 }}>{err}</p>}
    </div>
  );
}
