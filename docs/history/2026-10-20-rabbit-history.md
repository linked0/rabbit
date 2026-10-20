# rabbit — 2026-10-20

Source: jay's request in chat (no design doc). 관련: `docs/features/README.md` (상단 IA),
`docs/tasks/current-plan.md` §7 (2026-08-03 에 마켓을 PoCs 허브로 내린 결정 — 오늘 되돌린다).

## Added
- 상단 메뉴 **시장 / Markets → `/market`** (`ALLOW_MARKET`, pub). 2026-08-03 에 PoCs 허브
  카드로 내렸던 것을 되돌림 — 지수 카드가 Pyth 로 바뀌면서 데모가 아니라 매일 보는 화면이 됐다.
- `lib/pyth.ts` — Hermes 클라이언트(베어러 인증, 심볼→피드 id 런타임 해석 + 캐시, 가격 디코딩,
  Benchmarks 24h 기준점). `lib/market-feeds.ts` — 카드 선언(소스별), `scripts/pyth-feeds.mjs` — 심볼 확인 도구.
- 카드 10장: BTC · ETH · SOL / S&P 500 · 나스닥 100 / 금 · 은 / 코스피 200 · 삼성전자 · SK하이닉스.

## Done
- `/api/indices` 를 Pyth 1차 + Yahoo 폴백으로 교체(기존 CoinGecko + Yahoo). 응답 모양은 유지.
- `NavLinks` 활성 판정 경계 버그 수정.

### 상단 "시장" 메뉴 + 지수 카드를 Pyth 로

- **Cause:** jay — "add some important indices into Rabbit by adding Markets top menu through Pyth".
- **Reasoning:** 먼저 레포를 봤더니 세 조각이 **이미** 있었다. `/market`(Hyperliquid 오더북 + 주요
  지수, `<IndexCards/>` 를 이미 렌더), `/markets`(Jayverse AA 예측 마켓), `/api/indices`(CoinGecko +
  Yahoo 4종). 그래서 새 페이지를 만들지 않고 기존 `/market` 을 메뉴에 올리고 데이터 소스만 바꾸는
  쪽을 택했다(jay 확인). 피드 id 는 **하드코딩하지 않는다** — Pyth 는 Stable/Beta 채널에서 같은
  피드에 다른 id 를 주기 때문에 심볼로 선언하고 런타임에 한 번 해석해 캐시한다.
- **Change:** 위 Added/Done. 심볼은 추측하지 않고 jay 의 키로 직접 조회해 확정했다 —
  **S&P 500 = `Equity.Index.US500/USD`**, **나스닥 100 = `Equity.Index.US100/USD`**
  (`SPX` 는 `Crypto.SPX6900`, `NDX` 는 채권 ETF `BNDX` 로 빗나간다), **KOSPI 종합지수는 Pyth 에
  없고 KOSPI 200 = `Equity.Index.KR200/KRW`** 가 있다, 삼성전자/SK하이닉스는 종목코드로
  `Equity.KR.005930/KRW` · `Equity.KR.000660/KRW`(이름으로는 안 걸린다). 그 밖에 US30 · JP225/JPY ·
  EWY/USD 와 개별주 `Equity.Index.*/USD` 가 보인다.
- **Result:** 열 장 모두 실데이터로 렌더 확인(dev 3999, `/api/indices`). 다만 **지금은 전부
  `source: "yahoo"`** 다 — jay 의 Pyth 키는 검색은 되는데 가격 조회가 `403 Not entitled
  (no grant accepts this feed)` 로 막힌다. 플랜에 asset type grant 가 붙으면 코드 변경 없이
  Pyth 로 올라간다. 그래서 암호자산·금속에도 Yahoo 심볼을 적어 뒀다 — 폴백이 없으면 BTC·ETH
  카드가 통째로 사라져 기능이 줄었을 것이다.
- **Gotcha 둘:** ① Hermes 의 권한 거부는 **JSON 이 아닌 평문**으로 와서 `res.json()` 이
  SyntaxError 로 터진다 — 항상 text 로 먼저 읽는다. ② `NavLinks` 의 활성 판정이
  `pathname.startsWith(href)` 여서 `/markets` 에 있어도 `/market` 메뉴가 켜졌다. 경계(`=== href ||
  startsWith(href + "/")`)로 고쳤다 — 접두사가 겹치는 형제 경로가 생기면 반드시 나는 버그다.
- **또 하나:** 24h 변화율은 Hermes `latest` 에 없다(현재가뿐). Benchmarks 로 24시간 전 한 점을
  받아 계산하고, **못 받으면 비워 둔다** — 전에는 `?? 0` 이라 못 구한 값이 `0.00%`(= 안 움직였다)로
  보였다. `/summary` 는 원래의 네 장만 유지하도록 `only` prop 을 받는다(요약 화면이 갑자기 10장이
  되지 않게).
