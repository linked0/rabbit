# 2026-09-10 — jayverse-auditor 작업 이력

> 소스 문서: [docs/features/jayverse-auditor.md](../features/jayverse-auditor.md) ·
> 허브 [README-Jayverse.md](../features/README-Jayverse.md)
> 저장소: `~/work/jayverse-auditor` (Phase 1 — evaluate(config) → 권한 행렬, 전부 doc-only)

### hydration 에러 수정 — 렌더 시점 타임스탬프

**Cause:** jay 가 "Hydration failed" 스크린샷 보고 — 서버 `…29.492Z` vs 클라이언트 `…29.612Z`.

**Reasoning:** `evaluate()`가 `generatedAt: new Date().toISOString()`을 렌더 중에 찍으므로 SSR
패스와 hydration 패스가 **구조적으로** 밀리초 차이. 데이터 버그가 아니라 불가피한 불일치 —
React 공인 탈출구는 해당 텍스트 노드의 `suppressHydrationWarning`.

**Change:** `components/Auditor.tsx`의 Generated `<p>`에 `suppressHydrationWarning` + 이유 주석.

**Result:** tsc 클린, vitest 33/33, 라이브 dev 서버(3080)에서 hydration 메시지 0건 확인.

### Authority matrix 마지막 열 잘림 — table-layout: fixed

**Cause:** jay: "표에 고정 폭이 필요한가? 마지막 열이 잘린다."

**Reasoning:** 스크롤 래퍼는 이미 있었으나 auto 레이아웃 표가 `sign.backend.session-key` 같은
안 끊기는 토큰에 맞춰 열을 넓혀 뷰포트를 초과 — macOS 는 스크롤 전까지 스크롤바를 안 보여줘
"잘림"으로 보임. 해법은 고정 픽셀 폭이 아니라 **fixed 레이아웃 + 토큰 줄바꿈**.

**Change:** `MatrixTable.tsx`: 표에 `tableLayout:"fixed"`, 셀에 `overflowWrap:"anywhere"`,
행 헤더의 `nowrap` 제거. `minWidth:720` + 스크롤 래퍼는 좁은 화면 안전장치로 유지.

**Result:** 1440px 에서 `tableWidth === wrapperWidth`, overflow 없음 — User~Nobody 여섯 열
전부 화면 안, Playwright 측정·스크린샷 검증.

### 프리셋 설정 뷰어 — 입력을 검사 가능하게

**Cause:** jay: "선택 목록 옆에서 프리셋의 실제 값을 보고 싶다. 엔진은 어떻게 표를 만드나?"

**Reasoning:** 행렬은 그 설정 객체에서만 계산되므로(순수 함수 evaluate), 피커 옆에 원본 JSON 을
보여주는 것이 도구의 입력을 검사 가능하게 만드는 최소 장치.

**Change:** `Auditor.tsx` 프리셋 탭에 기본 펼침 `<details>` + `JSON.stringify(config)` 패널.

**Result:** 프리셋 전환 시 JSON 동기 갱신 확인(Playwright). 엔진 설명은 대화로 전달:
6액션×5액터 이중 루프 → `resolveVerdict` 중첩 switch → 규칙 id/판정/메모 → 심각도 → 최악 우선
정렬. 미해결/다음: Phase 3 viem 온체인 검증(업그레이드 행 우선), "영원히-신뢰-필요" 제3 라벨,
단독-유계 vs 단독-무한 심각도 구분.

*모든 변경 미커밋 — jay 리뷰 대기.*
