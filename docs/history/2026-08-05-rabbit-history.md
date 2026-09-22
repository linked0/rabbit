# 2026-08-05 — rabbit

관련 문서: [docs/tasks/current-plan.md](../tasks/current-plan.md) §3 (AA 기반) / §6 (Agentic AA 4대 요소)

### AA 세션 키 데모: 테스트 준비물(테스트 USDC + 세션 계정 가스)을 페이지에 명시

**Cause:** jay가 "AA 데모가 어떤 USDC를 쓰느냐"고 물었고, 확인 과정에서 3단계(`sendTransactionWithDelegation`)를
*세션 계정이 직접 브로드캐스트*한다는 점이 드러났다. 새로 생성된 세션 계정은 ETH 잔액이 0이므로, 권한 부여가
성공해도 3단계에서 가스 부족으로 실패한다 — 데모를 처음 보는 사람은 원인을 알 수 없는 UX 결함.

**Reasoning:** 코드로 자동 충전할 수는 없으니(테스트넷 ETH는 외부 faucet에서만 옴), 실패하기 전에 미리
알려주는 게 유일한 해법. 문서에만 적으면 페이지를 여는 사람이 못 보므로 데모 패널 안에 넣기로 함.
MetaMask 버전/네트워크 전환 항목은 jay 요청으로 제외 — 이미 갖춰진 전제라 노이즈만 됨.

**Change:** `app/etc/aa/SessionKeyDemo.tsx`에 패널 최상단 "시작 전 준비물" 박스 추가 — ① 오너 지갑의 테스트
USDC(faucet.circle.com 링크) ② 세션 계정용 소액 Sepolia ETH(faucet 링크), 그리고 토큰이 Circle 공식 Sepolia
USDC(`0x1c7D…7238`, 6 decimals)라는 Etherscan 링크. 1단계 완료 후 세션 주소 아래에 "이 주소로 ETH 먼저
보내세요" 경고를, 3단계 설명에 "USDC는 오너 잔액에서 / 가스는 세션 계정에서" 문장을 추가.
`lib/poc-cards.ts`의 AA 카드 `howTo`에도 준비물 한 줄 반영.

**Result:** 타입 체크 통과. 브라우저 클릭스루는 아직 미검증 — jay가 오늘 테스트 예정. 토큰 주소 주석도
"MetaMask 문서 예시 주소"에서 "Circle 공식 테스트넷 USDC"로 정정(사실 관계가 더 정확함).
이후 jay 피드백으로 세션 주소 아래 ⚠️ 중복 경고는 삭제(같은 경고의 3번째 반복이라 노이즈).

### 준비물 안내에서 단계 번호 대신 버튼 이름으로 지칭

**Cause:** 준비물 박스가 자체 번호(①②)를 쓰는데 그 안에서 데모의 "1단계/3단계"를 언급하다 보니 번호가
충돌했다 — jay가 "여기서 3단계 틀렸음"으로 지적.

**Reasoning:** 번호를 다시 매기는 대신 아예 숫자 참조를 없애는 쪽이 안전하다. 단계 순서가 바뀌어도
문구가 썩지 않고, 사용자는 화면의 버튼 라벨을 그대로 찾으면 된다.

**Change:** "3단계가 …" → "마지막 「한도 내 전송 실행」이 …", "1단계 후 아래에 표시되는 주소" →
"MetaMask를 연결하면 아래에 표시되는 세션 계정 주소". 이유를 주석으로도 남김.

**Result:** 준비물 박스 안에서 숫자 참조가 사라져 번호 충돌 해소.

### MetaMask 기존 연결 자동 인식 + connect/disconnect 버튼 분리

**Cause:** jay 요청 — 이미 MetaMask에 연결된 지갑이 있으면 그걸 쓰도록, 그리고 연결/해제 버튼을 분리.
기존 구현은 Connect 버튼 하나뿐이라, 이미 연결된 상태여도 매번 눌러야 했고 해제 수단이 없었다.

