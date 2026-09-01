# 2026-08-31 — rabbit 작업 이력

> 소스 문서: [docs/tasks/current-plan.md](../tasks/current-plan.md) — J2 / R-A(mandate)의 서명 경로.
> 직전 항목은 [2026-08-26-rabbit-history.md](2026-08-26-rabbit-history.md)이고, 그 글의 마지막 문장
> "**미확인 하나:** MetaMask가 31337에서…"가 오늘 측정으로 닫혔다. 브랜치: `claude/sepolia-fork-setup`.

### ERC-7715 지원 체인 목록을 실제로 물어봤다 — 31337은 없고, 11155111은 있다

**Cause:** 8/26 결정(옵션 c2)의 근거는 "MetaMask가 31337을 지원 목록에 들고 있지 **않을 가능성이 높다**"였다.
`lib/delegation.ts` 상단과 `deploy-delegation.mjs` 주석 모두 유보형으로 적혀 있었고, 닷새 동안 아무도 확인하지
않은 채 그 유보가 사실처럼 인용돼 왔다. jay가 "정말 안 되는 게 맞냐"고 되물어 확인이 시작됐다.

**Reasoning:** 확인 수단은 이미 만들어져 있었다 — `MandatePanel.tsx`의 c1 프로브
(`getSupportedExecutionPermissions()`). 코드를 읽어 추론할 문제가 아니라 지갑에 물어보면 끝나는 문제였고,
그 버튼이 존재하는 이유가 정확히 이것이었다.

**Change:** 코드 변경 없음 — 브라우저에서 버튼을 눌러 응답 JSON을 받았다. 7개 권한 타입 각각이 같은 36개
chainId를 싣고 있고, `11155111`(Sepolia)은 있고 `31337`은 **어느 타입에도 없다**.

**Result:** 유보가 측정된 사실이 됐다. 동시에 더 중요한 사실이 드러났다: 우리 mandate는
`erc20-token-allowance` + `expiry` 규칙과 **정확히 같은 모양**이다. 즉 표준이 닿는 체인에서는 손으로 만들
이유가 없다. 반대로 31337에서는 CREATE2로 주소를 맞춰도 소용없다 — 확장은 주소가 아니라 chainId로 판단한다.

### Sepolia 포크에서 지갑이 실제로 권한을 발급했다 — 로컬 RPC여도 상관하지 않는다

**Cause:** 지원 목록은 정적 표라, "11155111을 지원한다"는 것과 "RPC가 127.0.0.1일 때도 발급한다"는 다른
주장이다. 후자가 참이어야 로컬에서 7715를 쓸 수 있고, 거짓이면 이전 작업 전체가 무의미해진다.

**Reasoning:** 그 호출을 하는 페이지는 저장소에 하나뿐이다(`/live/aa`, 2026-08-05 작성). J2를 고치기 전에
그 페이지를 **측정 도구로** 쓰는 것이 가장 싼 검증이었다 — 세 시간짜리 작업 전에 1분.

**Change:** `app/live/aa/SessionKeyDemo.tsx`의 `PUBLIC_SEPOLIA_RPC`를 하드코딩에서
`process.env.NEXT_PUBLIC_SEPOLIA_RPC || <공개 RPC>`로 바꿨다. 이 페이지는 운영에도 배포되므로 localhost를
박아 넣으면 방문자 브라우저가 자기 8546을 찾다가 조용히 실패한다 — 기본값은 공개 RPC 그대로 둔다.
`.env`/`.env.example`에 변수 추가.

**Result:** `anvil --fork-url $SEPOLIA_RPC --chain-id 11155111 --port 8546` 위에서 Grant가 성공했다.
지갑이 `context`와 함께 DelegationManager `0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3`를 돌려줬다 —
SDK 표·포크 온체인 코드와 바이트 단위로 일치하는 표준 주소이고, **우리 코드가 아니라 지갑이 준 값**이다.
부수 확인: 소유자 EOA는 이미 7702 업그레이드돼 있었고(`0xef0100` + 표준 구현체), 포크가 그것을 물려받았다.

### `loadEnv()`가 체인 id를 RPC에 물어본다 — 표준 배포가 있으면 우리 배포를 쓰지 않는다

**Cause:** `lib/delegation.ts:loadEnv()`는 `.delegation-anvil.json`이 **반드시** 있어야 했다. 포크(11155111)
에는 MetaMask의 표준 배포가 이미 있으므로 우리가 배포할 이유가 없는데, 파일이 없으면 던지고, 있으면 31337용
주소를 그대로 쓴다 — 코드 없는 주소에 서명하게 된다.

**Reasoning:** chainId를 env로 하나 더 받는 방법도 있었지만 채택하지 않았다. 설정과 현실이 갈라질 수 있는 값을
늘리는 셈이고, verex가 오늘 `VEREX_CHAIN_ID`로 정확히 그 사고를 겪었다. RPC에 물어보면 갈라질 수가 없다.
대신 `loadEnv()`가 async가 되고 `buildMandate`/`mandateTypedData`도 async로 바뀐다(호출부는 전부 async 라우트).

**Change:** `loadEnv()` → RPC의 `getChainId()` → `getSmartAccountsEnvironment(chainId)` 성공이면 그 환경을
쓰고 `overrideDeployedEnvironment`를 부르지 않는다. 실패(=SDK가 모르는 체인, 31337)면 기존 산출물 경로로
내려가되, **산출물의 chainId와 RPC의 chainId가 다르면 던진다**. 호출부 3곳(`mandate/prepare`, `mandate`,
`preflight`)에 `await` 추가. `scripts/agent-approve.mjs`는 viem의 `anvil` 체인(31337 고정) 대신
`getChainId()`로 `defineChain`을 만든다 — 포크에 대고 쓰면 체인 불일치로 거절당하던 문제.

