# 🚀 Project Management

## Collaboration & Infrastructure

<!-- 결론(2026-06-25): Notion = 지식 층(durable), Slack/Claude Tag = 위임 층(real-time). 대체가 아니라 다른 층위. -->

- **Need a collaboration tool like Notion and Slack**
- Establish policies and methods for schedule sharing and documentation

## Planning Strategy

- **기획 진행 중에 완벽한 트렌드 파악 시간 필요**
- Dedicated time required to fully grasp market trends during the planning phase

## Retrospective (지난 반성)

- **선택과 집중을 못할 뻔 (레퍼럴과 토크노믹스)**
- Avoided the pitfall of losing focus on core priorities (initially over-prioritizing Referral and Tokenomics).

## Nostra Issues (문제점)

- 목표와 중간 과정에 대한 그림이 없음
- 개발과 운영에 대한 전체적인 그림이 없음
- 외부의 시스템과 연동에 대한 그림이나 아이디어가 없음
- 새로운 아이디어가 없음

---

## Git Workflow Policy (커밋 & 브랜치 정책)

> 작업 중단·재개와 커밋을 다룰 때의 개인 정책. _(2026-06-04 정립)_

### 핵심 원칙
- **`main`에는 완성된(complete) 커밋만 올린다.** 미완성 작업은 절대 `main`에 직접 커밋하지 않는다.
- **작업은 항상 feature 브랜치에서** 한다 (`feat/<name>`).
- **하루를 중단할 때**는 그냥 내버려두지 말고 **WIP 커밋 + push**로 스냅샷을 남긴다 (백업·다기기·안전).
- **머지 전에 정리**한다: WIP 커밋들을 squash/amend 해서 최종 히스토리는 깔끔한 "완성 단위" 커밋만 남긴다.

### 커밋 메시지 flag word
| 표시 | 종류 | 의미 |
|------|------|------|
| `wip:` / `[WIP]` | 사람용 라벨 | "미완성, 나중에 정리할 것"이라는 신호 (기능적 효과 없음) |
| `fixup!<제목>` | git 키워드 | `git commit --fixup=<커밋>`. squash 시 **메시지 버림**, 변경만 합침 |
| `squash!<제목>` | git 키워드 | `git commit --squash=<커밋>`. squash 시 **메시지 합침**(편집 가능) |

> `fixup!`/`squash!`는 `git rebase -i --autosquash <base>`가 자동으로 대상 커밋 아래로 정렬·합쳐준다.
> (`git config --global rebase.autosquash true`로 기본 활성화 가능)

### 표준 흐름 (하루 단위)
```bash
# 시작: 브랜치에서 작업
git switch -c feat/year-hare            # (이미 있으면 git switch feat/year-hare)

# 중단(하루 끝): WIP 스냅샷 + 백업
git add <작업분만>                       # 관련 변경만 선택적 스테이징
git commit -m "wip: <무엇을 하던 중인지>"
git push -u origin feat/year-hare

# 완성 후: 정리 → main 머지
git rebase -i --autosquash main         # wip 커밋들을 완성 커밋으로 정리
git switch main && git merge feat/year-hare
```

### 안전 체크 (커밋 전)
- `.env*.local`, `node_modules`, 빌드 산출물이 **`.gitignore`로 제외**되는지 확인 — 시크릿 커밋 방지.
- `git diff --cached --name-only`로 **스테이징된 파일이 의도한 것만**인지 확인.

### 비고 (느슨한 정책)
- 워킹트리에 **관련 없는 untracked 변경이 떠 있어도 무방** — 선택적 `git add`로 의도한 파일만 커밋한다.

---

## Deployment Workflow (배포 워크플로우)

> 커밋·머지와 배포의 타이밍, 그리고 "배포 안 하면 못 잡는 버그"를 다루는 법. _(2026-06-24)_

### 핵심 순서 — 배포는 *마지막*
배포 = **커밋된(이상적으론 머지된) 상태를 출하**한다. 커밋 안 된 로컬 변경은 절대 배포하지 않는다(추적·롤백 불가).
```
1. 로컬 실행/테스트  → 버그 찾기 (검증은 여기서)
2. commit           → 로컬에서 동작할 때만
3. push → PR → 리뷰 → merge
4. deploy            → 검증된 코드 출하 (마지막)
```

### 두 종류의 버그
| 종류 | 어디서 잡나 |
|------|------------|
| 앱/로직 버그 (UI, 쿼리, 렌더링) | **로컬** 실행으로 |
| 배포/환경 버그 (Cloud SQL 소켓, Secret Manager, CORS, OAuth redirect, 콜드스타트…) | **배포해야** 잡힘 — 로컬 재현 불가 |