**Reasoning:** `eth_requestAccounts`는 팝업을 띄우지만 `eth_accounts`는 이미 승인된 계정만 조용히
반환한다 → 마운트 시 후자로 자동 인식. 해제는 로컬 state만 지우면 새로고침 시 되살아나므로,
`wallet_revokePermissions({eth_accounts:{}})`로 사이트 권한 자체를 회수하고 미지원 지갑에서는
로컬 초기화로 폴백. 계정 전환 시엔 이전 오너에게 받은 권한/세션 키가 무효라 새로 생성한다.

**Change:** `SessionKeyDemo.tsx`에 `adopt()`/`resetLocal()`과 mount effect 추가 — `eth_accounts`
자동 인식 + `accountsChanged` 구독(계정 변경 시 재생성, 빈 배열이면 초기화). 최신 owner는 리스너
클로저 문제를 피하려고 `ownerRef`로 읽음. 버튼은 Connect/Disconnect 2개로 분리(각각 owner 유무로
비활성화), 해제가 무엇을 폐기하는지 안내 문구 추가.

**Result:** 타입 체크 통과. 이 저장소엔 ESLint 설정이 없어 `next lint`는 대화형 프롬프트로 빠져 미실행.
브라우저 동작 확인은 jay 테스트 시 함께 필요.

### /etc/aa 부제 정정 — 세 표준의 역할을 분리

**Cause:** jay가 "ERC-7702(위임형 스마트 계정) + ERC-7715(세션 키) 데모 — MetaMask Delegation Toolkit"
문구가 혼란스럽다고 지적. 실제로 문제가 셋이었다 — ① "MetaMask Delegation Toolkit"은 개명 전 이름
(현재 `@metamask/smart-accounts-kit`), ② 페이지에서 유일하게 *볼 수 없는* 7702를 대표 기능처럼 앞세움,
③ 정작 온체인 작업을 하는 ERC-7710이 누락.

**Reasoning:** ②가 jay가 "7702가 어디 있냐"를 반복해서 묻게 만든 직접 원인 — 문서가 혼란을 만들고 있었다.
세 표준을 나열하는 대신 각자의 역할을 명시하는 문장으로 바꾸는 게 맞다.

**Change:** `app/etc/aa/page.tsx` 부제를 "7715가 위임 → 7710이 온체인 강제 → 7702는 MetaMask가 처리하는
전제조건" 구조로 재작성하고 패키지명을 현행으로 교체. 이유를 주석으로 남김.

**Result:** 페이지를 읽고 나면 세 표준의 역할 구분이 남는다. 카드 분리(세션 키 / thirdweb 4대 요소)는
논의만 하고 보류 — `lib/poc-cards.ts`의 purpose/howItWorks/다이어그램이 4대 요소를 한 덩어리로 서술하고
있어, 분리하려면 그 재작성이 함께 필요하다.

### EIP-7702 전용 PoC 카드 + 계정 인스펙터 (/etc/7702)

**Cause:** "7702는 클릭할 게 없어 카드가 아니라 TIL 감"이라는 내 판단에 jay가 카드로 만들자고 재요청.
재검토해보니 틀린 판단이었다 — `eth_getCode`로 계정 코드 슬롯을 읽으면 7702의 효과를 눈으로 볼 수 있다.

**Reasoning:** 7702의 문제는 "시연 불가"가 아니라 "지갑 안에서 조용히 일어나 흔적이 안 보인다"였다.
읽기 전용 호출이라 가스·서명·지갑이 전부 불필요해서, 지갑 없는 방문자도 아무 주소나 넣어볼 수 있는
포트폴리오용 데모로 오히려 적합하다. 트랜잭션을 보내는 데모(배치 실행 등)는 MetaMask의 7702 관련 RPC
지원 범위를 확인하지 못해 이번 범위에서 제외.

