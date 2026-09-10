"use client";

// Jayverse AA §3 — Markets 그리드 + 지갑 칩 + Bet 드로어의 클라이언트 셸.
// 스택은 /live/aa 에서 증명된 그대로: thirdweb Connect + ERC-4337 스마트 계정 +
// sponsorGas 페이마스터(Sepolia). 여기서는 그 능력을 no-op 이 아니라 진짜 verex
// 콜(approve + 주문)에 겨눈다 — docs/features/jayverse-rabbit.md §6.
import { ThirdwebProvider, ConnectButton, useActiveAccount, lightTheme } from "thirdweb/react";
import { sepolia } from "thirdweb/chains";
import { useMemo, useState } from "react";
import type { ThirdwebClient } from "thirdweb";
import { makeThirdwebClient } from "@/lib/thirdweb-client";
import type { AaBundlerEnv } from "@/lib/aa-bundler";
import { useLang } from "../LangContext";
import { pick } from "@/lib/i18n";
import BetDrawer from "./BetDrawer";

export type MarketCard = {
  slug: string;
  title: string;
  status: string;
  closesAt: string | null;
  outcomes: { label: string; price: number }[];
};

// /live/aa 와 같은 이유(2026-08-04): 기본 라이트 테마 버튼이 흰 배경에 묻힌다.
const connectButtonTheme = lightTheme({
  colors: { primaryButtonBg: "var(--primary)", primaryButtonText: "var(--primary-foreground)" },
});

function MarketsInner({
  markets,
  client,
  aaEnv,
  t,
}: {
  markets: MarketCard[];
  client: ThirdwebClient;
  aaEnv: AaBundlerEnv;
  t: (ko: string, en: string) => string;
}) {
  const account = useActiveAccount();
  const [selected, setSelected] = useState<MarketCard | null>(null);

  return (
    <div style={{ marginTop: 16 }}>
      {/* §3 — 상단 지갑 칩: 연결되면 스마트 계정 주소 + "Smart account" 태그로 바뀐다.
          thirdweb 이 accountAbstraction 으로 연결 자체를 스마트 계정으로 감싸므로,
          여기 보이는 주소가 곧 (counterfactual 일 수 있는) 스마트 계정 주소다. */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
        {account && (
          <span className="poc-badge poc-badge-live">{t("스마트 계정", "Smart account")}</span>
        )}
        <ConnectButton
          client={client}
          accountAbstraction={{ chain: sepolia, sponsorGas: aaEnv.sponsorGas }}
          theme={connectButtonTheme}
        />
      </div>

      {markets.length === 0 ? (
        <p className="sub" style={{ marginTop: 16 }}>
          {t("열려 있는 마켓이 없습니다.", "No open markets right now.")}
        </p>
      ) : (
        <div className="poc-grid" style={{ marginTop: 16 }}>
          {markets.map((m) => (
            <div key={m.slug} className="panel">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong>{m.title}</strong>
                <span className="poc-badge poc-badge-live" title={t("가스는 페이마스터가 냅니다", "Gas paid by the paymaster")}>
                  ⛽ gasless
                </span>
              </div>
              <p className="sub" style={{ marginTop: 6, fontSize: 13 }}>
                {m.outcomes.map((o, i) => (
                  <span key={o.label}>
                    {i > 0 && " / "}
                    {o.label} <b>{o.price.toFixed(2)}</b>
                  </span>
                ))}
              </p>
              {m.closesAt && (
                <p className="sub" style={{ marginTop: 4, fontSize: 12 }}>
                  {t("마감 ", "Closes ")}
                  {new Date(m.closesAt).toLocaleDateString()}
                </p>
              )}
              <button type="button" style={{ marginTop: 8 }} onClick={() => setSelected(m)}>
                {t("베팅", "Bet")}
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <BetDrawer market={selected} client={client} aaEnv={aaEnv} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

export default function MarketsClient({
  markets,
  clientId,
  aaEnv,
}: {
  markets: MarketCard[];
  clientId: string;
  aaEnv: AaBundlerEnv;
}) {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  const client = useMemo(() => (clientId ? makeThirdwebClient(clientId) : null), [clientId]);
  if (!client) {
    return (
      <p className="sub" style={{ marginTop: 16, color: "#dc2626" }}>
        {t(
          "thirdweb 클라이언트 ID가 설정되지 않아 베팅을 실행할 수 없습니다 (THIRDWEB_CLIENT_ID).",
          "Betting cannot run: the thirdweb client ID is not configured (THIRDWEB_CLIENT_ID).",
        )}
      </p>
    );
  }
  return (
    <ThirdwebProvider>
      <MarketsInner markets={markets} client={client} aaEnv={aaEnv} t={t} />
    </ThirdwebProvider>
  );
}
