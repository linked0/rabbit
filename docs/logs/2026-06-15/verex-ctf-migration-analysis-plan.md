# Verex CTF 마이그레이션 — 코드 분석 계획 (2026-06-15)

> 대상: `verex` 저장소 `ctf-exchange` 브랜치 (PR [#2](https://github.com/linked0/verex/pull/2)) — S2.x 마일스톤, 커밋 21개.
> v1 factory/market 모델 → Polymarket 스타일 **CTFExchange + ConditionalTokens(CTF)** 스택 전환.
> 이 문서는 verex 코드를 직접 고치지 않고(= PR 리뷰 단계) **무엇을 어떤 순서로 확인할지**를 정리한 분석 체크리스트.

---

## 0. 분석 전 준비

- [ ] PR #2를 로컬에서 체크아웃: `git -C ~/work/verex switch ctf-exchange`
- [ ] 서브모듈 동기화: `git -C ~/work/verex submodule update --init --recursive` (`lib/ctf-exchange`)
- [ ] 빌드/테스트가 깨끗하게 도는지 baseline 확인 (아래 §5)

## 1. 최우선 리스크 — off-chain EIP-712 주문 해시 parity

가장 위험한 부분. SDK가 컨트랙트 밖에서 주문 해시를 재구성하므로, 한 글자라도 어긋나면 서명이 조용히 무효가 된다.

- [ ] `packages/sdk/src/orders.ts`의 `hashOrder` ↔ `CTFExchange.hashOrder()` 일치 검증 (golden digest vitest 3/3가 실제로 도는지)
- [ ] `OrderDomain`(name/version/chainId/verifyingContract)이 배포된 CTFExchange의 `getDomainSeparator()`와 동일한지
- [ ] `signOrder` → on-chain signature recovery roundtrip이 `SignatureType` 전부(EOA/POLY_PROXY 등)에 대해 성립하는지
- [ ] `conditions.ts`의 `getConditionId`(encodePacked + keccak)가 ConditionalTokens 결과와 일치하는지

## 2. 컨트랙트 (Foundry)

- [ ] `script/DeployCTF.s.sol` — 배포 순서/권한 부여(operator, approval)가 데모와 일치하는지
- [ ] `script/DemoMarket.s.sol`, `EmitOrderHash.s.sol` — 하드코딩된 주소/키가 없는지
- [ ] `src/JUSD.sol` — 테스트 전용임이 명확한지(운영 배포 경로에 안 섞이게)
- [ ] `lib/ctf-exchange` 서브모듈 핀 커밋이 신뢰 가능한 버전인지

## 3. SDK surface

신규 모듈: `ct.ts`, `exchange.ts`, `orders.ts`, `jusd.ts`, `clients.ts`, `conditions.ts` / 제거: `factory.ts`, `market.ts`

- [ ] `index.ts` re-export가 의도한 public API만 노출하는지 (내부 헬퍼 누출 여부)
- [ ] `ct.ts`의 split/merge/redeem/report 인자 인코딩이 binary market 가정과 맞는지
- [ ] `exchange.ts`의 `fillOrder`/`cancelOrder`/`addOperator` 권한 체크
- [ ] `clients.ts` — RPC/서명자 주입 방식, 키가 코드에 안 박혀 있는지
- [ ] `types.ts` — `Order`/`Side`/`SignatureType` enum 값이 컨트랙트와 1:1인지

## 4. CLI

- [ ] `packages/cli/src/index.ts` 10개 CTF 커맨드 — 입력 검증, 에러 메시지
- [ ] `demo.ts` E2E 흐름(deploy → setup → sign+fill → resolve → redeem)이 문서(alice 100→140 jUSD)와 재현되는지

## 5. 테스트 & 회귀

- [ ] `cd ~/work/verex/packages/contracts && forge test` — S2.4 문서의 34/34 통과 재현
- [ ] `pnpm test` (SDK vitest) — orders parity 3/3
- [ ] gas-snapshot(`.gas-snapshot`) 변화가 합리적인지

## 6. 보안 관점 (직접 고치치 말고 watch-list에 기록)

- [ ] operator/approval 모델 — 누가 무엇을 대신 실행할 수 있는지 최소 권한인지
- [ ] condition 해결(`reportPayouts`) 권한 — 단일 키 의존 여부 (oracle progression: 수동 S2 → Chainlink/UMA S6 계획 확인)
- [ ] 1155 `setApprovalForAll` 범위
- [ ] 재진입/정산 순서 (redeem ↔ payout)

## 7. 알려진 미완 (S2.4 문서 기준)

- [ ] `@verex/api`의 `VerexClient` import가 여전히 broken — 별도 정리 필요. 분석 시 이 경계 명확히.
- [ ] S2.5 (MM v0 two-sided quotes) 미착수 — 이번 분석 범위 밖.

## 8. 산출물

- 분석 결과는 verex 코드가 아니라 **verex `docs/` (watch-list / history)** 또는 이 task 저장소에 기록.
- 발견한 보안 항목은 verex `docs/plan/watch-list.md` 후보로 정리.

---

*근거 문서: verex `docs/history/2026-05-27-s2.4-sdk-cli-migration.md`, PR #2 diff (44 files, +5379/-606).*