**Change:** `app/etc/7702/` 신설 — `AccountInspector.tsx`(주소 입력 또는 연결된 지갑 → `eth_getCode` →
평범한 EOA / 7702 위임됨(지정자 디코딩 + 구현체 Etherscan 링크) / 일반 컨트랙트로 분기),
`Lazy7702.tsx`(ssr:false 코드 스플리팅), `page.tsx`(인스펙터 + 활용 사례 6종 + 트레이드오프 경고).
`lib/poc-cards.ts`에 `erc-7702` 카드(양쪽 언어 purpose/howItWorks/시퀀스 다이어그램), `middleware.ts`
PUBLIC_PATHS에 `/etc/7702` 추가. `/etc/aa`의 세션 키 데모에도 "내 계정 확인 (EIP-7702)" 버튼을 넣어
권한 부여 전/후 차이를 같은 화면에서 볼 수 있게 함.

**Result:** 프로덕션 빌드 통과 — `/etc/7702` 3.12 kB. 도중에 `.next` 캐시가 깨져 `/_document`
PageNotFoundError가 났고, `rm -rf .next` 후 정상 빌드(코드 문제 아님). 브라우저 확인은 미완.

### 카드당 다이어그램을 배열로 — AA 기술 노트에 수명주기 + 호출 경로 추가

**Cause:** jay와 7702/7715/7710의 관계를 20턴 넘게 파고들며 오해가 반복적으로 드러났다 —
"DelegationManager가 위임을 저장한다", "DeleGator가 세션을 검증한다", "지출 시점에 MetaMask가
관여한다", "EOA에 함수를 호출할 수 없다". 기존 AA 다이어그램은 ①과 ②③을 한 그림에 욱여넣어
정작 이 지점들을 보여주지 못했다. jay가 그 설명을 기술 노트에 넣자고 요청.

**Reasoning:** 한 데모에 성격이 다른 그림이 둘 이상 필요하다는 게 드러났다 — "전체 수명주기"와
"행사 한 건의 호출 경로"는 답하는 질문이 다르다. `diagram?: string` 하나로는 담을 수 없어
`diagrams?: DemoDiagram[]`(제목 양쪽 언어 + mermaid 소스)로 확장. 특히 EVM이 코드 슬롯 포인터를
따라가는 단계를 별도 분기로 그려야 했다 — jay가 "다이어그램에서 어떻게 EOA에 함수를 호출하냐"고
물었을 때, 그 단계가 그림에 없다는 게 혼란의 원인이었기 때문.

**Change:** `lib/demo-cards.ts`에 `DemoDiagram` 타입 추가하고 `diagram` → `diagrams` 배열로 교체.
`app/TechNotes.tsx`는 `<figure>` + `<figcaption>`으로 캡션과 함께 렌더. `lib/poc-cards.ts`의 네 카드
(ap2 / erc-7702 / aa / toss-payments) 전부 새 형태로 이행. AA는 그림 3개로 분리 — ① 전체 수명주기
(전제조건/부여/지출 3구간), ② 행사 한 건의 호출 경로(매니저 3검사 → EVM 포인터 분기 → DeleGator의
호출자 검사), ③ thirdweb ERC-4337 ②③ 요소.

**Result:** 타입 체크 + 프로덕션 빌드 통과. 같은 내용을 대화용 레퍼런스 시트(아티팩트)로도 만들어
공유 — 페이지 쪽이 정본이고, 아티팩트는 대화 맥락 정리용.

### 세션 계정 가스 문제: 충전 버튼 + Sepolia 자동 전환

**Cause:** jay 실제 테스트에서 3단계가 `insufficient funds for transfer`로 실패. 에러의 from/to/data가
세션 계정 → DelegationManager → `redeemDelegations`로 정상이었고, 순수하게 세션 계정 ETH 잔액이 0인
문제였다. 이어서 네트워크가 Sepolia가 아니라는 에러도 발생.

**Reasoning:** faucet은 주소마다 몇 분이 걸리는데 세션 키는 새로고침하면 사라진다 — 오너 지갑에서
바로 보내는 게 유일하게 현실적인 경로. 네트워크 에러는 "직접 바꾸세요"라고 막을 게 아니라
`wallet_switchEthereumChain`으로 대신 해주는 게 맞다(사용자가 할 일을 RPC 한 번으로 대체 가능하면 대체).

