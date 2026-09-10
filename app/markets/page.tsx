import Nav from "../Nav";
import BackLink from "../BackLink";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { verex } from "@/lib/verex-client";
import { aaBundlerEnv } from "@/lib/aa-bundler";
import { LazyMarkets } from "./LazyMarkets";
import type { MarketCard } from "./MarketsClient";

// Jayverse AA — Markets 그리드 + Bet 드로어. 설계: docs/features/jayverse-rabbit.md §3.
//
// 마켓 목록은 서버에서 verex REST 로 읽어 내려보낸다(콘솔과 같은 이유 — VEREX_API_URL
// 은 서버 설정이고 CORS 도 닫혀 있다). 견적/calldata 만 /api/markets/quote 로 오간다.
export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const lang = getLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);

  let markets: MarketCard[] = [];
  let marketsError: string | null = null;
  try {
    markets = (await verex.markets())
      .filter((m) => m.status === "open")
      .map((m) => ({
        slug: m.slug,
        title: m.title,
        status: m.status,
        closesAt: m.closesAt,
        outcomes: m.outcomes.map((o) => ({ label: o.label, price: o.price })),
      }));
  } catch (e) {
    marketsError = String(e instanceof Error ? e.message : e);
  }

  return (
    <>
      <Nav />
      <main>
        <BackLink lang={lang} href="/" ko="홈" en="Home" />
        <h1>{t("Markets — 가스리스 원클릭 베팅", "Markets — gasless one-click bets")}</h1>
        <p className="sub" style={{ maxWidth: 620 }}>
          {t(
            "verex 마켓에 ERC-4337 스마트 계정으로 베팅합니다 — approve + 주문이 하나의 UserOperation 으로 묶이고(원자적), 가스는 페이마스터가 대신 냅니다. Sepolia ETH 가 0 이어도 됩니다.",
            "Bet on verex markets with an ERC-4337 smart account — approve + order ride one UserOperation (atomic), and a paymaster covers gas. Zero Sepolia ETH required.",
          )}
        </p>
        {marketsError ? (
          <div className="panel" style={{ marginTop: 16 }}>
            <strong>{t("verex 마켓을 불러오지 못했습니다", "Could not load verex markets")}</strong>
            <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
              {marketsError} —{" "}
              {t("VEREX_API_URL 이 가리키는 verex API 가 살아 있는지 확인하세요.", "check that the verex API behind VEREX_API_URL is up.")}
            </p>
          </div>
        ) : (
          <LazyMarkets
            markets={markets}
            clientId={process.env.THIRDWEB_CLIENT_ID ?? process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ?? ""}
            aaEnv={aaBundlerEnv()}
          />
        )}
      </main>
    </>
  );
}
