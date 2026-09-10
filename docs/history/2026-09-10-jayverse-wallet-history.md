# 2026-09-10 — jayverse-wallet 작업 이력

> 소스 문서: [docs/features/jayverse-wallet.md](../features/jayverse-wallet.md)
> (§Next phase — our own dev wallet · §Four-page UI — implemented)
> 저장소: `~/work/jayverse-wallet`

### 4페이지 UI — "MetaMask 보다 단순하게"를 화면에 인코딩

**Cause:** jay 스펙: "MetaMask 가 복잡해서 만드는 지갑. 페이지 넷 — 계정 목록, 계정 상세,
Traded, 네트워크 설정. 메뉴는 전부 상단." 기존 simulate-before-sign 기능은 유지할 것.

**Reasoning:** 상세는 탭이 아니라 목록에서 진입시켜 메뉴가 넷을 넘지 않게. 원래 기능은 두 겹으로
보존 — `/demo` 탭으로 옮기고, Send 플로우의 프리뷰 엔진으로 재사용(모든 전송이 서명 전에
`/api/simulate` 프리뷰를 통과). 네트워크 설정은 env 소유로 고정 — "클릭으로 바뀌는 네트워크는
피싱으로도 바뀐다."

**Change:** `components/TopNav.tsx`, `app/accounts/`, `app/accounts/[address]/`(Send:
Preview → 효과·경고·가스 → Sign & send, 리버트 예상 시 서명 차단, 지갑 외 주소는 watch-only),
`app/traded/`(최근 300블록 직접 스캔, 구간 표기), `app/network/`(RPC/chainId 실측 + 테스트 버튼),
루트 `/` → `/accounts` 리다이렉트, 기존 데모 → `app/demo/`.

**Result:** tsc 클린. Playwright E2E 전부 통과: 리다이렉트 → 10계정 잔액 → #2 상세 →
0.25 ETH 프리뷰(-0.25 ETH·value-drain·gas 21000) → Sent ✓ → Traded 에 #2→#3 행 →
Network Connected ✓(11155111) → 데모 탭 보존. 문서에 "Four-page UI — implemented" 섹션 추가.

### 사용 계정 선택 — 홈 목록이 곧 선택기

**Cause:** jay: "홈에 주소록/계정 목록을 두고 사용할 계정을 선택하게."

**Reasoning:** 별도 위젯 대신 목록 행에 Use 버튼 — MetaMask 계정 피커를 눈에 보이는 단일 선택으로
축약. 선택은 localStorage 저장 + 커스텀 이벤트로 탭 간 동기화, 상단 메뉴 칩으로 전 페이지 상시 표시.

**Change:** `lib/active-account.ts`(useActiveAccount 훅), Accounts 행에 Use 버튼/"In use ✓"
배지/테두리 강조, TopNav 에 "In use: #N 0x…" 칩(클릭 시 해당 상세로).

**Result:** Playwright: #2 선택 → 칩 표시 → 새로고침 후 유지 ✓. 문서 테스트 케이스에 7단계로 추가.

### 익스텐션 아이콘 — J 타일 + 프리뷰 체크

**Cause:** jay: "익스텐션에 제대로 된 이미지도."

**Reasoning:** simulate-before-sign 정체성을 아이콘으로 — 인디고 라운드 타일 + 흰 J + 초록 체크
배지. 벡터(SVG)로 그려 headless Chrome 렌더로 16/48/128 PNG 생성(외부 에셋 의존 없음).

**Change:** `extension/icons/icon{16,48,128}.png`, manifest 에 `icons` + `action.default_icon`,
`build.mjs`가 icons/ 를 dist/ 로 복사.

**Result:** `pnpm build:ext` 성공, dist/icons 포함 — Chrome 로드 시 회색 플레이스홀더 대신
실제 아이콘. *같은 저장소의 다른 세션 슬라이스(로컬 계정·31337 서명·암호화 볼트·MV3 커넥터·7702)는
건드리지 않음. 모든 변경 미커밋 — jay 리뷰 대기.*

---

### 설계 문서에 Phase 4(자체 개발 지갑) — "다음 단계"로 논의 정리 (rabbit 세션)

**Cause:** jay(다른 세션): "지갑 프로젝트에서 논의한 걸 jayverse-wallet.md 에 next phase 로 정리해줘."
_(위 슬라이스 작업과는 별개 세션 — 이쪽은 rabbit 저장소의 설계 문서만 만짐.)_

**Reasoning:** 기존 3 Phase(simulate-before-sign 중심)와 성격이 다른 별도 이니셔티브라 —
MetaMask 를 테스트용으로 대체하는 자체 지갑 — Phase 4 로 표에 한 줄 추가하고 상세 절을 따로 뒀다.
핵심은 하나의 결정: Sepolia 를 포크하되 **다른 chainId 31337 로 보고**하면 (a)MetaMask 의
11155111 락이 풀리고 (b)서명이 실제 Sepolia 로 리플레이되지 않는다(EIP-712·7702 가 chainId 포함).

**Change:** `rabbit/docs/features/jayverse-wallet.md` — Phases 표에 Phase 4 행, 그리고
"Next phase — our own dev wallet" 절 신설: 왜 만드는가, 31337 포크 결정, 구현된 Slice 1–4,
보류(anvil 7702 확인·7710/7715 그랜트+type-4 제출), DEV/TESTNET 전용 가드레일.