**Change:** `SessionKeyDemo.tsx`에 ① `fundSession()` — 오너 → 세션 주소로 0.002 ETH 전송 후
영수증까지 대기하고 상태 표시, ② `ensureSepolia()` — 체인 불일치 시 전환 요청, 지갑에 체인이
없으면(4902) 추가까지 요청. 3단계 버튼 옆에 충전 버튼 배치, grant에도 같은 가드 적용.

**Result:** 타입 체크 통과. 남은 잔액 회수 문제는 논의만 — 테스트넷 dust라 sweep 버튼은 보류하고,
근본 해법은 ②(paymaster)로 세션 계정 가스 자체를 없애는 것이라고 정리.

### "Agentic AA" → "에이전트를 위한 AA": 이름을 실제에 맞추고 활용 예시 추가

**Cause:** jay 지적 — "데모가 Agentic AA에서 agentic한 걸 아무것도 안 한다". 실제로 ①②③ 모두
사람이 버튼을 누른다. 능력(capability)은 시연하지만 자율성(autonomy)은 시연하지 않는데, 이름은
자율성을 주장하고 있었다. 세션 키의 핵심 논거가 "부여 후 사람 개입 없음"이라 자기 논지를 훼손.

**Reasoning:** 이름을 실제에 맞추는 쪽이 정직하고, 꼼꼼한 면접관이 발견할 약점을 먼저 명시하는 게
오히려 강점이 된다. 다만 "그래서 이게 왜 필요한가"가 비면 안 되므로, 결정 루프가 얹혔을 때 각
구성요소가 실제로 무엇을 사주는지 예시로 채운다 — 사이트에 이미 있는 /ap2, /etc/toss와 이어지게.

**Change:** `/etc/aa` 섹션 제목 "Agentic AA — 4대 요소" → "에이전트를 위한 AA — 4가지 구성요소".
새 섹션 "이 구성요소로 만드는 에이전트" 추가 — 집계 구매자(①+③), 호출당 결제 소비자(①+②),
스케줄 운영자(①), 거래 상대 확인(④) 4개 예시와 함께, 버튼을 사람이 누른다는 점 및 빠진 조각이
결정 루프라는 점을 명시. `lib/poc-cards.ts`의 AA 카드 description/howItWorks에도 같은 단서 반영.

**Result:** 타입 체크 + 빌드 통과. 실제 결정 루프(권한 부여 후 자동 반복 지출 → enforcer가 멈춤)는
제안만 하고 미구현 — jay가 테스트 중이라 세션 초기화를 피했다.

### 시나리오별 상세 페이지 4개 — 관계도 + 순서도

**Cause:** jay 요청 — "이 구성요소로 만드는 에이전트"의 각 사례마다 사용자·에이전트·각 주체가 어떻게
협력하는지 그림으로 설명하는 페이지를 만들 것. D3.js 등 그래픽 라이브러리 사용 제안.

**Reasoning:** D3는 정적 그림 4×2장을 위해 추가하기엔 무겁고(번들 +수백 kB), mermaid는 이미 의존성에
있고 동적 import + 코드 스플리팅까지 되어 있다 — 새 라이브러리 없이 목적을 달성. 시나리오마다 그림을
**두 장** 두기로 함: 관계도(flowchart — 권한·자금·데이터가 어느 방향으로 흐르나)와 순서도
(sequenceDiagram — 언제 무슨 일이). 한 장에 합치면 둘 다 흐려진다.

**Change:** `lib/agent-scenarios.ts` 신설 — 시나리오 4개(집계 구매자 / 호출당 결제 / 스케줄 운영자 /
거래 상대 확인)를 slug·등장 주체·관계도·순서도·"보장하는 것"·"보장하지 않는 것"까지 양쪽 언어로.
`app/etc/aa/scenarios/[slug]/page.tsx` — `generateStaticParams`로 4개 정적 생성. `/etc/aa`의 목록은
인라인 배열을 걷어내고 이 lib를 참조하며 각 항목에 상세 링크 추가. `middleware.ts` PUBLIC_PATHS에
4개 경로 명시(파일 규칙대로 prefix 매칭 대신 열거).

