"use client";

// Jayverse AA §3 — Bet 드로어: 아웃컴 토글, 금액, 상태 머신
// (idle → signing → bundling → success / error). 설계: docs/features/jayverse-rabbit.md §3·§4.
//
// 견적/calldata 는 /api/markets/quote 가 서버에서 조립한다. 여기서는 그 두 콜을
// lib/aa-bet.ts 로 넘겨 하나의 UserOperation(executeBatch)로 보낼 뿐이다.
// 배치가 원자적이므로 error 상태는 곧 "아무것도 지출되지 않았다"는 뜻이다.
import { useMemo, useState } from "react";
import { useActiveAccount, useAdminWallet, ConnectButton, lightTheme } from "thirdweb/react";
import { sepolia } from "thirdweb/chains";
import type { ThirdwebClient } from "thirdweb";
import { sendAaBet, type EncodedCall } from "@/lib/aa-bet";
import type { AaBundlerEnv } from "@/lib/aa-bundler";
import type { VerexQuote } from "@/lib/verex-client";
import { useLang } from "../LangContext";
import { pick } from "@/lib/i18n";
import { fetchJson } from "../live/agent/console/fetchJson";
import type { MarketCard } from "./MarketsClient";

type QuoteResponse = {
  error?: string;
  quote: VerexQuote;
  calls: EncodedCall[];
};

type Step =
  | { step: "idle" }
  | { step: "signing" }
  | { step: "bundling"; userOpHash: `0x${string}` }
  | { step: "success"; userOpHash: `0x${string}`; txHash: `0x${string}`; quote: VerexQuote }
  | { step: "error"; message: string };

const connectButtonTheme = lightTheme({
  colors: { primaryButtonBg: "var(--primary)", primaryButtonText: "var(--primary-foreground)" },
});