**Result:** 같은 코드가 31337(우리 배포)과 11155111(표준 배포) 양쪽에서 동작한다. 포크에서는
`deploy-delegation.mjs`·`.delegation-anvil.json`·`overrideDeployedEnvironment`가 모두 불필요해진다.

### mandate 저장이 두 모양을 받는다 — 콘솔이 지갑의 권한 팝업을 쓴다

**Cause:** 위 확인들이 끝나자 R-A의 마지막 약점이 남았다. Grant를 누르면 사용자는 12개 필드짜리 날것의
EIP-712 구조체를 보고, 그게 "10 USDC, 60분"이라는 것은 **우리 페이지 설명을 믿어야** 안다.

**Reasoning:** 두 경로를 모두 남기기로 했다. 31337 경로는 완전히 오프라인으로 돌고(와이파이 없는 방에서도
데모가 된다), 포크 경로는 지갑의 신뢰 UI를 얻는다. 파괴적 교체가 아니라 체인으로 분기하면 되돌리기도
네트워크 전환 한 번이다. 저장은 같은 `delegation` JSON 열에 두 모양을 담아 **마이그레이션을 피한다** —
`kind` 없는 옛 행은 모양(delegate/delegator 유무)으로 판별한다.

**Change:**
- `lib/delegation.ts`: `StoredMandate`(`signed-delegation` | `erc7715`), `parseStoredMandate()`,
  `storedDelegator()` 추가.
- `app/live/agent/console/MandatePanel.tsx`: `grant()`가 `eth_chainId`로 분기, 31337이 아니면
  `grantVia7715()` — `requestExecutionPermissions([{ chainId, expiry, to: agent, permission:
  erc20-token-allowance }])`를 호출하고 `{ kind, context, delegationManager }`를 저장한다.
- `app/api/agent/mandate/route.ts`: POST가 두 모양을 받고 각각의 최소 조건을 검사한다(서명 / context+manager).
  GET은 7715 요청에 필요한 `usdc`·`chainId`를 함께 내려주고, `delegator`는 `storedDelegator()`로 바꿔
  7715 mandate에서는 **모른다고 말한다**(지어내지 않는다).

**Result:** 포크에서 Grant를 누르면 MetaMask가 자기 언어로 "최대 10 USDC, 60분"을 보여 준다. 성공 문구도
그 사실을 적는다 — "DelegationManager 0xdb9B…dB3 (우리가 아니라 지갑이 알려준 주소)".

### 상환과 시뮬레이션이 두 모양을 처리한다 — 시뮬레이션은 상환과 **같은 바이트**를 태운다

**Cause:** 부여만으로는 반쪽이다. `redeemMandate`/`simulateMandateDraw`가 서명된 구조체를 요구하고 있어
7715 mandate는 부여는 되지만 인출은 되지 않았다.

**Reasoning:** 상환은 SDK의 `erc7710WalletActions().sendTransactionWithDelegation`으로 그대로 된다.
문제는 시뮬레이션이었다 — 게이트 1(만료)은 "체인이 거절했다"를 **실제로 물어봐서** 증명하는데, 그 경로가
구조체를 인코딩한다. SDK의 wallet action 구현을 읽어 그것이 만드는 calldata를 그대로 재현하기로 했다
(`encodeDelegations(context)`, `SingleDefault`, `encodeExecutionCalldatas`). 시뮬레이션이 실제 상환과 다른
바이트를 태우면 그 증명은 거짓이 되므로, 두 경로가 같은 인코딩을 쓰는 것이 핵심이다.

**Change:** `lib/delegation.ts`에 `REDEEM_DELEGATIONS_ABI`(최소 ABI), `drawExecution()`,
`redeemCalldataFor7715()` 추가. `simulateMandateDraw`/`redeemMandate`가 `delegation: Delegation` 대신
`mandate: StoredMandate`를 받고 모양에 따라 분기한다 — 7715는 `eth_call`/`sendTransactionWithDelegation`,
기존 경로는 `DelegationManager.simulate/execute.redeemDelegations`. 거절 이유 디코딩
(`decode.redeemDelegationsError`)은 두 경로 공통으로 유지. `app/api/agent/tick/route.ts`는
`parseStoredMandate(mandate.delegation)` 하나로 받고, 이후 로직은 모양을 모른다.

**Result:** `npx tsc --noEmit` 통과, `next build` 컴파일 성공. 포크에서 mandate 부여·상환·만료 증명이 모두
같은 코드 경로로 동작할 준비가 됐다. **아직 실행 검증은 없다** — verex 백본이 포크에 올라가야 tick을 돌릴 수
있고, 그 작업은 [verex 쪽 이력](../../../verex/docs/history/2026-08-31-verex-history.md)에 있다.

### 남아 있는 것

- **미검증:** 위 코드는 타입 검사와 빌드만 통과했다. 포크에서 실제로 부여→틱→상환을 돌린 적은 없다.
- **`drawnUsdc`가 SELL에서도 증가한다** — 에이전트가 *받는* 돈을 mandate에 과금한다. 8/28에 보고했고 아직
  jay의 결정을 기다린다.
- **`(no on-chain delegation — DB budget only)`** 문구가 SELL에서도 찍힌다. 이유가 아니라 결과로 판단하는
  문장이라 오해를 부른다.
- **취소가 DB 전용이다.** `disableDelegation`을 부르지 않아, 상한·만료는 체인이 강제하는데 취소만 서버를
  믿어야 한다. 셋 중 둘만 무신뢰다.