**Result:** 빌드에서 4개 경로 모두 정적(●) 생성 확인, 페이지당 2.21 kB. 각 시나리오에 "보장하지
않는 것" 절을 넣은 게 핵심 — 한도는 얼마를 잃을 수 있는지를 묶을 뿐 구매가 현명했는지는 다루지
않고, 평판 기록은 이력을 읽을 수 있게 만들 뿐 믿을 수 있게 만들지 않는다는 식으로.

### DVT 카드 + /etc/dvt — 프로토콜 흡수 제안 정독 노트

**Cause:** jay가 리서치 노트(비탈릭의 "DVT를 프로토콜에 흡수하자" 제안 요약 + 자기 프로젝트에
어떻게 적용할지에 대한 메모)를 넘기며 PoCs에 카드와 페이지를 요청.

**Reasoning:** 이건 구현물이 아니라 아직 EIP 번호도 없는 ethresear.ch 단계 논의라, "구현했다"로
읽히면 안 된다 — 페이지를 설계 분석으로 규정하고 미해결 질문 넷을 그대로 남겼다. 대신 아이디어의
회계 구조(독립 키 n개 · m개 일치로 성립 · 참여 기록이 평판)는 한 층 위에서 오늘 만들 수 있으므로,
PoC 후보를 "지금 만들 수 있음"과 "제안 채택 이후"로 배지 구분했다. 이 사이트의 AA 페이지들과
같은 패턴(미들웨어 → 프로토콜 흡수)의 다른 도메인 사례라는 연결도 명시.

**Change:** `app/etc/dvt/page.tsx` 신설 — 배경(EIP-7251) / 오늘의 DVT / 제안 / 열린 질문 4 /
실무 함의 3 / PoC 후보 4(배지 구분) / 첫 후보 스펙 초안. mermaid 다이어그램 2장으로 "키를 쪼개
밖에서 재조립" vs "따로 있는 키를 프로토콜이 m-of-n으로 묶음"을 대비. `lib/poc-cards.ts`에 `dvt`
카드(다이어그램 2장 포함), `middleware.ts`에 `/etc/dvt` 추가.

**Result:** 타입 체크 + 빌드 통과, 2.21 kB. ⚠️ 판단이 필요한 지점 하나 — jay 원본 메모는 적용처를
Verex(업무 프로젝트)로 특정했지만, PoCs는 공개 페이지라 "예측시장 정산 계층", "문서·CI 파이프라인"
같은 일반형으로 바꿔 썼다. 업무 프로젝트 이름을 공개 포트폴리오에 노출할지는 jay 결정 사항.

### /ap2 → /etc/ap2 이동 + 전 데모 페이지에 되돌아가기 링크

**Cause:** jay 지적 — 상단 메뉴의 PoCs가 `/etc`인데 AP2만 루트(`/ap2`)에 있어 URI 계층이 메뉴와
어긋난다. 그리고 각 데모 페이지에 되돌아가기 수단이 없다.

**Reasoning:** 폴더를 옮기면 공유·북마크된 옛 링크가 죽으므로 `next.config.js`에 영구 리다이렉트를
함께 남긴다. 되돌아가기는 페이지마다 손으로 쓰면 문구가 갈라지므로 공용 `BackLink` 컴포넌트로 —
기본 목적지는 PoCs 허브이고, 하위 페이지(시나리오)는 자기 부모를 지정하도록 props를 뒀다.

