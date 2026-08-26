"use client";

// J2 / R-A — mandate: grant · fund · revoke.
//
// 흐름: MetaMask 연결 → 서버가 위임 구조체와 EIP-712 페이로드를 만들어 내려줌 →
// MetaMask 가 서명 → 서버가 기록. **구조체를 브라우저에서 만들지 않는 이유**는
// O1 과 같다: 정의가 두 벌이면 한 글자만 어긋나도 *틀린 메시지에 대한 유효한
// 서명*이 나오고, 에러는 구조체를 언급하지 않는다.
//
// ERC-7715 팝업(`wallet_requestExecutionPermissions`)을 쓰지 않는 이유와, 언젠가
// 쓸 수 있는지 실제로 물어보는 버튼이 아래에 있다.
import { useCallback, useEffect, useState } from "react";
import { createWalletClient, custom } from "viem";
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit/actions";
import { useLang } from "../../../LangContext";
import { pick } from "@/lib/i18n";
import { short } from "./Preflight";

// `window.ethereum` 의 전역 선언은 `app/live/aa/SessionKeyDemo.tsx` 에 이미 있다.
// 두 번 선언하면 타입이 충돌하므로 여기서는 호출 지점에서만 좁힌다.
type Eip1193 = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };
const eth = () => {
  const e = window.ethereum as Eip1193 | undefined;
  if (!e) throw new Error("no injected wallet — is MetaMask installed?");
  return e;
};

type Mandate = {
  id: string;
  owner: string;
  capUsdc: number;
  drawnUsdc: number;
  remainingUsdc: number;
  expiresAt: string;
  expired: boolean;
  exhausted: boolean;
  onChain: boolean;
  delegator: string | null;
};

