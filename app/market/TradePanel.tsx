"use client";

// Hyperliquid 테스트넷 거래 패널 — 설계: docs/tasks/jun-30-rabbit-design.md §3 Task 3-P2.
// 퍼프(Perp) + 스팟(Spot) 모두 거래. 서명 모델: 사용자 MetaMask 직접 서명(주문마다 팝업),
// 키 저장 없음. 클라이언트 사이드 전용 — 브라우저가 HL 테스트넷 API와 직접 통신한다.
// 표시용 오더북(/api/orderbook)은 서버·메인넷 그대로, 거래만 테스트넷(mock USDC).
//
// 스팟 주문의 asset id = 10000 + spotMeta.universe[i].index (HL 규약). 퍼프는 meta.universe 인덱스.

import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, Wallet } from "ethers";
import * as hl from "@nktkas/hyperliquid";
import { useLang } from "../LangContext";
import { pick } from "@/lib/i18n";

declare global {
  interface Window {
    ethereum?: any;
  }
}

type Side = "buy" | "sell";
type Mode = "perp" | "spot";
type OpenOrder = { coin: string; oid: number; side: string; limitPx: string; sz: string };
// USDC 견적(quote) 스팟 페어. assetId = 10000 + universe index.
type SpotPair = { label: string; assetId: number; baseName: string; szDecimals: number; mid: number };
type Account = {
  perp: number; // 퍼프 증거금 (withdrawable USDC)
  spot: number; // 스팟 USDC 잔고 (faucet이 입금하는 곳)
  szi: number; // 퍼프 포지션 수량
  entryPx: number | null;
  upnl: number | null;
};

// 거래는 항상 테스트넷(mock USDC). SDK가 테스트넷 엔드포인트를 캡슐화한다.
const transport = new hl.HttpTransport({ isTestnet: true });
const info = new hl.InfoClient({ transport });

// HL 가격 규칙: 유효숫자 5자리 이하 + 소수 maxDec자리 이하 (퍼프 6-szDec, 스팟 8-szDec).
function fmtPx(px: number, maxDec: number): string {
  if (!isFinite(px) || px <= 0) return "0";
  const n = Number(Number(px.toPrecision(5)).toFixed(Math.max(0, maxDec)));
  return String(n);
}
// 수량은 base 자산의 szDecimals 자리로 반올림.
function fmtSz(sz: number, szDecimals: number): string {
  return String(Number(sz.toFixed(szDecimals)));
}

// SDK는 실제 원인을 error.cause 로 감싸므로(예: "Failed to sign the typed data"),
// 표면 메시지에 근본 원인을 함께 노출한다. MetaMask 거절이면 여기서 드러난다.
function errMsg(e: unknown): string {
  if (e instanceof Error) {
    const cause = (e as any).cause;
    const causeMsg =
      cause instanceof Error ? cause.message : cause != null ? String(cause) : "";
    return causeMsg && causeMsg !== e.message ? `${e.message} — ${causeMsg}` : e.message;
  }
  return String(e);
}

// 에이전트(API) 지갑 저장소. MetaMask는 HL 주문(도메인 chainId 1337)을 서명할 수 없어,
// 1회 approveAgent 로 승인한 로컬 에이전트 키가 주문을 서명한다. 에이전트는 거래만 가능(출금 불가).
// 테스트넷 전용 · localStorage(마스터 주소별) 저장.
const AGENT_PREFIX = "hl_agent_";
type StoredAgent = { privateKey: string; approved: boolean };
function loadAgent(master: string): StoredAgent | null {
  try {
    const raw = localStorage.getItem(AGENT_PREFIX + master.toLowerCase());
    return raw ? (JSON.parse(raw) as StoredAgent) : null;
  } catch {
    return null;
  }
}
function saveAgent(master: string, data: StoredAgent): void {
  try {
    localStorage.setItem(AGENT_PREFIX + master.toLowerCase(), JSON.stringify(data));
  } catch {
    /* localStorage 불가 시 무시 */
  }
}