**Change:** `git mv app/ap2 app/etc/ap2` 후 상대 import 경로 보정, `middleware.ts`·`lib/poc-cards.ts`
href·Stripe success/cancel URL·다이어그램 본문·`lib/agent-scenarios.ts` 본문의 `/ap2` 참조를 전부
`/etc/ap2`로 갱신. `app/BackLink.tsx` 신설 후 ap2·toss·aa·7702·dvt·시나리오 6개 페이지에 적용
(시나리오는 기존 인라인 링크를 이 컴포넌트로 교체). `next.config.js`에 `/ap2` → `/etc/ap2` 301.

**Result:** 빌드 라우트 표에서 `/etc/ap2` 확인, 타입 체크 통과. ⚠️ 남은 불일치 — `/market`(하이퍼리퀴드)와
`/xyz`(PBS)도 PoCs 카드인데 루트에 있다. 이번 요청에 포함되지 않았고 외부 링크 영향 범위가 더 커서
건드리지 않았다. 같은 기준을 적용하려면 별도 판단 필요.

### /etc → /poc — 허브 URI 를 메뉴 라벨에 맞춤

**Cause:** jay 제안 — 상단 메뉴는 "PoCs", 데이터 파일도 `lib/poc-cards.ts` 인데 라우트만 `/etc`
(잡동사니라는 뜻의 잔재)로 남아 있었다. 바로 앞의 `/ap2` → `/poc/ap2` 이동과 같은 기준.

**Reasoning:** URL 은 사용자가 보는 이름과 일치해야 한다. 다만 `git mv` 만 하면 공유된 링크가 전부
죽으므로 `/etc` 와 `/etc/:path*` 를 함께 301 로 남긴다. 중요한 함정 하나 — Nav 의 `code: "ETC"` 는
URL 이 아니라 env 키(`ALLOW_ETC`)라, 여기까지 같이 바꾸면 배포 env 를 동시에 바꿔야 하고 놓치면
메뉴가 조용히 사라진다. 실패가 눈에 안 띄는 종류라 URL 이동과 분리하고 주석으로 이유를 남겼다.

**Change:** `git mv app/etc app/poc`, 코드 내 URL 문자열 `/etc*` → `/poc*` 일괄 치환(정규식으로
URL 위치만 — 주석·산문의 `/etc` 도 함께 정리). `next.config.js` 에 301 두 줄 추가(`/etc`,
`/etc/:path*`). `middleware.ts` PUBLIC_PATHS 전부 갱신. Nav 의 `code` 는 "ETC" 유지 + 이유 주석.

**Result:** 빌드 라우트 표가 전부 `/poc/*` 로 전환됨을 확인. 옛 링크는 301 로 살아 있다.
⚠️ 여전히 미해결 — `/market`, `/xyz` 는 PoCs 카드인데 루트에 남아 있다(이번에도 요청 범위 밖).

### /market·/xyz 에도 되돌아가기 링크 + "XYZ Demo —" 접두어 제거

**Cause:** jay 지적 — 하이퍼리퀴드(/market)와 PBS(/xyz)는 PoCs 카드로 들어가는 페이지인데 다른
데모들과 달리 "← PoCs" 링크가 없었다. 그리고 /xyz 제목의 "XYZ Demo —" 접두어는 불필요.

**Reasoning:** 카드에서 들어온 사람이 돌아갈 길은 카드로 진입하는 모든 페이지에 있어야 일관된다 —
BackLink 컴포넌트를 만들어 둔 이유가 이것. "XYZ"는 이 데모가 무엇인지 설명하지 않는 내부 이름
(고용주 데모용 코드명)이라, 제목은 실제 내용인 "PBS 소비자 트랙"만 남기는 게 맞다.

**Change:** `app/market/page.tsx`, `app/xyz/page.tsx` 에 `BackLink` 추가. /xyz 의 h1 을
"XYZ 데모 — PBS 소비자 트랙" → "PBS 소비자 트랙"(en: "PBS consumer track")으로 축약.

**Result:** 타입 체크 + 빌드 통과. 두 라우트의 위치(/market, /xyz)는 이번에도 그대로 — URL 이동은
영향 범위가 커서 별도 판단 대상으로 남겨둠.

### 배포 준비: 결제·thirdweb 키가 운영에 전달되지 않던 문제