export default function MandatePanel({ onOwner, onChanged }: { onOwner: (a: string | null) => void; onChanged: () => void }) {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);

  const [owner, setOwner] = useState<string | null>(null);
  const [agent, setAgent] = useState<string | null>(null);
  const [mandate, setMandate] = useState<Mandate | null>(null);
  const [cap, setCap] = useState("10");
  const [minutes, setMinutes] = useState("60");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [probe, setProbe] = useState<string | null>(null);
  // 만료가 **눈앞에서** 닫히는 걸 보여주려면 초 단위로 다시 그려야 한다.
  const [, tickNow] = useState(0);

  const reload = useCallback(async () => {
    const r = await fetch("/api/agent/mandate").then((x) => x.json());
    if (r.error) return setErr(r.error);
    setAgent(r.agentAddress);
    setMandate(r.mandate);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);
  useEffect(() => {
    const id = setInterval(() => tickNow((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  async function connect() {
    setErr(null);
    try {
      const accounts = (await eth().request({ method: "eth_requestAccounts" })) as string[] | undefined;
      const a = accounts?.[0] ?? null;
      setOwner(a);
      onOwner(a);
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
    }
  }

  async function grant() {
    if (!owner) return;
    setBusy(true);
    setErr(null);
    setNote(null);
    try {
      const expiresAt = new Date(Date.now() + Number(minutes) * 60_000).toISOString();

      // 1) 서버가 스마트 계정을 배포하고, 자금을 넣고, 구조체를 만든다.
      const prep = await fetch("/api/agent/mandate/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ owner, capUsdc: Number(cap), expiresAt }),
      }).then((r) => r.json());
      if (prep.error) throw new Error(prep.error);

      // 2) MetaMask 가 서명한다. 평범한 eth_signTypedData_v4 라 어느 체인에서든 된다.
      const signature = (await eth().request({
        method: "eth_signTypedData_v4",
        params: [owner, JSON.stringify(prep.typedData, (_k, v) => (typeof v === "bigint" ? v.toString() : v))],
      })) as string;

      // 3) 서명을 채워 기록한다.
      const res = await fetch("/api/agent/mandate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          owner,
          capUsdc: Number(cap),
          expiresAt,
          delegation: { ...prep.delegation, signature },
        }),
      }).then((r) => r.json());
      if (res.error) throw new Error(res.error);

      setNote(
        t(
          `소유자 스마트 계정 ${short(prep.smartAccount.address)}${prep.smartAccount.justDeployed ? " (방금 배포됨)" : ""}, 잔고 ${prep.smartAccount.usdc ?? "?"} USDC`,
          `Owner smart account ${short(prep.smartAccount.address)}${prep.smartAccount.justDeployed ? " (just deployed)" : ""}, balance ${prep.smartAccount.usdc ?? "?"} USDC`,
        ),
      );
      await reload();
      onChanged();
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/agent/mandate", { method: "DELETE" }).then((x) => x.json());
      if (r.error) throw new Error(r.error);
      await reload();
      onChanged();
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  /// c1 프로브 — MetaMask 가 ERC-7715 를 **어느 체인에서** 지원하는지 직접 묻는다.
  /// 답이 31337 을 포함하면 이 페이지 대신 지갑의 네이티브 권한 UI 로 갈 수 있다.
  /// 포함하지 않는다면, 우리가 프레임워크를 직접 배포한 이유가 화면에 증명된다.
  async function probeErc7715() {
    setProbe(null);
    try {
      if (!window.ethereum) throw new Error("no injected wallet");
      const client = createWalletClient({ transport: custom(window.ethereum) }).extend(erc7715ProviderActions());
      const supported = await client.getSupportedExecutionPermissions();
      setProbe(JSON.stringify(supported, null, 1));
    } catch (e) {
      setProbe(String(e instanceof Error ? e.message : e));
    }
  }

  const secsLeft = mandate ? Math.floor((new Date(mandate.expiresAt).getTime() - Date.now()) / 1000) : 0;
  const pctDrawn = mandate && mandate.capUsdc > 0 ? Math.min(100, (mandate.drawnUsdc / mandate.capUsdc) * 100) : 0;

  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <strong>{t("1 · 위임 (R-A)", "1 · Mandate (R-A)")}</strong>
      <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
        {t(
          "상한과 만료 두 경계만 서명합니다. 무엇을 살지는 강제하지 않습니다 — 얼마나 가질 수 있는지만 강제합니다.",
          "You sign two boundaries: an amount and a deadline. Nothing constrains what it buys — only how much it can ever hold.",
        )}
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginTop: 12 }}>
        {!owner ? (
          <button onClick={connect} disabled={busy}>{t("MetaMask 연결", "Connect MetaMask")}</button>
        ) : (
          <div className="sub" style={{ fontFamily: "ui-monospace, monospace" }}>
            {t("소유자", "owner")} {short(owner)}
          </div>
        )}
        <label className="field">
          <span>{t("상한 (USDC)", "Cap (USDC)")}</span>
          <input value={cap} onChange={(e) => setCap(e.target.value)} style={{ width: 90 }} />
        </label>
        <label className="field">
          <span>{t("만료까지 (분)", "Expires in (min)")}</span>
          <input value={minutes} onChange={(e) => setMinutes(e.target.value)} style={{ width: 90 }} />
        </label>
        <button onClick={grant} disabled={!owner || busy}>
          {busy ? "…" : t("위임 부여", "Grant mandate")}
        </button>
        {mandate && (
          <button onClick={revoke} disabled={busy} className="trash">
            {t("취소", "Revoke")}
          </button>
        )}
      </div>

      {agent && (
        <p className="sub" style={{ marginTop: 10, fontSize: 12 }}>
          {t("에이전트", "agent")} <code>{short(agent)}</code> —{" "}
          {t(
            "개인키는 서버에 있습니다 (testnet-grade). 안전 주장은 키가 아니라 금액에 있습니다.",
            "its private key lives on the server (testnet-grade). The safety claim rests on the amount, not on custody.",
          )}
        </p>
      )}

      {mandate && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span>
              <strong>{mandate.drawnUsdc.toFixed(2)}</strong> / {mandate.capUsdc.toFixed(2)} USDC
            </span>
            {/* 만료와 소진은 서로 다른 경계다. 같은 배지로 그리면 데모의 주장이 사라진다. */}
            {mandate.expired ? (
              <span className="poc-badge" style={{ background: "#fee2e2", color: "#991b1b" }}>
                {t("만료됨", "EXPIRED")}
              </span>
            ) : (
              <span className="sub">
                {t("남은 시간", "expires in")} {Math.floor(secsLeft / 60)}m {secsLeft % 60}s
              </span>
            )}
            {mandate.exhausted && (
              <span className="poc-badge" style={{ background: "#fef3c7", color: "#92400e" }}>
                {t("예산 소진", "EXHAUSTED")}
              </span>
            )}
            <span className="poc-badge" style={mandate.onChain ? { background: "#dcfce7", color: "#166534" } : { background: "#f1f5f9", color: "#475569" }}>
              {mandate.onChain ? t("온체인 강제", "ON-CHAIN") : t("DB 전용", "DB ONLY")}
            </span>
          </div>
          <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, marginTop: 8 }}>
            <div style={{ height: 6, width: `${pctDrawn}%`, background: "#0ea5e9", borderRadius: 3 }} />
          </div>
          {mandate.delegator && (
            <p className="sub" style={{ marginTop: 6, fontSize: 12 }}>
              {t("위임자(스마트 계정)", "delegator (smart account)")} <code>{short(mandate.delegator)}</code>
            </p>
          )}
        </div>
      )}

      {note && <p className="sub" style={{ marginTop: 10, fontSize: 13 }}>{note}</p>}
      {err && <p className="err" style={{ marginTop: 10 }}>{err}</p>}

      <details style={{ marginTop: 14 }}>
        <summary className="sub" style={{ cursor: "pointer", fontSize: 13 }}>
          {t("왜 MetaMask 의 권한 팝업을 쓰지 않나 (직접 물어보기)", "Why not MetaMask's own permission popup (ask it yourself)")}
        </summary>
        <p className="sub" style={{ marginTop: 8, fontSize: 13 }}>
          {t(
            "ERC-7715 요청은 MetaMask 확장이 답하므로 확장이 그 체인을 지원해야 하고, DelegationManager 주소도 지갑이 응답으로 알려줍니다 — SDK 에 하드코딩된 주소가 하나도 없다는 점이 그 증거입니다. 아래 버튼은 지갑에게 지원 체인 목록을 그대로 물어봅니다.",
            "An ERC-7715 request is answered by the MetaMask extension, so the extension has to support the chain — and it supplies the DelegationManager address in its response, which is why the SDK hardcodes none. The button below asks the wallet for its actual list.",
          )}
        </p>
        <button onClick={probeErc7715} style={{ marginTop: 8 }}>
          {t("지원 체인 물어보기", "Ask the wallet")}
        </button>
        {probe && (
          <pre className="sub" style={{ marginTop: 8, fontSize: 12, overflowX: "auto", maxHeight: 220 }}>{probe}</pre>
        )}
      </details>
    </div>
  );
}