export default function TradePanel({ coin = "ETH" }: { coin?: string }) {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);

  const [address, setAddress] = useState<string | null>(null);
  const [exch, setExch] = useState<hl.ExchangeClient | null>(null); // 마스터(MetaMask) — approveAgent 전용
  const [agentExch, setAgentExch] = useState<hl.ExchangeClient | null>(null); // 에이전트 키 — 주문 서명
  const [agentApproved, setAgentApproved] = useState<boolean>(false);

  const [mode, setMode] = useState<Mode>("perp");

  // 퍼프
  const [perpIdx, setPerpIdx] = useState<number | null>(null);
  const [perpSz, setPerpSz] = useState<number>(4);
  const [maxLev, setMaxLev] = useState<number>(1);
  const [onlyIsolated, setOnlyIsolated] = useState<boolean>(false);
  const [leverage, setLeverage] = useState<string>("3");
  const [isCross, setIsCross] = useState<boolean>(true);
  // 스팟
  const [spotPairs, setSpotPairs] = useState<SpotPair[]>([]);
  const [spotSel, setSpotSel] = useState<SpotPair | null>(null);
  // 미체결 주문 취소용: coin 이름 → asset id (퍼프 + 스팟)
  const [nameToAsset, setNameToAsset] = useState<Record<string, number>>({});

  const [account, setAccount] = useState<Account | null>(null);
  const [orders, setOrders] = useState<OpenOrder[]>([]);

  const [side, setSide] = useState<Side>("buy");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // 연결된 주소의 잔고(퍼프/스팟)·포지션·미체결 주문 새로고침.
  const refresh = useCallback(
    async (addr: string) => {
      try {
        const [state, spot, open] = await Promise.all([
          info.clearinghouseState({ user: addr as `0x${string}` }),
          info.spotClearinghouseState({ user: addr as `0x${string}` }),
          info.frontendOpenOrders({ user: addr as `0x${string}` }),
        ]);
        const pos = state.assetPositions.find((p: any) => p.position.coin === coin)?.position;
        const spotUsdc = (spot.balances as any[]).find((b) => b.coin === "USDC")?.total ?? "0";
        setAccount({
          perp: Number(state.withdrawable),
          spot: Number(spotUsdc),
          szi: pos ? Number(pos.szi) : 0,
          entryPx: pos?.entryPx != null ? Number(pos.entryPx) : null,
          upnl: pos?.unrealizedPnl != null ? Number(pos.unrealizedPnl) : null,
        });
        setOrders(
          (open as any[]).map((o) => ({
            coin: o.coin,
            oid: o.oid,
            side: o.side, // "B" = bid/buy, "A" = ask/sell
            limitPx: o.limitPx,
            sz: o.sz,
          }))
        );
      } catch (e) {
        console.error("[TradePanel]", e);
        setError(errMsg(e));
      }
    },
    [coin]
  );

  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError(t("MetaMask가 설치되어 있지 않습니다.", "MetaMask is not installed."));
      return;
    }
    setBusy(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();

      const nameMap: Record<string, number> = {};

      // 퍼프 유니버스 → coin 인덱스 + szDecimals (테스트넷 기준).
      const meta = await info.meta();
      meta.universe.forEach((u: any, i: number) => (nameMap[u.name] = i));
      const idx = nameMap[coin];
      if (idx == null) throw new Error(`${coin} not listed on Hyperliquid testnet`);
      const pu = meta.universe[idx] as any;
      setPerpIdx(idx);
      setPerpSz(pu.szDecimals);
      setMaxLev(pu.maxLeverage ?? 1);
      if (pu.onlyIsolated) setIsCross(false);
      setOnlyIsolated(!!pu.onlyIsolated);
      setLeverage(String(Math.min(3, pu.maxLeverage ?? 3)));

      // 스팟 유니버스 + 시세 → USDC 견적 페어만, 시세가 있는(거래 가능한) 것만.
      try {
        const [sMeta, sCtxs] = await info.spotMetaAndAssetCtxs();
        const tokens = sMeta.tokens as any[];
        // 토큰은 index 필드로 참조 (배열 위치와 다를 수 있음).
        const byIdx: Record<number, any> = {};
        tokens.forEach((tk) => (byIdx[tk.index] = tk));
        // HL "Unit" 자산은 UI에서 U 접두어를 떼고 표시한다 (UETH→ETH 등).
        const UNIT: Record<string, string> = { UETH: "ETH", UBTC: "BTC", USOL: "SOL" };
        const pairs: SpotPair[] = [];
        (sMeta.universe as any[]).forEach((u, i) => {
          const base = byIdx[u.tokens[0]];
          const quote = byIdx[u.tokens[1]];
          const assetId = 10000 + u.index;
          nameMap[u.name] = assetId; // 스팟 미체결 주문 취소용
          if (quote?.name !== "USDC" || !base) return;
          const ctx = (sCtxs as any[])[i];
          const mid = Number(ctx?.midPx ?? ctx?.markPx ?? 0);
          if (!(mid > 0)) return; // 시세 없는 페어 제외
          const disp = UNIT[base.name] ?? base.name;
          pairs.push({ label: `${disp}/USDC`, assetId, baseName: disp, szDecimals: base.szDecimals, mid });
        });
        pairs.sort((a, b) => a.label.localeCompare(b.label));
        setSpotPairs(pairs);
        // 기본 선택: ETH/USDC → HYPE/USDC → 첫 페어.
        setSpotSel(
          pairs.find((p) => p.label === "ETH/USDC") ??
            pairs.find((p) => p.label === "HYPE/USDC") ??
            pairs[0] ??
            null
        );
      } catch {
        /* 스팟 메타 실패는 퍼프 거래를 막지 않음 */
      }

      setNameToAsset(nameMap);

      // 마스터(MetaMask) ExchangeClient — approveAgent(사용자 서명 액션) 전용.
      setExch(new hl.ExchangeClient({ transport, wallet: signer }));
      setAddress(addr);

      // 에이전트 키 로드/생성. 이미 승인돼 있으면 바로 주문용 ExchangeClient 구성.
      let stored = loadAgent(addr);
      if (!stored) {
        const w = Wallet.createRandom();
        stored = { privateKey: w.privateKey, approved: false };
        saveAgent(addr, stored);
      }
      if (stored.approved) {
        setAgentExch(new hl.ExchangeClient({ transport, wallet: new Wallet(stored.privateKey) }));
        setAgentApproved(true);
      } else {
        setAgentExch(null);
        setAgentApproved(false);
      }

      // 퍼프 지정가 프리필.
      try {
        const mids = await info.allMids();
        if (mids[coin]) setPrice(fmtPx(Number(mids[coin]), 6 - meta.universe[idx].szDecimals));
      } catch {
        /* 프리필 실패는 치명적이지 않음 */
      }
      await refresh(addr);
    } catch (e) {
      console.error("[TradePanel]", e);
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }, [coin, refresh, t]);

  // 모드/스팟 페어가 바뀌면 지정가를 해당 시장 시세로 프리필.
  useEffect(() => {
    if (!address) return;
    if (mode === "spot" && spotSel) {
      setPrice(fmtPx(spotSel.mid, 8 - spotSel.szDecimals));
    } else if (mode === "perp" && perpIdx != null) {
      info
        .allMids()
        .then((mids) => {
          if (mids[coin]) setPrice(fmtPx(Number(mids[coin]), 6 - perpSz));
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, spotSel, address]);

  // 현재 모드의 주문 파라미터(asset id, 수량 소수, 가격 소수).
  function orderParams() {
    if (mode === "spot") {
      if (!spotSel) return null;
      return { assetId: spotSel.assetId, szDec: spotSel.szDecimals, maxPxDec: 8 - spotSel.szDecimals };
    }
    if (perpIdx == null) return null;
    return { assetId: perpIdx, szDec: perpSz, maxPxDec: 6 - perpSz };
  }

  // 1회 에이전트 승인 — MetaMask(마스터)가 approveAgent 를 서명(사용자 서명 액션, 도메인 chainId=활성 체인).
  // 이후 주문은 에이전트 키가 서명하므로 팝업/체인ID 충돌이 없다.
  const enableTrading = useCallback(async () => {
    if (!exch || !address) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      let stored = loadAgent(address);
      if (!stored) stored = { privateKey: Wallet.createRandom().privateKey, approved: false };
      const agent = new Wallet(stored.privateKey);
      await exch.approveAgent({ agentAddress: agent.address as `0x${string}`, agentName: "rabbit" });
      stored.approved = true;
      saveAgent(address, stored);
      setAgentExch(new hl.ExchangeClient({ transport, wallet: agent }));
      setAgentApproved(true);
      setNotice(
        t(
          "거래 활성화됨 (에이전트 승인). 이제 주문에 MetaMask 팝업이 없습니다.",
          "Trading enabled (agent approved). Orders are now popup-free."
        )
      );
      await refresh(address);
    } catch (e) {
      console.error("[TradePanel]", e);
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }, [exch, address, refresh, t]);

  // 퍼프 레버리지/증거금 모드 적용 (HL updateLeverage 액션 — 에이전트 키가 서명).
  const applyLeverage = useCallback(async () => {
    if (!agentExch || perpIdx == null) return;
    const lev = Math.max(1, Math.min(maxLev, Math.round(Number(leverage))));
    if (!(lev >= 1)) {
      setError(t("레버리지 값을 확인하세요.", "Check the leverage value."));
      return;
    }
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await agentExch.updateLeverage({ asset: perpIdx, isCross, leverage: lev });
      setLeverage(String(lev));
      setNotice(
        t(
          `레버리지 ${lev}x (${isCross ? "교차" : "격리"}) 적용됨`,
          `Leverage set to ${lev}x (${isCross ? "Cross" : "Isolated"})`
        )
      );
      if (address) await refresh(address);
    } catch (e) {
      console.error("[TradePanel]", e);
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }, [agentExch, perpIdx, maxLev, leverage, isCross, address, refresh, t]);

  const placeOrder = useCallback(async () => {
    const p = orderParams();
    if (!agentExch || !p) return;
    setError(null);
    setNotice(null);
    const szNum = Number(size);
    const pxNum = Number(price);
    if (!(szNum > 0) || !(pxNum > 0)) {
      setError(t("수량과 가격을 입력하세요.", "Enter a size and price."));
      return;
    }
    setBusy(true);
    try {
      await agentExch.order({
        orders: [
          {
            a: p.assetId,
            b: side === "buy",
            p: fmtPx(pxNum, p.maxPxDec),
            s: fmtSz(szNum, p.szDec),
            r: false,
            t: { limit: { tif: "Gtc" } },
          },
        ],
        grouping: "na",
      });
      setNotice(t("주문이 접수되었습니다.", "Order submitted."));
      setSize("");
      if (address) await refresh(address);
    } catch (e) {
      console.error("[TradePanel]", e);
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentExch, mode, spotSel, perpIdx, perpSz, size, price, side, address, refresh, t]);

  const cancelOrder = useCallback(
    async (o: OpenOrder) => {
      if (!agentExch) return;
      const a = nameToAsset[o.coin];
      if (a == null) return;
      setError(null);
      setNotice(null);
      setBusy(true);
      try {
        await agentExch.cancel({ cancels: [{ a, o: o.oid }] });
        setNotice(t("주문을 취소했습니다.", "Order cancelled."));
        if (address) await refresh(address);
      } catch (e) {
        console.error("[TradePanel]", e);
        setError(errMsg(e));
      } finally {
        setBusy(false);
      }
    },
    [agentExch, nameToAsset, address, refresh, t]
  );

  // 계정 잔고·주문 주기적 갱신 (10초). 서명이 필요 없는 읽기 전용 호출.
  useEffect(() => {
    if (!address) return;
    const timer = setInterval(() => refresh(address), 10_000);
    return () => clearInterval(timer);
  }, [address, refresh]);

  const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
  const num = (n: number, d = 4) => n.toLocaleString(undefined, { maximumFractionDigits: d });

  const marketLabel = mode === "spot" ? spotSel?.label ?? "—" : `${coin} ${t("퍼프", "Perp")}`;
  const baseUnit = mode === "spot" ? spotSel?.baseName ?? "" : coin;
  // Unified 계정이면 Spot USDC도 퍼프 담보 → 퍼프 모드 사용가능액은 Perp + Spot 합산.
  const usable =
    mode === "spot" ? account?.spot ?? 0 : (account?.perp ?? 0) + (account?.spot ?? 0);

  return (
    <div className="panel">
      <h2>
        {t("거래", "Trade")} — Hyperliquid{" "}
        <span
          className="neg"
          style={{ fontSize: "0.7em", letterSpacing: 1, border: "1px solid", padding: "1px 5px", borderRadius: 4 }}
        >
          TESTNET
        </span>
      </h2>
      <p className="sub" style={{ marginTop: 0 }}>
        {t(
          "MetaMask로 서명하는 테스트넷 거래(mock USDC). 주문마다 서명 팝업이 뜨며, 키는 저장되지 않습니다.",
          "MetaMask-signed testnet trading (mock USDC). Each order opens a signature popup; no key is stored."
        )}
      </p>

      {!address ? (
        <button onClick={connect} disabled={busy}>
          {busy ? t("연결 중…", "Connecting…") : t("MetaMask 연결", "Connect MetaMask")}
        </button>
      ) : (
        <>
          {/* 퍼프 / 스팟 전환 */}
          <div style={{ display: "inline-flex", gap: 4, marginBottom: 10 }}>
            {(["perp", "spot"] as Mode[]).map((m) => (
              <button
                key={m}
                className={mode === m ? undefined : "ghost"}
                onClick={() => {
                  setMode(m);
                  setNotice(null);
                  setError(null);
                }}
              >
                {m === "perp" ? t("퍼프", "Perp") : t("스팟", "Spot")}
              </button>
            ))}
          </div>

          <p className="muted" style={{ marginBottom: 8 }}>
            {short(address)}
            {account && (
              <>
                {" · "}
                <span className={mode === "perp" ? "" : "muted"} style={mode === "perp" ? { color: "var(--foreground)" } : undefined}>
                  Perp {num(account.perp, 2)}
                </span>
                {" · "}
                <span style={mode === "spot" ? { color: "var(--foreground)" } : undefined}>
                  Spot {num(account.spot, 2)}
                </span>{" "}
                USDC
                {mode === "perp" && account.szi !== 0 && (
                  <>
                    {" · "}
                    {t("포지션", "Position")}: {num(account.szi)} {coin}
                    {account.upnl != null && (
                      <span className={account.upnl >= 0 ? "pos" : "neg"}>
                        {" "}
                        (uPnL {num(account.upnl, 2)})
                      </span>
                    )}
                  </>
                )}
              </>
            )}
          </p>

          {/* Unified 계정: Spot USDC가 퍼프 담보로도 쓰이므로 이체 불필요. */}
          {mode === "perp" && account && account.perp < 1 && account.spot > 1 && (
            <p className="muted" style={{ marginTop: 0, marginBottom: 8 }}>
              {t(
                "Unified 계정에서는 Spot USDC가 퍼프 담보로도 쓰입니다 — 이체 없이 바로 주문할 수 있습니다.",
                "With a Unified account, your Spot USDC also collateralizes perps — you can order without transferring."
              )}
            </p>
          )}

          {/* 에이전트 미승인: 1회 승인 버튼. HL 주문은 MetaMask 직접 서명 불가(chainId 1337). */}
          {!agentApproved && (
            <div style={{ marginBottom: 12 }}>
              <button onClick={enableTrading} disabled={busy}>
                {busy ? t("승인 중…", "Approving…") : t("거래 활성화 (에이전트 승인)", "Enable trading (approve agent)")}
              </button>
              <p className="muted" style={{ marginTop: 6 }}>
                {t(
                  "HL 주문은 MetaMask로 직접 서명할 수 없습니다(도메인 chainId 1337). '거래 활성화'는 1회 서명으로 앱의 에이전트 키에 거래를 위임합니다 — 에이전트는 거래만 가능, 출금은 불가.",
                  "HL orders can't be signed by MetaMask directly (domain chainId 1337). 'Enable trading' delegates trading to the app's agent key with one signature — the agent can trade but cannot withdraw."
                )}
              </p>
            </div>
          )}

          {agentApproved && (
            <>
          {/* 퍼프 전용: 증거금 모드(교차/격리) + 레버리지 (HL updateLeverage) */}
          {mode === "perp" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 10 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span className="muted">{t("증거금", "Margin")}</span>
                <select
                  value={isCross ? "cross" : "isolated"}
                  disabled={onlyIsolated}
                  onChange={(e) => setIsCross(e.target.value === "cross")}
                >
                  <option value="cross">{t("교차 (Cross)", "Cross")}</option>
                  <option value="isolated">{t("격리 (Isolated)", "Isolated")}</option>
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span className="muted">
                  {t("레버리지", "Leverage")} (max {maxLev}x)
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={leverage}
                  min={1}
                  max={maxLev}
                  onChange={(e) => setLeverage(e.target.value)}
                  style={{ width: 90 }}
                />
              </label>
              <button className="ghost" onClick={applyLeverage} disabled={busy || perpIdx == null}>
                {t("레버리지 적용", "Set leverage")}
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 10 }}>
            {mode === "spot" && (
              <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span className="muted">{t("마켓", "Market")}</span>
                <select
                  value={spotSel?.assetId ?? ""}
                  onChange={(e) =>
                    setSpotSel(spotPairs.find((p) => p.assetId === Number(e.target.value)) ?? null)
                  }
                  style={{ width: 150 }}
                >
                  {spotPairs.map((p) => (
                    <option key={p.assetId} value={p.assetId}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="muted">{t("구분", "Side")}</span>
              <select value={side} onChange={(e) => setSide(e.target.value as Side)}>
                <option value="buy">{mode === "spot" ? t("매수", "Buy") : t("매수 (Long)", "Buy (Long)")}</option>
                <option value="sell">{mode === "spot" ? t("매도", "Sell") : t("매도 (Short)", "Sell (Short)")}</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="muted">
                {t("수량", "Size")} ({baseUnit})
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="0.01"
                style={{ width: 110 }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="muted">{t("지정가", "Limit price")} (USDC)</span>
              <input
                type="number"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                style={{ width: 130 }}
              />
            </label>
            <button onClick={placeOrder} disabled={busy || !orderParams()}>
              {busy ? t("처리 중…", "Working…") : t("주문", "Place order")}
            </button>
          </div>
          <p className="muted" style={{ fontSize: "0.85em", marginTop: 0 }}>
            {t("최소 주문 금액 약 $10 · ", "Minimum order value ≈ $10 · ")}
            {marketLabel}
            {size && price && Number(size) > 0 && Number(price) > 0
              ? ` · ≈ $${num(Number(size) * Number(price), 2)} / ${t("사용가능", "usable")} $${num(usable, 2)}`
              : ""}
          </p>

          {orders.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>{t("마켓", "Market")}</th>
                  <th>{t("구분", "Side")}</th>
                  <th>{t("가격", "Price")}</th>
                  <th>{t("수량", "Size")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.oid}>
                    <td>{o.coin}</td>
                    <td className={o.side === "B" ? "pos" : "neg"}>
                      {o.side === "B" ? t("매수", "Buy") : t("매도", "Sell")}
                    </td>
                    <td>{o.limitPx}</td>
                    <td>{o.sz}</td>
                    <td>
                      <button onClick={() => cancelOrder(o)} disabled={busy}>
                        {t("취소", "Cancel")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
            </>
          )}
        </>
      )}

      {notice && <p className="pos">{notice}</p>}
      {error && <p className="err">{error}</p>}
    </div>
  );
}