**Result:** rabbit `main` 병합·푸시(문서 전용). docs HTML 미러 자동 재생성. jayverse-wallet
저장소 코드는 이 세션에서 건드리지 않음.

### chainId 불일치 해소 — 자체 지갑 체인에 전용 노드(8546)

**Cause:** jay 스크린샷 — 익스텐션은 31337 고정인데 8545 anvil 은 11155111 보고, "chainid 가 안 맞는다."

**Reasoning:** 31337 핀은 보안 결정(Sepolia 리플레이 차단)이라 노드에 맞춰 적응하면 안 됨. 물리
노드가 하나뿐인 게 문제 — 자체 지갑 체인에 **전용 anvil(8546, 31337)**을 주면 11155111 포크와
공존. 불일치는 숨기지 않고 **표시**: 팝업·Network 페이지가 노드를 라이브 프로브.

**Change:** extension config RPC → 8546 + 팝업에 nodeStatus() 프로브(일치 ✓ / 불일치 ⚠+실행
명령 / 도달 불가), `lib/chain.ts`에 `LOCAL_RPC_URL`(기본 8546, env 오버라이드) 추가·localTestChain
연결, `lib/wallet.ts` 로컬 서명 경로 2곳 8546 으로, Network 페이지를 두 노드 카드(각각 라이브
프로브 + 시작 명령)로 재작성, 설치 문서 3단계에 `--port 8546` 반영.

**Result:** `anvil --fork-url http://127.0.0.1:8545 --port 8546 --chain-id 31337` 기동 후 두
카드 모두 Connected ✓ (11155111 / 31337) — Playwright 검증. 팝업 프로브는 익스텐션 리로드 후 표시.

### 네트워크 관리자 — 사용자 목록 + 선택이 전 페이지를 관통

**Cause:** jay: "사용자가 네트워크를 추가하고, 목록이 유지되고, 하나를 선택할 수 있어야."

**Reasoning:** 이전의 env 고정(피싱 가드)을 jay 지시로 완화하되 정직함은 유지 — 모든 행이 노드를
라이브 프로브해 connected/mismatch/unreachable 을 표시하고, 저장된 chainId 가 서명 기준이라
Detect 버튼이 노드에서 직접 읽어 채움. 빌트인 둘(8545 포크·8546 자체 노드)은 삭제 불가 —
지갑이 항상 돌아갈 바닥을 보장.

**Change:** `lib/networks.ts`(useNetworks: localStorage 목록+선택, chainFor/clientFor),
Network 페이지 재작성(행별 프로브/Use/remove + Add 폼 + Detect), Accounts·상세(Send 의
체인/RPC·simulate rpcUrl)·Traded 가 선택 네트워크로 읽기, TopNav 에 네트워크 칩.

**Result:** tsc 클린. Playwright: 빌트인 2행 connected ✓ → 커스텀 추가(Detect 가 11155111
자동 감지) → 즉시 선택·내비 칩 반영 → Accounts 가 선택 네트워크로 잔액 로드 → remove 동작.

### 익스텐션 네트워크 전환 — 팝업 셀렉터 + chainChanged 브로드캐스트 (v0.2.0)

**Cause:** jay: "익스텐션에서도 사용자가 네트워크를 바꿀 수 있게. 버전도 올려."

**Reasoning:** 웹 앱의 localStorage 는 오리진이 달라 못 읽으므로 익스텐션은 chrome.storage.local
에 자기 목록(빌트인 둘 + 커스텀)을 유지. 31337 고정 핀은 풀리지만 정직함으로 대체 — 실제 공개
chainId(11155111 등) 선택 시 팝업에 "signatures ARE replayable" 경고, 노드 라이브 프로브 유지.
추가 시 chainId 는 입력이 아니라 **노드에서 자동 감지**(노드가 진실의 원천).

**Change:** `extension/src/networks.ts`(storage 목록/선택/REAL_CHAIN_IDS), background 를 요청
시점 네트워크 해석으로 전환(eth_chainId/net_version/sendTransaction/RPC 프록시), storage.onChanged
→ 전 탭에 표준 `chainChanged` 이벤트 브로드캐스트(content 가 페이지로 중계, inpage 의 기존 emit
경로 사용), `wallet_switchEthereumChain` 은 목록 내 체인이면 허용·아니면 목록 안내 에러, 팝업에
셀렉터/추가 폼/커스텀 삭제, manifest 0.1.0 → **0.2.0**.

**Result:** tsc 클린, build:ext 성공(dist 에 v0.2.0·리스너 번들 확인). 자동 브라우저 검증은
불가 — 브랜드 Chrome 137+ 가 --load-extension 을 차단(Playwright 한계, 코드 문제 아님) —
수동 확인 경로: 확장 리로드 → 팝업 셀렉터로 전환 → 연결된 dapp 이 chainChanged 수신.

### JayverseSign 위젯 — 로컬 계정을 11155111 포크로도 연결

**Cause:** jay 스크린샷 + "11155111용 버튼 하나 더."

**Change:** `useJayverseWallet`에 `connectLocalAccountOnFork(index)`(같은 dev 서명자, 체인은
anvil 11155111/8545) 추가, 위젯 피커 행에 "Use local test account (11155111)" 버튼 —
툴팁에 "Sepolia 모양 서명, dev 키 전용" 명시.

**Result:** tsc 클린. Playwright: #4 선택 → 버튼 클릭 → 포크에서 주소·잔액 연결 확인.
