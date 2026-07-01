"use client";

import { useState } from "react";
import { useLang } from "../LangContext";
import { pick } from "@/lib/i18n";

// C2 서처 — 폼 입력 → /api/bundle → Sepolia relay에 번들 제출. 개인키는 서버에만 있음.
type BundleResp = {
  ok?: boolean;
  error?: string;
  relay?: string;
  sender?: string;
  to?: string;
  valueEth?: string;
  nonce?: number;
  currentBlock?: number;
  targetBlock?: number;
  bundleHash?: string | null;
  simulation?: unknown;
  rawTx?: string;
  submittedAt?: string;
};

export default function BundleSubmit() {
  const { lang } = useLang();
  const [to, setTo] = useState("");
  const [valueEth, setValueEth] = useState("0");
  const [maxFeeGwei, setMaxFeeGwei] = useState("30");
  const [maxPriorityGwei, setMaxPriorityGwei] = useState("2");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<BundleResp | null>(null);

  const submit = async () => {
    setLoading(true);
    setRes(null);
    try {
      const r = await fetch("/api/bundle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to, valueEth, maxFeeGwei, maxPriorityGwei }),
      });
      // 미로그인 시 미들웨어가 /login으로 리다이렉트 → JSON 아님. 친절히 안내.
      if (r.status === 401 || r.redirected || !r.headers.get("content-type")?.includes("json")) {
        setRes({
          error: pick(
            lang,
            "로그인이 필요합니다. 상단에서 로그인한 뒤 다시 제출하세요.",
            "Login required. Sign in from the top bar, then submit again."
          ),
        });
        return;
      }
      const j = (await r.json()) as BundleResp;
      setRes(j);
    } catch (e) {
      setRes({ error: String(e instanceof Error ? e.message : e) });
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !to.trim();

  return (
    <section className="panel">
      <h2>{pick(lang, "🛰️ C2 서처 — 번들 제출 (Sepolia)", "🛰️ C2 Searcher — submit a bundle (Sepolia)")}</h2>
      <p className="muted" style={{ marginTop: -4 }}>
        {pick(lang, "번들(순서 정해진 tx 묶음)을 ", "Submits a bundle (an ordered group of txs) to the ")}
        <b>Flashbots Sepolia relay</b>(<code>relay-sepolia.flashbots.net</code>)
        {pick(lang, "에 제출합니다. 먼저 ", ". First simulates with ")}
        <code>eth_callBundle</code>
        {pick(lang, "로 시뮬레이션 후 ", ", then sends with ")}
        <code>eth_sendBundle</code>
        {pick(lang, "로 전송. ", ". ")}
        <b>{pick(lang, "테스트넷 전용", "Testnet only")}</b>
        {pick(
          lang,
          " · 서명은 서버의 ",
          " · signing happens only with the server's "
        )}
        <code>ADMIN_KEY</code>
        {pick(
          lang,
          "로만 이뤄지며 브라우저에 노출되지 않습니다. 로그인 필요.",
          " and is never exposed to the browser. Login required."
        )}
      </p>

      <div className="row-form" style={{ marginTop: 12 }}>
        <div className="field" style={{ gridColumn: "span 2" }}>
          <label>{pick(lang, "받는 주소 (to)", "Recipient (to)")}</label>
          <input
            placeholder={pick(lang, "0x… (예: 자기 지갑 또는 소각 주소)", "0x… (e.g. your wallet or a burn address)")}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="field">
          <label>value (ETH)</label>
          <input value={valueEth} onChange={(e) => setValueEth(e.target.value)} />
        </div>
        <div className="field">
          <label>maxFee (gwei)</label>
          <input value={maxFeeGwei} onChange={(e) => setMaxFeeGwei(e.target.value)} />
        </div>
        <div className="field">
          <label>priority (gwei)</label>
          <input value={maxPriorityGwei} onChange={(e) => setMaxPriorityGwei(e.target.value)} />
        </div>
        <button onClick={submit} disabled={disabled}>
          {loading ? pick(lang, "제출 중…", "Submitting…") : pick(lang, "번들 제출", "Submit bundle")}
        </button>
      </div>

      {res?.error && <div className="err" style={{ marginTop: 12 }}>{res.error}</div>}

      {res?.ok && (
        <div style={{ marginTop: 14 }}>
          <div className="kpis">
            <Kpi label={pick(lang, "상태", "Status")} value={pick(lang, "제출됨 ✅", "Submitted ✅")} />
            <Kpi label={pick(lang, "현재 블록", "Current block")} value={String(res.currentBlock ?? "—")} />
            <Kpi label={pick(lang, "타깃 블록", "Target block")} value={String(res.targetBlock ?? "—")} />
            <Kpi label="nonce" value={String(res.nonce ?? "—")} />
          </div>
          <table style={{ marginTop: 12 }}>
            <tbody>
              <Row k="bundleHash" v={res.bundleHash ?? "—"} mono />
              <Row k={pick(lang, "보낸 주소", "From")} v={res.sender ?? "—"} mono />
              <Row k={pick(lang, "받는 주소", "To")} v={res.to ?? "—"} mono />
              <Row k="value" v={`${res.valueEth} ETH`} />
              <Row k="relay" v={res.relay ?? "—"} />
              <Row
                k={pick(lang, "제출 시각", "Submitted at")}
                v={res.submittedAt ? new Date(res.submittedAt).toLocaleString(lang === "en" ? "en-US" : "ko-KR") : "—"}
              />
            </tbody>
          </table>
          <p className="muted" style={{ marginTop: 10 }}>
            {pick(
              lang,
              "시뮬레이션 통과 후 relay에 전달됨. 실제 블록 포함은 해당 슬롯을 Flashbots 연동 빌더가 이길 때 일어나며, Sepolia에선 즉시 포함이 보장되지 않습니다(다음 블록들에 재제출 가능).",
              "Passed simulation and forwarded to the relay. Actual inclusion happens when a Flashbots-connected builder wins that slot; on Sepolia inclusion isn't guaranteed per block (resubmit for later blocks)."
            )}
          </p>
          <details style={{ marginTop: 8 }}>
            <summary className="muted">{pick(lang, "시뮬레이션 원본(JSON)", "Raw simulation (JSON)")}</summary>
            <pre style={{ overflowX: "auto", fontSize: 12 }}>
              {JSON.stringify(res.simulation, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </section>
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

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <tr>
      <td className="muted" style={{ whiteSpace: "nowrap" }}>{k}</td>
      <td style={{ wordBreak: "break-all" }}>{mono ? <code>{v}</code> : v}</td>
    </tr>
  );
}
