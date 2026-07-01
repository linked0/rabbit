"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "../LangContext";
import { pick } from "@/lib/i18n";

// C2 서처 — 폼 입력 → /api/bundle → Sepolia relay에 번들 제출. 개인키는 서버에만 있음.
type BundleResp = {
  ok?: boolean;
  error?: string;
  builders?: string[];
  submissions?: number;
  sender?: string;
  to?: string;
  valueEth?: string;
  nonce?: number;
  currentBlock?: number;
  firstBlock?: number;
  lastBlock?: number;
  submittedBlocks?: number;
  bundleHash?: string | null;
  txHash?: string;
  simulation?: unknown;
  rawTx?: string;
  submittedAt?: string;
};

type Inclusion = { status: "waiting" | "included" | "missed"; block?: number; elapsed?: number };

export default function BundleSubmit() {
  const { lang } = useLang();
  const [network, setNetwork] = useState<"sepolia" | "mainnet">("sepolia");
  const [to, setTo] = useState("");
  const [valueEth, setValueEth] = useState("0");
  const [maxFeeGwei, setMaxFeeGwei] = useState("30");
  const [maxPriorityGwei, setMaxPriorityGwei] = useState("2");
  const [blocks, setBlocks] = useState("5");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<BundleResp | null>(null);
  const [inclusion, setInclusion] = useState<Inclusion | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };
  useEffect(() => stopPoll, []); // 언마운트 시 정리

  // 제출 후 tx 해시로 포함 여부를 폴링 (블록 창을 지나면 미포함으로 표시).
  const startPolling = (txHash: string, lastBlock: number, net: string) => {
    stopPoll();
    startRef.current = Date.now();
    setInclusion({ status: "waiting", elapsed: 0 });
    const tick = async () => {
      try {
        const r = await fetch(`/api/bundle/status?tx=${txHash}&network=${net}`);
        if (!r.headers.get("content-type")?.includes("json")) return;
        const j = await r.json();
        const elapsed = Math.round((Date.now() - startRef.current) / 1000);
        if (j.included) {
          setInclusion({ status: "included", block: j.blockNumber, elapsed });
          stopPoll();
        } else if (typeof j.currentBlock === "number" && j.currentBlock > lastBlock + 2) {
          setInclusion({ status: "missed", elapsed });
          stopPoll();
        } else {
          setInclusion({ status: "waiting", elapsed });
        }
      } catch {
        /* 일시 오류는 무시하고 계속 */
      }
    };
    tick();
    pollRef.current = setInterval(tick, 4000);
  };

  const submit = async () => {
    // ⚠️ 메인넷은 실제 ETH·가스를 사용 → 되돌릴 수 없으므로 한 번 더 확인.
    if (network === "mainnet") {
      const ok = window.confirm(
        pick(
          lang,
          "⚠️ 메인넷입니다. 실제 ETH와 가스가 소모되며 되돌릴 수 없습니다. 계속할까요?",
          "⚠️ This is MAINNET. Real ETH and gas will be spent and it cannot be undone. Continue?"
        )
      );
      if (!ok) return;
    }
    stopPoll();
    setInclusion(null);
    setLoading(true);
    setRes(null);
    try {
      const r = await fetch("/api/bundle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to, valueEth, maxFeeGwei, maxPriorityGwei, blocks, network }),
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
      if (j.ok && j.txHash && j.lastBlock != null) startPolling(j.txHash, j.lastBlock, network);
    } catch (e) {
      setRes({ error: String(e instanceof Error ? e.message : e) });
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !to.trim();
  const netLabel = network === "mainnet" ? "Ethereum Mainnet" : "Sepolia";
  const relayHost = network === "mainnet" ? "relay.flashbots.net" : "relay-sepolia.flashbots.net";

  return (
    <section className="panel">
      <h2>{pick(lang, `🛰️ C2 서처 — 번들 제출 (${netLabel})`, `🛰️ C2 Searcher — submit a bundle (${netLabel})`)}</h2>
      <p className="muted" style={{ marginTop: -4 }}>
        {pick(lang, "번들(순서 정해진 tx 묶음)을 ", "Submits a bundle (an ordered group of txs) to the ")}
        <b>{pick(lang, `Flashbots ${netLabel} relay`, `Flashbots ${netLabel} relay`)}</b>(<code>{relayHost}</code>)
        {pick(lang, "에 제출합니다. 먼저 ", ". First simulates with ")}
        <code>eth_callBundle</code>
        {pick(lang, "로 시뮬레이션 후 ", ", then sends with ")}
        <code>eth_sendBundle</code>
        {pick(lang, "로 전송. ", ". ")}
        <b>
          {network === "mainnet"
            ? pick(lang, "⚠️ 메인넷 (실제 자금)", "⚠️ Mainnet (real funds)")
            : pick(lang, "테스트넷 전용", "Testnet only")}
        </b>
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

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
        <span className="muted">{pick(lang, "네트워크:", "Network:")}</span>
        <button
          type="button"
          className={network === "sepolia" ? "" : "ghost"}
          onClick={() => setNetwork("sepolia")}
        >
          Sepolia
        </button>
        <button
          type="button"
          className={network === "mainnet" ? "" : "ghost"}
          onClick={() => setNetwork("mainnet")}
        >
          {pick(lang, "메인넷 ⚠️", "Mainnet ⚠️")}
        </button>
      </div>

      {network === "mainnet" && (
        <div className="err" style={{ marginTop: 8 }}>
          {pick(
            lang,
            "⚠️ 메인넷: 실제 ETH·가스가 소모되며 되돌릴 수 없습니다. 소액·버리는 키만 사용하세요. 서버에 MAINNET_RPC / MAINNET_ADMIN_KEY 필요.",
            "⚠️ Mainnet: real ETH and gas are spent and it's irreversible. Use only a small, throwaway key. Server needs MAINNET_RPC / MAINNET_ADMIN_KEY."
          )}
        </div>
      )}

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
        <div className="field">
          <label title={pick(lang, "다음 N개 블록에 재제출 (포함 확률↑, 최대 25)", "Resubmit to next N blocks (higher inclusion odds, max 25)")}>
            {pick(lang, "블록 수", "blocks")}
          </label>
          <input value={blocks} onChange={(e) => setBlocks(e.target.value)} />
        </div>
        <button onClick={submit} disabled={disabled}>
          {loading ? pick(lang, "제출 중…", "Submitting…") : pick(lang, "번들 제출", "Submit bundle")}
        </button>
      </div>

      <details style={{ marginTop: 12 }}>
        <summary className="muted" style={{ cursor: "pointer" }}>
          {pick(lang, "💡 값 추천 (maxFee · priority · blocks)", "💡 Suggested values (maxFee · priority · blocks)")}
        </summary>
        <ul className="muted" style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.7 }}>
          <li>
            <b>maxFee (gwei):</b>{" "}
            {pick(
              lang,
              "상한값이라 실제로 다 내진 않아요. Sepolia는 base fee가 작아 25–50이면 충분 (기본 30).",
              "a ceiling — you won't actually pay all of it. Sepolia's base fee is tiny, so 25–50 is plenty (default 30)."
            )}
          </li>
          <li>
            <b>priority (gwei):</b>{" "}
            {pick(
              lang,
              "빌더에게 주는 실제 팁. Sepolia는 2–5면 충분 — 크게 올려도 포함이 보장되진 않아요.",
              "the real tip to the builder. 2–5 is enough on Sepolia — cranking it up won't guarantee inclusion."
            )}
          </li>
          <li>
            <b>blocks:</b>{" "}
            {pick(
              lang,
              "Sepolia에선 이게 가장 큰 지렛대 — 빌더 참여가 드물어 더 많은 슬롯을 노려야 확률이 올라요 (최대 25).",
              "on Sepolia this is the biggest lever — builder participation is sparse, so target more slots to raise the odds (max 25)."
            )}
          </li>
          <li>
            <b>{pick(lang, "규칙:", "Rule of thumb:")}</b> <code>maxFee ≥ 2 × baseFee + priority</code>
            {pick(lang, " (너무 낮으면 팁이 잘립니다).", " (too low and your tip gets clipped).")}
          </li>
        </ul>
      </details>

      {res?.error && <div className="err" style={{ marginTop: 12 }}>{res.error}</div>}

      {res?.ok && (
        <div style={{ marginTop: 14 }}>
          <div className="kpis">
            <Kpi label={pick(lang, "상태", "Status")} value={pick(lang, "제출됨 ✅", "Submitted ✅")} />
            <Kpi label={pick(lang, "현재 블록", "Current block")} value={String(res.currentBlock ?? "—")} />
            <Kpi
              label={pick(lang, "타깃 블록 범위", "Target blocks")}
              value={
                res.firstBlock != null && res.lastBlock != null
                  ? res.firstBlock === res.lastBlock
                    ? String(res.firstBlock)
                    : `${res.firstBlock}–${res.lastBlock}`
                  : "—"
              }
            />
            <Kpi label={pick(lang, "제출한 블록 수", "Blocks submitted")} value={String(res.submittedBlocks ?? "—")} />
          </div>
          <table style={{ marginTop: 12 }}>
            <tbody>
              <Row k="bundleHash" v={res.bundleHash ?? "—"} mono />
              <Row k="nonce" v={String(res.nonce ?? "—")} />
              <Row k={pick(lang, "보낸 주소", "From")} v={res.sender ?? "—"} mono />
              <Row k={pick(lang, "받는 주소", "To")} v={res.to ?? "—"} mono />
              <Row k="value" v={`${res.valueEth} ETH`} />
              <Row
                k={pick(lang, "빌더", "Builders")}
                v={
                  res.builders?.length
                    ? `${res.builders.map((b) => b.replace(/^https?:\/\//, "")).join(", ")} · ${pick(lang, `제출 ${res.submissions}건`, `${res.submissions} sends`)}`
                    : "—"
                }
              />
              <Row
                k={pick(lang, "제출 시각", "Submitted at")}
                v={res.submittedAt ? new Date(res.submittedAt).toLocaleString(lang === "en" ? "en-US" : "ko-KR") : "—"}
              />
            </tbody>
          </table>
          <p className="muted" style={{ marginTop: 10 }}>
            {pick(
              lang,
              "시뮬레이션 통과 후 위 블록 범위 × 각 빌더에 전송됨. 실제 포함은 그 빌더 중 하나가 해당 슬롯을 이길 때 일어납니다. 메인넷은 여러 빌더(Flashbots·beaverbuild·Titan·rsync)에 보내 커버리지를 높였고, Sepolia는 빌더 참여가 드물어 보장되지 않습니다.",
              "Passed simulation and sent to each block in the range × each builder. Inclusion happens when one of those builders wins that slot. On mainnet it goes to several builders (Flashbots · beaverbuild · Titan · rsync) for coverage; on Sepolia builder participation is sparse, so it isn't guaranteed."
            )}
          </p>
          {inclusion && (
            <div
              className={inclusion.status === "missed" ? "err" : "panel"}
              style={{ marginTop: 12, padding: "10px 12px" }}
            >
              {inclusion.status === "waiting" && (
                <span>
                  ⏳{" "}
                  {pick(
                    lang,
                    `포함 대기 중… (경과 ${inclusion.elapsed ?? 0}s)`,
                    `Waiting for inclusion… (${inclusion.elapsed ?? 0}s elapsed)`
                  )}
                </span>
              )}
              {inclusion.status === "included" && (
                <span className="pos">
                  ✅{" "}
                  {pick(
                    lang,
                    `블록 ${inclusion.block}에 포함됨 (${inclusion.elapsed}s 후)`,
                    `Included in block ${inclusion.block} (after ${inclusion.elapsed}s)`
                  )}
                </span>
              )}
              {inclusion.status === "missed" && (
                <span>
                  ❌{" "}
                  {pick(
                    lang,
                    `${res.firstBlock}–${res.lastBlock} 창 안에 포함되지 않음. blocks를 늘리거나 다시 제출하세요.`,
                    `Not included within the ${res.firstBlock}–${res.lastBlock} window. Raise "blocks" or submit again.`
                  )}
                </span>
              )}
            </div>
          )}

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