export default function BetDrawer({
  market,
  client,
  aaEnv,
  onClose,
}: {
  market: MarketCard;
  client: ThirdwebClient;
  aaEnv: AaBundlerEnv;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  const account = useActiveAccount(); // 스마트 계정 (counterfactual 포함)
  const adminWallet = useAdminWallet(); // 그 소유자 — MetaMask EOA, UserOp 에 서명한다
  const [outcomeIdx, setOutcomeIdx] = useState(0);
  const [amount, setAmount] = useState("5");
  const [state, setState] = useState<Step>({ step: "idle" });

  const outcome = market.outcomes[outcomeIdx];
  const usdc = Number(amount);
  // §3 "live cost/price" — 카드가 이미 아는 가격으로 즉석 계산. 확정 견적(호가 mid)은
  // 제출 시점에 /api/markets/quote 가 다시 낸다 — 화면용과 체결용을 섞지 않는다.
  const shares = useMemo(
    () => (usdc > 0 && outcome && outcome.price > 0 ? usdc / outcome.price : 0),
    [usdc, outcome],
  );
  const busy = state.step === "signing" || state.step === "bundling";

  async function placeBet() {
    const adminAccount = adminWallet?.getAccount();
    if (!account || !adminAccount || !outcome || !(usdc > 0)) return;
    try {
      setState({ step: "signing" });
      const q = await fetchJson<QuoteResponse>(
        `/api/markets/quote?slug=${encodeURIComponent(market.slug)}&outcome=${encodeURIComponent(outcome.label)}&usdc=${usdc}&account=${account.address}`,
      );
      if (q.error) throw new Error(q.error);
      const result = await sendAaBet({
        client,
        adminAccount,
        env: aaEnv,
        calls: q.calls,
        onPhase: (p) => {
          if (p.phase === "bundling") setState({ step: "bundling", userOpHash: p.userOpHash });
        },
      });
      setState({ step: "success", userOpHash: result.userOpHash, txHash: result.transactionHash, quote: q.quote });
    } catch (e) {
      setState({ step: "error", message: String(e instanceof Error ? e.message : e) });
    }
  }

  return (
    <>
      {/* 카드 위로 열리는 드로어(§3) — 배경을 눌러 닫는다. */}
      <div
        onClick={busy ? undefined : onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 40 }}
      />
      <div
        className="panel"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(400px, 92vw)",
          zIndex: 41,
          overflowY: "auto",
          borderRadius: 0,
          background: "var(--background, #fff)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <strong>{market.title}</strong>
          <button type="button" onClick={onClose} disabled={busy} aria-label="close">
            ✕
          </button>
        </div>

        {/* 아웃컴 토글 */}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {market.outcomes.map((o, i) => (
            <button
              key={o.label}
              type="button"
              disabled={busy}
              onClick={() => setOutcomeIdx(i)}
              style={{
                flex: 1,
                fontWeight: i === outcomeIdx ? 700 : 400,
                outline: i === outcomeIdx ? "2px solid var(--primary)" : "none",
              }}
            >
              {o.label} {o.price.toFixed(2)}
            </button>
          ))}
        </div>

        {/* 금액 + 라이브 비용/가격 */}
        <div style={{ marginTop: 12 }}>
          <label className="sub" style={{ fontSize: 13 }}>
            {t("금액 (USDC)", "Amount (USDC)")}
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={amount}
            disabled={busy}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: "100%", marginTop: 4 }}
          />
          {outcome && usdc > 0 && (
            <p className="sub" style={{ marginTop: 6, fontSize: 13 }}>
              {t("예상: ", "Est.: ")}
              <b>{shares.toFixed(2)}</b> {outcome.label} @ {outcome.price.toFixed(2)} ·{" "}
              {t("비용 ", "cost ")}
              {usdc.toFixed(2)} USDC
            </p>
          )}
        </div>

        {/* §3 — 상태에 따라 라벨이 바뀌는 프라이머리 버튼 */}
        <div style={{ marginTop: 16 }}>
          {!account ? (
            <ConnectButton
              client={client}
              accountAbstraction={{ chain: sepolia, sponsorGas: aaEnv.sponsorGas }}
              theme={connectButtonTheme}
              connectButton={{ label: t("지갑 연결", "Connect wallet") }}
            />
          ) : aaEnv.mode === "self-relay" ? (
            <>
              <button type="button" disabled style={{ width: "100%" }}>
                {t("로컬 모드 — 브라우저 경로 없음", "Local mode — no browser path")}
              </button>
              <p className="sub" style={{ marginTop: 6, fontSize: 12 }}>
                {t(
                  "AA_MODE=local 에서는 번들러가 없습니다. `node scripts/aa-self-relay.mjs` 로 anvil 에서 UserOp 를 직접 릴레이하세요 (§7).",
                  "AA_MODE=local has no bundler. Relay the UserOp on anvil yourself with `node scripts/aa-self-relay.mjs` (§7).",
                )}
              </p>
            </>
          ) : state.step === "success" ? (
            <button type="button" style={{ width: "100%" }} onClick={() => setState({ step: "idle" })}>
              {t("다시 베팅", "Bet again")}
            </button>
          ) : (
            <button type="button" style={{ width: "100%" }} disabled={busy || !(usdc > 0)} onClick={placeBet}>
              {state.step === "signing"
                ? t("서명 대기 — MetaMask 를 확인하세요…", "Waiting for signature — check MetaMask…")
                : state.step === "bundling"
                  ? t("가스 스폰서 중 & 제출 중…", "Sponsoring gas & submitting…")
                  : state.step === "error"
                    ? t("다시 시도", "Retry")
                    : t("베팅하기 (가스리스)", "Place bet (gasless)")}
            </button>
          )}
        </div>

        {/* 진행/결과 표시 */}
        {state.step === "bundling" && (
          <p className="sub" style={{ marginTop: 8, fontSize: 12, wordBreak: "break-all" }}>
            UserOp: {state.userOpHash}
          </p>
        )}
        {state.step === "success" && (
          <div className="panel" style={{ marginTop: 12 }}>
            <strong>
              {t("베팅 완료 — ", "Bet placed — ")}
              {state.quote.usdc.toFixed(2)} USDC · {state.quote.outcome} @ {state.quote.price.toFixed(2)}
            </strong>
            <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
              {t("가스는 Jayverse 가 냈습니다.", "Gas paid by Jayverse.")}{" "}
              <a
                href={`https://jiffyscan.xyz/userOpHash/${state.userOpHash}?network=sepolia`}
                target="_blank"
                rel="noreferrer"
              >
                {t("UserOp 보기", "View UserOp")} ↗
              </a>{" "}
              ·{" "}
              <a href={`https://sepolia.etherscan.io/tx/${state.txHash}`} target="_blank" rel="noreferrer">
                {t("트랜잭션 보기", "View tx")} ↗
              </a>
            </p>
          </div>
        )}
        {state.step === "error" && (
          <p className="sub" style={{ marginTop: 8, color: "#dc2626", fontSize: 13 }}>
            {state.message}
            <br />
            {t("배치는 원자적입니다 — 아무것도 지출되지 않았습니다.", "The batch is atomic — nothing was spent.")}
          </p>
        )}

        <p className="sub" style={{ marginTop: 16, fontSize: 12 }}>
          {t(
            "가스는 Jayverse 가 스폰서합니다 · approve + 주문이 한 번의 서명에 담깁니다.",
            "Gas sponsored by Jayverse · approve + trade in one signature.",
          )}
        </p>
      </div>
    </>
  );
}