### 배포 버그는 "안전한 타겟"에 먼저 배포해서 잡는다
실제 도메인에 바로 붙이지 않는다. Cloud Run이 주는 **`*.run.app` URL = 스테이징**.
```
deploy → *.run.app URL 에서 테스트 → 배포 버그 수정 → redeploy
작동하면 → verex.jaylabs.xyz 매핑  (= go live, 마지막)
```
도메인(=prod)은 run.app URL이 작동한 뒤 *마지막에* 붙인다 → prod가 깨질 일이 없다.

### 첫 배포 루프 (반복은 정상)
```
branch 배포 → run.app → 배포 버그 → 수정 → commit → redeploy
   ... run.app 이 작동할 때까지 반복 ...
→ 그다음: main 머지 + 도메인 매핑
```
("merge 후 prod 배포"가 정상 상태; "branch를 스테이징에 배포·반복 후 merge+go-live"가 첫 도달 방법.)

### 로컬 실행 (커밋 전 앱 버그 잡기) — 예: verex
```bash
docker run -d --name verex-pg -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16
# packages/api/.env       → DATABASE_URL=postgresql://postgres:dev@localhost:5432/verex
pnpm --filter @verex/api exec prisma db push && pnpm --filter @verex/api seed
pnpm --filter @verex/api dev        # API :4000
# packages/web/.env.local → NEXT_PUBLIC_API_URL=http://localhost:4000
pnpm --filter @verex/web dev        # web :3000 → http://localhost:3000 에서 확인
```

<!-- 메모 (2026-06-25): Notion은 지식이 머무는 층(durable knowledge store), Slack/Claude Tag는 그 위에 얹는 위임 층(real-time delegation). 둘은 대체재가 아니라 다른 층위 — 지금 솔로 단계의 실질 조합은 Notion(지식) + Claude Code/Cowork(위임). -->

---

## 🤖 Project (Notion 미러)

> Notion 🤖 Project 페이지 내용을 옮겨옴. _(2026-06-25)_

### 기본 원칙
- Code Review는 하지 않는다.
  - 다만 보안상/기능상 크리티컬한 부분은 사람이 리뷰한다.

### 기타
- 노트는 꼼꼼히 관리한다. 대신 다 쓴 것을 버려도 좋다.
  - 버리지 말고 캐논 스캐너를 이용하자.
- Policy Responses
  - 아마존은 정말 중요한 Billing 기능은 철저한 사람의 리뷰를 거친다.

### Tools
1. 어떻게 아이디어를 공유할 것인가? Miro or FigJam?
   1. 일단 FigJam 쓰다가 나중에 필요하면 바꾸는 것도 괜찮음. 어차피 Miro 쓰는 데 문제없음.
   2. FigJam 그냥 써도 됨. 가이드만 잘 만들어 놓으면 되지.
2. 기본 설계 문서는 GitHub md 파일
   1. 보안이 필요하면 Google Drive 문서
   2. 그림을 그리려면 Excalidraw 이용

### Claude 개발 프로세스
#### 기본
- 병행 실행을 위해서 리포지토리는 나누는 게 좋을 수 있다.

#### 폴더 구조
- docs
  - architecture — 중요한 아키텍처 결정에 대한 문서
  - history — 완료된 작업에 대한 정리
  - plan — features.md
  - tasks — 개발자에 의한 작업 명세 / 클로드에 의한 설계 파일

#### 프로세스
1. 전체 프로젝트 개요 작성
   1. Google Docs에 파워포인트 생성 — Excalidraw와 스크린 캡처를 이용해 화면 생성·붙이기
   2. features에 개괄적 기능 명세 — 일정 등도 README.md에서 함께 관리
   3. 기능 관리를 GitHub 이슈로 할지 고민 필요 (상세 설계는 문서 대신 이슈로, 공동 작업 시 특히 유용)
2. task 파일을 만들고 design 파일을 요청한다 (예: `jun-19-task.md`, `jun-19-task-design.md`)
3. design 파일을 통해 중요 사항 결정
4. design 파일을 기반으로 작업 진행
5. 작업 완료 후 history 폴더에 작업 이력 남기기 (중간 체크포인트도 기록)
6. 모든 작업은 브랜치와 PR을 통해 검증한다.
7. 사실 정리하는 시간에 시킬 일을 그냥 시킨다.

### 협업/지식 도구 (2026-06-25)
- **Notion = 지식이 머무는 층 (durable knowledge store)** — 스펙·태스크·리서치 노트처럼 오래 남기고 다시 찾는 것.
- **Slack / Claude Tag = 위임이 일어나는 층 (real-time delegation)** — Notion을 컨텍스트 소스로 읽어서 일한다. Notion을 대체하지 않는다.
- 둘은 경쟁재가 아니라 다른 층위. 솔로 단계의 실질 조합 = **Notion(지식) + Claude Code/Cowork(위임)**.
- Claude Tag는 현재 Enterprise/Team Slack 한정 → 솔로면 지금은 못 씀. 팀 셋업이 생기면 그때 위임 층으로 얹는다.