**Cause:** 배포 직전 점검에서 `scripts/deploy.sh` 가 Cloud Run 으로 넘기는 env 목록에
`STRIPE_SECRET_KEY`·`TOSS_SECRET_KEY` 가 아예 없었고, `NEXT_PUBLIC_TOSS_CLIENT_KEY`·
`NEXT_PUBLIC_THIRDWEB_CLIENT_ID` 는 구조적으로 더 나쁜 문제였다 — `NEXT_PUBLIC_` 접두어는
빌드 시점에 값이 코드에 박히는데, Cloud Run 은 소스에서 빌드하고 `.dockerignore`/`.gcloudignore`
가 `.env*` 를 제외하므로 빌드 컨텍스트에 값이 존재하지 않는다. 그대로 배포했다면 /poc/ap2 결제
버튼과 /poc/toss 결제창, /poc/aa 의 ②③ thirdweb Connect 가 운영에서만 조용히 죽었을 것.

**Reasoning:** 서버 전용 키는 기존 패턴대로 Secret Manager 에 얹으면 되지만, 공개 클라이언트 키는
`NEXT_PUBLIC_` 을 계속 쓰는 한 빌드 타임 문제가 남는다. 어차피 브라우저로 가는 값이라 시크릿일
이유가 없고, 서버가 런타임에 읽어 prop 으로 내려보내면 재빌드 없이 키를 교체할 수도 있다 —
Cloud Run 환경에서는 이쪽이 구조적으로 맞다.

**Change:** `lib/thirdweb-client.ts` 를 모듈 상수에서 `makeThirdwebClient(clientId)` 팩토리로 전환,
`AgenticPillars` 가 `clientId` prop 을 받아 `useMemo` 로 클라이언트를 만들고 없으면 명시적 에러
문구를 띄우도록 함. `TossBuyButton` 도 `clientKey` 를 prop 으로 받게 바꾸고, 두 서버 페이지가
`THIRDWEB_CLIENT_ID`/`TOSS_CLIENT_KEY`(NEXT_PUBLIC 은 폴백)를 런타임에 읽어 넘긴다.
`scripts/deploy.sh` 에 Stripe/Toss 서버 키 시크릿 2개와 공개 키 env 2개 전달 로직 추가.

**Result:** 타입 체크 + 빌드 통과. 이 수정이 없었으면 배포 자체는 "성공"으로 끝나고 결제 데모
셋만 운영에서 깨졌을 것 — 로컬에서는 `.env.local` 덕분에 멀쩡해 보이므로 알아채기 어려운 종류.

### 텔레그램 알림 시점을 홈 방문 + Jay Chat 시작 둘로 축소

**Cause:** jay 요청 — 알림을 보낼 시점을 홈 페이지 방문과 Jay Chat 대화 시작 두 가지로 정리.
기존에는 `/projects` 방문에도 알림이 나갔다.

**Reasoning:** 페이지마다 알림을 붙이면 신호가 아니라 소음이 된다 — 방문이 잦은 페이지의 알림이
쌓이면 정작 알아야 할 이벤트(누가 실제로 대화를 시작했다)가 묻힌다. 10턴 마일스톤 알림은 남겼다:
대화당 최대 1회이고 "잠깐 눌러본 사람"과 "실제로 파고든 사람"을 구분하는 다른 종류의 신호라,
요청에서 명시적으로 빼라고 하지 않은 것을 임의로 지우는 쪽이 더 위험하다고 판단.

**Change:** `app/projects/page.tsx` 에서 `notifyPageView` 호출과 이제 쓰이지 않는 `headers` import
제거. `lib/visitor-notify.ts` 에 "알림 시점은 이 둘뿐"이라는 결정을 주석으로 남겨, 새 페이지에
알림을 붙이려는 사람이 먼저 보게 함.

**Result:** 남은 알림 지점 — 홈 방문, Jay Chat 첫 메시지, Jay Chat 10턴(마일스톤). 빌드 통과.
