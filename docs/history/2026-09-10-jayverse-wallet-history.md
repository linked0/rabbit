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
