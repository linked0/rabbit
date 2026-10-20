// 시세 카드 한 장 = 한 줄. Pyth 우선, Yahoo 폴백.
//
// 심볼은 **추측하지 않고** jay 의 키로 직접 조회해 확인했다 (2026-10-20,
// `node scripts/pyth-feeds.mjs <질의>`). 확인 결과 중 기억해 둘 것:
//   - KOSPI **종합지수**는 Pyth 에 없다. 대신 **KOSPI 200 = Equity.Index.KR200/KRW** 가 있다.
//   - 삼성전자·SK하이닉스는 종목코드로 찾는다: Equity.KR.005930/KRW, Equity.KR.000660/KRW.
//     이름("Samsung"/"Hynix")으로는 안 걸린다 — 단, USD 표시 지수 상품이 따로 있다
//     (Equity.Index.SAMSUNG/USD, Equity.Index.SKHY/USD).
//   - S&P 500 = Equity.Index.US500/USD, 나스닥 100 = Equity.Index.US100/USD.
//     "SPX"/"NAS100"/"NDX" 는 전부 빗나간다(SPX 는 Crypto.SPX6900, NDX 는 BNDX 채권 ETF).
//   - 그 밖에 보이는 것: US30, JP225/JPY, EWY/USD(한국 ETF), 개별주 Equity.Index.*/USD.
// 피드 id 를 하드코딩하지 않는 이유는 lib/pyth.ts 주석 참고(Stable/Beta 채널이 id 를 달리 준다).

export type FeedSpec = {
  key: string;
  name: string;
  nameEn: string;
  group: "crypto" | "equity" | "metal" | "korea";
  /** Pyth 심볼 후보 — 앞에서부터 처음 해석되는 것을 쓴다. 전부 조회로 확인된 표기. */
  pyth?: string[];
  /** Pyth 가 없거나 인증이 막히면 쓰는 Yahoo chart 심볼 (키 불필요). */
  yahoo?: string;
  currency: string;
  /** 24/7 이 아닌 시장 — 장이 닫히면 publishTime 이 멈춘다. stale 로 표시하고 죽음으로 보지 않는다. */
  marketHours?: boolean;
};

export const FEEDS: FeedSpec[] = [
  // 24/7
  // 암호자산·금속에도 Yahoo 심볼을 적어 둔다. Pyth 권한이 아직 없으면(403 Not entitled)
  // 이 카드들이 통째로 사라지는데, BTC·ETH 는 전부터 있던 카드다 — 폴백 없이 바꾸면 기능이
  // 줄어든다. 권한이 붙는 순간 자동으로 Pyth 로 올라간다.
  { key: "btc", name: "비트코인", nameEn: "Bitcoin", group: "crypto", pyth: ["Crypto.BTC/USD"], yahoo: "BTC-USD", currency: "USD" },
  { key: "eth", name: "이더리움", nameEn: "Ethereum", group: "crypto", pyth: ["Crypto.ETH/USD"], yahoo: "ETH-USD", currency: "USD" },
  { key: "sol", name: "솔라나", nameEn: "Solana", group: "crypto", pyth: ["Crypto.SOL/USD"], yahoo: "SOL-USD", currency: "USD" },

  // US 지수
  { key: "us500", name: "S&P 500", nameEn: "S&P 500", group: "equity", pyth: ["Equity.Index.US500/USD"], yahoo: "^GSPC", currency: "USD", marketHours: true },
  { key: "us100", name: "나스닥 100", nameEn: "Nasdaq 100", group: "equity", pyth: ["Equity.Index.US100/USD"], yahoo: "^NDX", currency: "USD", marketHours: true },

  // 금속
  // Yahoo 쪽은 현물이 아니라 선물(GC=F, SI=F)이다 — Pyth 의 XAU/XAG 현물과 값이 조금 다르다.
  // 카드에 source 가 찍히니 어느 쪽을 보고 있는지는 구분된다.
  { key: "xau", name: "금", nameEn: "Gold", group: "metal", pyth: ["Metal.XAU/USD"], yahoo: "GC=F", currency: "USD", marketHours: true },
  { key: "xag", name: "은", nameEn: "Silver", group: "metal", pyth: ["Metal.XAG/USD"], yahoo: "SI=F", currency: "USD", marketHours: true },

  // 한국 (jay 요청, 2026-10-20)
  { key: "kr200", name: "코스피 200", nameEn: "KOSPI 200", group: "korea", pyth: ["Equity.Index.KR200/KRW"], yahoo: "^KS11", currency: "KRW", marketHours: true },
  { key: "samsung", name: "삼성전자", nameEn: "Samsung Elec.", group: "korea", pyth: ["Equity.KR.005930/KRW"], yahoo: "005930.KS", currency: "KRW", marketHours: true },
  { key: "hynix", name: "SK하이닉스", nameEn: "SK Hynix", group: "korea", pyth: ["Equity.KR.000660/KRW"], yahoo: "000660.KS", currency: "KRW", marketHours: true },
];

export const FEED_ORDER = FEEDS.map((f) => f.key);
