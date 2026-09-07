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
import { fetchJson } from "./fetchJson";

// `window.ethereum` 의 전역 선언은 `app/live/aa/SessionKeyDemo.tsx` 에 이미 있다.
// 두 번 선언하면 타입이 충돌하므로 여기서는 호출 지점에서만 좁힌다.
/// `/api/agent/mandate/prepare` 의 응답. 서명 대상(typedData)과 그 서명이 실릴
/// 위임 원본, 그리고 방금 배포/충전된 소유자 스마트 계정.
type Prepared = {
  error?: string;
  typedData: unknown;
  delegation: Record<string, unknown>;
  smartAccount: { address: string; justDeployed: boolean; usdc: number | null };
};

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

export default function MandatePanel({
  onOwner,
  onChanged,
  refreshKey,
}: {
  onOwner: (a: string | null) => void;
  onChanged: () => void;
  /// 스케줄러가 이 탭 몰래 인출을 만든다 (jay, 2026-09-02) — 콘솔의 refreshKey 를 받아
  /// 저널과 같은 박자로 진행률을 다시 읽는다. 없으면 화면의 0.00 이 조용히 거짓말한다.
  refreshKey: number;
}) {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);

  const [owner, setOwner] = useState<string | null>(null);
  const [agent, setAgent] = useState<string | null>(null);
  /// 상한이 걸리는 토큰. ERC-7715 요청에 필요하고, 출처는 언제나 verex 다.
  const [usdc, setUsdc] = useState<string | null>(null);
  const [mandate, setMandate] = useState<Mandate | null>(null);
  const [cap, setCap] = useState("10");
  const [minutes, setMinutes] = useState("60");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  /// 로드 실패는 클릭 에러와 **다른 칸**에 산다 (jay, 2026-09-07). 예전에는 reload 실패가
  /// err 에 들어갔다가 grant() 첫 줄의 setErr(null) 에 지워졌고, 그 자리를 뒤이은
  /// "agent address is not loaded yet" 가 차지해 진짜 원인(GET 500 등)이 화면에서 사라졌다.
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [probe, setProbe] = useState<string | null>(null);
  // 만료가 **눈앞에서** 닫히는 걸 보여주려면 초 단위로 다시 그려야 한다.
  const [, tickNow] = useState(0);

  const reload = useCallback(async () => {
    try {
      const r = await fetchJson<{
        error?: string;
        agentAddress: string;
        usdc: string | null;
        mandate: Mandate | null;
        mandateError?: string | null;
      }>("/api/agent/mandate");
      if (r.error) return setLoadErr(r.error);
      setAgent(r.agentAddress);
      setUsdc(r.usdc);
      setMandate(r.mandate);
      // DB 만 죽은 경우 라우트는 주소·USDC 는 주고 mandateError 로 사정을 말한다 —
      // 화면도 같은 만큼만 죽어야 한다: 부여는 되게 두고, 왜 진행률이 안 보이는지만 밝힌다.
      setLoadErr(r.mandateError ?? null);
    } catch (e) {
      setLoadErr(String(e instanceof Error ? e.message : e));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);
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

  /// ERC-7715 경로. 우리는 구조체를 만들지도, 보지도 않는다 — 상한·만료·수령인만
  /// 넘기고 지갑이 나머지를 한다. 돌아오는 것은 불투명한 `context` 와, **지갑이
  /// 알려주는** DelegationManager 주소다. 우리 코드에 그 주소가 없다는 점이
  /// 이 경로의 요점이다.
  async function grantVia7715(chainId: number, expiresAt: string) {
    // 클릭이 첫 로드보다 빠르거나(레이스) 첫 로드가 실패했을 수 있다 (jay, 2026-09-07:
    // 참여자 표에는 에이전트 주소가 있는데 여기만 "not loaded yet"). 상태에 없으면 지금
    // 한 번 직접 읽는다 — 그래도 없으면 막연한 문장 대신 GET 이 말한 이유를 그대로 던진다.
    let agentAddr = agent;
    let usdcAddr = usdc;
    if (!agentAddr || !usdcAddr) {
      const r = await fetchJson<{ error?: string; agentAddress?: string; usdc?: string | null }>(
        "/api/agent/mandate",
      );
      if (r.error) {
        throw new Error(
          t(`에이전트 상태를 읽지 못했습니다 — ${r.error}`, `couldn't load agent state — ${r.error}`),
        );
      }
      agentAddr = r.agentAddress ?? null;
      usdcAddr = r.usdc ?? null;
      if (agentAddr) setAgent(agentAddr);
      if (usdcAddr) setUsdc(usdcAddr);
    }
    if (!agentAddr)
      throw new Error(
        "agent address missing from /api/agent/mandate — is AGENT_PRIVATE_KEY set on the server?",
      );
    if (!usdcAddr) throw new Error("no USDC address from verex — is the market API up?");

    const client = createWalletClient({ transport: custom(window.ethereum as never) }).extend(
      erc7715ProviderActions(),
    );
    // startTime 은 벽시계가 아니라 **체인의 시간**으로 (jay, 2026-09-02). 포크의 블록
    // 시간은 채굴 전까지 벽시계보다 뒤처지고, 지갑의 권한은 ERC20PeriodTransferEnforcer
    // 로 강제되므로 startTime 이 블록 시간보다 미래면 상환이 전부
    // "transfer-not-started" 로 거절된다. 체인에 물어보면 갈라질 수 없다.
    const latest = (await eth().request({
      method: "eth_getBlockByNumber",
      params: ["latest", false],
    })) as { timestamp: string };
    const now = parseInt(latest.timestamp, 16);
    const granted = await client.requestExecutionPermissions([
      {
        chainId,
        expiry: Math.floor(new Date(expiresAt).getTime() / 1000),
        to: agentAddr as `0x${string}`,
        permission: {
          type: "erc20-token-allowance",
          data: {
            tokenAddress: usdcAddr as `0x${string}`,
            allowanceAmount: BigInt(Math.round(Number(cap) * 1e6)),
            startTime: now,
            justification: `rabbit agent mandate — up to ${cap} USDC until ${expiresAt}`,
          },
          isAdjustmentAllowed: false,
        },
      },
    ]);

    const res = await fetchJson<{ error?: string }>("/api/agent/mandate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        owner,
        capUsdc: Number(cap),
        expiresAt,
        delegation: {
          kind: "erc7715",
          context: granted[0].context,
          delegationManager: granted[0].delegationManager,
        },
      }),
    });
    if (res.error) throw new Error(res.error);

    setNote(
      t(
        `지갑이 권한을 발급했습니다 — DelegationManager ${short(granted[0].delegationManager)} (우리가 아니라 지갑이 알려준 주소)`,
        `The wallet issued the permission — DelegationManager ${short(granted[0].delegationManager)} (its address came from the wallet, not from us)`,
      ),
    );
    await reload();
    onChanged();
  }

  async function grant() {
    if (!owner) return;
    setBusy(true);
    setErr(null);
    setNote(null);
    try {
      const expiresAt = new Date(Date.now() + Number(minutes) * 60_000).toISOString();

      // 지갑이 이 체인에서 ERC-7715 를 제공하는가로 갈린다. 31337 에는 MetaMask 의
      // 표준 배포가 없어 지갑이 답하지 않고(2026-08-31 측정: 지원 목록에 31337 없음),
      // 표준 배포가 있는 체인에서는 **지갑이 직접** 권한을 만들고 자기 UI 로 보여 준다
      // — 사용자가 날것의 EIP-712 구조체 대신 "최대 10 USDC, 60분"을 읽게 되는 지점.
      const chainIdHex = (await eth().request({ method: "eth_chainId" })) as string;
      const chainId = parseInt(chainIdHex, 16);
      if (chainId !== 31337) {
        await grantVia7715(chainId, expiresAt);
        return;
      }

      // 1) 서버가 스마트 계정을 배포하고, 자금을 넣고, 구조체를 만든다.
      const prep = await fetchJson<Prepared>("/api/agent/mandate/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ owner, capUsdc: Number(cap), expiresAt }),
      });
      if (prep.error) throw new Error(prep.error);

      // 2) MetaMask 가 서명한다. 평범한 eth_signTypedData_v4 라 어느 체인에서든 된다.
      const signature = (await eth().request({
        method: "eth_signTypedData_v4",
        params: [owner, JSON.stringify(prep.typedData, (_k, v) => (typeof v === "bigint" ? v.toString() : v))],
      })) as string;

      // 3) 서명을 채워 기록한다.
      const res = await fetchJson<{ error?: string }>("/api/agent/mandate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          owner,
          capUsdc: Number(cap),
          expiresAt,
          delegation: { ...prep.delegation, signature },
        }),
      });
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
      const r = await fetchJson<{ error?: string }>("/api/agent/mandate", { method: "DELETE" });
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
        {/* 부여와 취소는 동시에 보이지 않는다 (jay, 2026-09-02). 살아 있는 mandate 가
            있으면 할 일은 취소뿐이고(부여는 어차피 이전 것을 자동 revoke 하므로 두 버튼은
            같은 자리를 다툰다), 없거나 만료됐으면 취소할 것이 없다. */}
        {mandate && !mandate.expired ? (
          <button onClick={revoke} disabled={busy} className="trash">
            {busy ? "…" : t("취소", "Revoke")}
          </button>
        ) : (
          <button onClick={grant} disabled={!owner || busy}>
            {busy ? "…" : t("위임 부여", "Grant mandate")}
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
      {/* 로드 실패는 클릭과 무관하게 계속 보인다 — 클릭 에러가 원인을 덮어쓰던 것이
          2026-09-07 의 버그였다. 두 줄이 같이 뜨면 위가 원인, 아래가 증상이다. */}
      {loadErr && (
        <p className="err" style={{ marginTop: 10 }}>
          {t("에이전트 상태 로드 실패", "agent state failed to load")} — {loadErr}
        </p>
      )}
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
