# Sub Agents — 좁은 에이전트 & Dispatch 정리

> 좁은(narrow) 에이전트를 여러 개 두는 것과 "Dispatch"를 어떻게 엮어 쓰는지, 그리고
> 화면의 **Dispatch (Beta)** 제품 기능과 일반 **Dispatch 패턴**의 차이를 정리한다. _(2026-06-04)_

---

## 1. 좁은 에이전트(Narrow Agent)란

- **좁다 = 범위가 좁다 = 한 가지 일만 잘한다.** (범용 비서의 반대)
- 여러 일이 필요하면 → **좁은 에이전트 여러 개**로 나눈다.
- 비유: 좁은 에이전트 = **한 업무 전담 직원 한 명**. 여러 에이전트 = 직원 여러 명, 각자 자기 일만.

---

## 2. 여러 에이전트의 "실제 UI"는 어떻게 생겼나

채팅창 여러 개가 아니다. 실무 에이전트는 대부분 **채팅창이 없다.** 보통 셋 중 하나:

| 형태 | 설명 | UI |
|------|------|----|
| **(a) 백그라운드/스케줄 에이전트** ⭐가장 흔함 | 정해진 시각에 혼자 돌고 결과물(파일·알림)만 남김 (예: 모닝리포트) | UI 없음 |
| **(b) 오케스트레이터 + 서브에이전트 (Dispatch 패턴)** | 한 세션에만 말하면, 안에서 서브에이전트를 조용히 띄워 일을 나눔 | 채팅창 안 늘어남 |
| **(c) 통합 대시보드 (control plane)** | 여러 독립 에이전트 결과를 한 화면에 모음 | 진짜 "제품 UI" |

> 핵심: **백그라운드 일꾼 N + 결과 화면 1장**이 정상. 채팅창 N개가 아니다.
> 채팅창은 Jay가 "지시·수정"할 때만 쓰는 입구일 뿐.

```
[채팅창 1개]            ← 가끔 지시/수정
     │
[스케줄러]              ← 좁은 에이전트 A·B·C를 각자 정해진 시각에 실행 (백그라운드)
     │
[대시보드(아티팩트) 1장] ← 세 에이전트 결과를 한 화면에 모아서 봄
```

### Scheduled 항목 1개 = 좁은 에이전트 1명
- 스케줄러는 **"언제 깨울지"만** 정함. 에이전트의 실력·행동은 전부 그 폴더의 **`SKILL.md`** 가 결정.
- 새 에이전트 만들기 = **새 폴더 + `SKILL.md` 작성 + cron 등록**이 전부.
- 현재 Jay의 Scheduled에 이미 독립 에이전트 3개: `morning-blockchain-report`, `morning-checkin`, `claude-notion-inbox`.

---

## 3. "Dispatch" 두 가지 — 같은 단어, 다른 것 ⚠️

이름이 같아 헷갈리지만 완전히 다르다.

| | **Dispatch 패턴** (개념) | **Dispatch (Beta)** (제품 기능, 화면의 버튼) |
|---|---|---|
| 정체 | 오케스트레이터가 서브에이전트에 일을 나눠 병렬 실행하는 **아키텍처 패턴** | **폰(Claude 모바일 앱)에서 던진 작업을 데스크톱 Claude가 대신 실행**해 두는 원격 작업 기능 |
| 형태 | 버튼이 아니라 "일하는 방식" | 실제 UI 버튼 (research preview, Pro/Max, macOS·Windows) |
| 구현 | Task/서브에이전트, Opus 4.8 "dynamic workflows" | Cowork 위에 얹힌 "원격 작업 배정" 레이어 (로컬 파일·커넥터·플러그인 접근) |
| 예시 | 컨트랙트 50개를 서브에이전트 10명이 동시 점검 | 외출 중 폰으로 "오늘 온체인 이상 확인해서 정리해둬" → 집 데스크톱이 실행 |

> Day 13 코스가 오케스트레이터/서브에이전트 개념을 "Dispatch 패턴"이라 불러서 용어 혼동이 생김.
> **Scheduled = 정기 자동 / Dispatch(제품) = 즉석 원격 지시** → 둘은 **보완재**.

---

## 4. 좁은 에이전트 × Dispatch 패턴 — 3단계로 엮기

둘은 대체재가 아니라 **층(layer)**. 좁은 에이전트 = "몇 명 둘까", Dispatch 패턴 = "한 명이 큰 일을 어떻게 쪼갤까".

### Level 1 — 독립 병렬 (지금 상태)
- Scheduled에 좁은 에이전트 N개. 각자 자기 시각에 돌고 결과를 정해진 위치에 저장. Dispatch 없음.
- 쓸 때: 일들이 서로 독립적이고 실행 시점이 다를 때.

### Level 2 — 에이전트 내부 Dispatch (fan-out)
- **바깥에서 보면 똑같은 에이전트 하나인데, 속으로만 일을 나눠 동시에 처리해 빨리 끝낸다.**
- 예: 모니터링 에이전트가 컨트랙트 50개를 → 순차 500초 vs 서브에이전트 10명에 분배 약 50초.

| | Level 1 (에이전트 추가) | Level 2 (내부 Dispatch) |
|---|---|---|
| Scheduled 항목 수 | 늘어남 (직원 +1) | **그대로 (1개)** |
| 입력/출력 | 새 출력 | **동일 입력·동일 출력** |
| 서브에이전트 | — | 일할 때만 생겼다 끝나면 사라짐 (일회용) |
| 바뀌는 것 | 조직도 | **속도뿐** |

> "구조는 안 바뀜, 속도만" = Scheduled 목록·입출력은 동일, 실행 시간만 단축.
> 쓸 때: 한 실행이 "같은 종류의 일 × 많은 개수"라 느릴 때만. 작은 일(컨트랙트 3개)은 순차로 충분.

### Level 3 — 오케스트레이터 (control plane)
- 좁은 에이전트들 위에 "총괄" 1개를 둬서 결과를 모아 하나의 판단/브리핑으로 합침.
- 예: 매일 09:30 "아침 총괄"이 ① 모니터링 alerts ② 모닝리포트 ③ Verex 이슈를 읽어 → "오늘 최우선 3가지" 한 화면으로.
- 쓸 때: 여러 도메인 결과를 통합 의사결정해야 할 때. **이게 팔 수 있는 제품의 control plane 원형.**

---

## 5. 엮는 접착제 = 공유 상태 + 느슨한 결합

에이전트끼리 직접 대화시키지 말고, **약속된 장소에 쓰고/읽게** 한다.

- 각 좁은 에이전트 → 결과를 **고정 위치**에 저장 (`alerts.md`, `report-YYYY-MM-DD.md`, Notion 섹션, `mike-memory.md`).
- 오케스트레이터 → 그 위치들만 읽음.
- 사람(Jay) → **아티팩트 대시보드 한 장**으로 통합 뷰.
- 이렇게 하면 한 에이전트를 고쳐도 다른 게 안 깨짐 (loose coupling).

### 설계 원칙 4개
1. 에이전트당 **책임 하나**
2. 결과 **저장 위치 고정**
3. **멱등(idempotent)** — 재실행해도 안전
4. 각자 **로그** 남겨 추적

### 현실적 주의
너무 많이 깔면 (a) 실행 시간 겹침 (b) 같은 MCP 토큰·rate limit 경합 (c) 추적 난이도 ↑ → **결과를 한 대시보드로 모아 보는 게 같이 가야** 관리됨.

---

## 6. Jay가 30일 안에 만들 수 있는 좁은 에이전트 후보 3개

선정 기준: 모닝리포트 스택(스케줄 + MCP + Claude) 재사용 + 본인에게 먼저 쓸모(dogfooding → 레퍼런스).

| 후보 | 하는 일 | 타겟 고객 | ROI 1줄 |
|------|---------|-----------|---------|
| **A. 온체인 모니터링·이상탐지** ⭐ | 지갑/컨트랙트 집합을 주기 점검 → 대형 이체·의심 approve·실패 tx·가스 급등·잔고 변화 요약+알림 | 소형 핀테크·DAO 트레저리·NFT 운영자 | 수동 확인 주 X시간 → 0, 사고 인지 수시간 → 즉시 |
| **B. 규제·뉴스 워치** | 특정 소스(GENIUS Act, CFTC, SEC 크립토, 스테이블코인) 매일 스캔 → 구조화 브리핑 | 핀테크 컴플라이언스, 소형 크립토 펀드/리서치 | 리서치 시간 절감 + 놓친 규제 이벤트 0건 |
| **C. Verex 이슈 트리아지** | GitHub 이슈/문서/티켓 분류·요약·리스크 플래그·초안. `docs/issues/`에서 "오늘 닫을 가장 작은 항목 1개" 제안 | 세무·회계, 소형 로펌, 소규모 SaaS 지원팀 | 건당 처리시간 단축 + 분류 일관성 |

**첫 빌드 추천: A 또는 C** — 스택 재사용률 최고 + 즉시 쓸모(작동 영상 + before/after 수치 확보 가능). C는 Jay의 막힌 흐름(매매일지·Verex 1칸)까지 풀어줘 개인 ROI가 더 빠름.

내부 버전 아키텍처(= 지금 모닝리포트와 동일):
```
스케줄 태스크(cron)
  → MCP 연결(RPC/Etherscan · GitHub · Notion · Calendar)
  → Claude가 수집·판단·요약
  → 파일로 리포트 저장 + present
  → (선택) 임계치 넘으면 알림
```

---

## 7. 권장 로드맵

1. **지금**: 좁은 에이전트를 독립 Scheduled로 늘린다(모니터링 추가). 결과를 공통 위치에 저장 — **Level 1**.
2. **느려지면**: 그 에이전트 **내부만** Dispatch(fan-out)로 병렬화 — **Level 2** (구조 그대로, 속도만).
3. **통합이 필요해지면**: "아침 총괄 오케스트레이터" 1개 추가 — **Level 3**.

> 한 줄 요약: 좁은 에이전트로 **직원 수**를 늘리고, Dispatch(패턴)로 **한 직원의 대량 작업**을 병렬화하고, 오케스트레이터로 **여러 결과를 한 판단**으로 묶는다. Level 1→2→3은 필요할 때만 올라간다.

---

## 8. Agent Teams · Subagents · tmux 보기 (2026-06-22)

> 한 요청에 멀티 에이전트를 돌리고 화면으로 보는 법. (Claude Code, 터미널)

세 단계:

| 단계 | 정체 | 누가 대화 | 트리거 |
|---|---|---|---|
| 나 혼자 | 단일 세션 | — | 일반 요청 |
| **서브에이전트**(Workflow) | 서브태스크 도우미 | **나에게만** 보고 | 프롬프트에 **`ultracode`** |
| **Agent Teams** | 병렬 팀원 | **서로 + 당신** | env 플래그 (verex 전용) |

### 서브에이전트 — `ultracode`
- 프롬프트 아무 곳에나 **`ultracode`** → 그 턴이 여러 서브에이전트로 fan-out. **설정 불필요, 어느 repo나.**
- 나에게 보고(서로 대화 X). 진행은 **`/workflows`** 로 봄.

### Agent Teams (verex 전용)
- `verex/.claude/settings.local.json` 에 `"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"` + `"teammateMode": "auto"`. gitignore라 개인용 → **verex에서만** 켜짐.
- 팀원끼리 메시지, 실시간 조종. 세션당 팀 1개, **3~5명** 권장, 단일 세션 대비 **~7배 토큰**.

### tmux — 에이전트 화면 보기 (핵심)
tmux는 **표시 전용**: 팀원을 각자 패널로 보여줌. 켜든 끄든 에이전트 실행은 동일.

```bash
tmux new -s verex          # 1. 먼저 tmux 세션 시작
cd /Users/jay/work/verex   # 2. verex로 이동
claude                     # 3. 재시작(설정 로드) 후 팀 spawn
```
`teammateMode: "auto"` 라 tmux 안이면 팀원을 패널로 자동 분할.

치트시트 (프리픽스 `Ctrl-b` 누른 뒤):

| 키 | 동작 |
|---|---|
| `Ctrl-b` ←/→/↑/↓ | 패널(팀원) 이동 |
| `Ctrl-b` `z` | 한 패널 전체화면(토글) |
| `Ctrl-b` `q` | 패널 번호 표시 |
| `Ctrl-b` `o` | 다음 패널로 순환 |
| `Ctrl-b` `d` | detach (에이전트는 백그라운드 계속) |
| `tmux attach -t verex` | 재접속 |
| `tmux ls` | 세션 목록 |
| `tmux list-panes -a` | 모든 패널(=모든 팀원) 목록 |

인앱(tmux 없이도): `Ctrl-T` 작업목록 · `↑/↓` 팀원 선택, `Enter` 열기/메시지 · `Esc` 중단.
**규칙:** tmux + `Ctrl-T` = **팀원**, `/workflows` = **서브에이전트**.

### 비용
- 팀 ≈ 단일 세션의 **7배 토큰**. Claude Max는 5시간+주간 한도를 더 빨리 소진(돈 청구 X, 스로틀). 먼저 **`/usage`**.
- 팀 실행 전 **사전 경고 없음** — `/usage-credits`(Max)나 Console 워크스페이스 상한으로 직접 캡.

### 보너스 — 터미널 스크린샷
- `Cmd+Ctrl+Shift+4` 로 복사 → Claude Code에서 **`Ctrl+V`** (Cmd+V 아님). 또는 이미지 파일 드래그, 경로 입력(`Analyze /path/to/error.png`).

---

## 9. 설정 레퍼런스 — 권한 자동 통과 & Agent Teams (settings.json) (2026-06-24)

> 무인(hands-off) 실행과 Agent Teams를 위한 `settings.json` 설정 모음. 나중에 참고용.
> 위치: `~/.claude/settings.json`(전역) 또는 프로젝트 `.claude/settings.local.json`(개인, gitignore).

### A. 권한 프롬프트 자동 통과 (hands-off)

권한 모드 `permissions.defaultMode`:

| 모드 | 파일 편집(Write/Edit) | 셸 명령(git, pnpm…) |
|------|----------------------|---------------------|
| `acceptEdits` | ✅ 자동 | ❌ 여전히 물음 |
| `bypassPermissions` | ✅ | ✅ 자동 (전부) |

**완전 무인(프롬프트 0):**
```jsonc
{
  "permissions": { "defaultMode": "bypassPermissions" },
  "skipDangerousModePermissionPrompt": true   // bypass 경고 사전 수락 (top-level 키!)
}
```

**꼭 알아둘 함정:**
- **재시작 필요** — `defaultMode`는 세션 *시작* 시 적용됨. 중간에 바꿔도 현재 세션엔 적용 안 됨 → 앱 재시작.
- **복합 명령은 allow-list로도 안 통과** — 파이프 `|`, `$(...)`, `${...}`, `;` 가 든 명령은 "정적 분석 불가"라 규칙과 무관하게 물어봄. **오직 `bypassPermissions`만** 이걸 건너뜀.
- `bypassPermissions` = *모든* 프롬프트 생략(파괴적 명령 `rm`·force-push 포함). **본인 샌드박스 repo에서만** 권장.

**덜 위험한 대안 — allow-list만 넓히기** (단순 명령만 자동 통과):
```jsonc
{ "permissions": { "allow": ["Bash(pnpm:*)", "Bash(git add:*)", "Bash(gh pr create:*)"] } }
```
(복합/expansion 명령은 위 이유로 여전히 물을 수 있음.)

> **실제 적용됨 (2026-06-26, `task/.claude/settings.local.json` → `permissions.allow`):**
> 기존 배열에 **병합**(덮어쓰기 X)으로 아래 2개 추가.
> ```jsonc
> "Bash(pnpm:*)",     // pnpm install/db:push/dev … 자동 통과 (기존 node·npx 허용과 일관)
> "Bash(docker:*)"    // 로컬 Postgres 검증 등 — rm 등 파괴적 서브명령 포함하므로 주의
> ```
> → 단순 `pnpm`·`docker` 명령은 자동 통과. **단 `${...}`/파이프가 든 명령은 여전히 물음**("Contains expansion" 가드, §12 참고).

#### 실전: 설정했는데도 계속 물어볼 때 (2026-06-24)
- **`defaultMode`는 세션 *시작* 시에만 적용** → 중간에 바꾸면 현재 세션은 그대로 물어봄.
  **앱 재시작** 필요 (+ `skipDangerousModePermissionPrompt: true` 도 함께 넣어야 bypass 경고까지 생략).
- **어떤 명령은 allow-list로 *절대* 안 통과** (규칙을 추가해도 소용 없음):
  | 패턴 | 프롬프트에 뜨는 이유 |
  |------|----------------------|
  | `cd … && …` + 리다이렉션(`>`/`2>`) | *"cd with output redirection — path resolution bypass"* |
  | `${...}` / `$(...)` / 파이프 `\|` | *"Contains expansion"* / "정적 분석 불가" |
  → 이런 명령은 **활성화된 `bypassPermissions`만** 건너뛴다. allow-rule로는 못 막음.
- **해법 두 가지:**
  - **A. bypass 켜기** — `skipDangerousModePermissionPrompt: true` + **재시작**. 프롬프트 0, 단 안전망 없음.
  - **B. 단순 명령 쓰기 (권장)** — `cd`·파이프·`${...}`를 피하고 **절대경로 / `git -C` / 단순 명령**을
    쓰면 기존 `Bash(pnpm:*)`·`Bash(grep:*)` 같은 allow-rule에 매칭 → **안 물어봄 + 안전망 유지**.

#### ⚠️ bypass 최악의 경우 (worst case) & 안전 수칙
bypass = 권한 프롬프트(=위험한 동작 실행 *전에* 당신이 막을 마지막 체크포인트)를 없앰.
잘못되면(내 실수·버그·악성 지시) **검토 없이 즉시 실행**된다.

| 분류 | 최악의 경우 |
|------|------------|
| 💀 데이터 손실 | 잘못된 `rm -rf` / `git reset --hard` / `git clean` → **커밋 안 된** 작업 소실 |
| 💸 비용 | `gcloud` 로그인 상태 → 잘못된 배포가 과금 리소스(Cloud SQL/Run) 생성 → 실제 청구 |
| 🔓 보안 / 프롬프트 인젝션 | 읽은 파일·웹·이슈에 숨은 지시("삭제/curl 실행/비밀 push")를 **프롬프트 없이** 수행 → 비밀 유출 가능 (가장 위험) |
| 🌐 원격 손상 | `git push --force` 가 원격 히스토리 덮어씀; 잘못된 자동 머지 |

**현실적 위험(당신 기준):** Claude가 폭주하는 게 아니라 — ① 클라우드/배포 중 잘못된 명령이 **돈을 태우거나 DB를 망가뜨림**, ② 신뢰 안 된 콘텐츠가 **해로운 명령을 주입** — 둘 다 막을 프롬프트가 없음.

**안전 수칙:**
1. **범위가 명확한 작업에만** (예: "이 코드 빌드"). 신뢰 안 된 외부 콘텐츠(웹·임의 repo·메일)를 읽는 세션엔 **끄기**.
2. **평상시/탐색엔 OFF** (`default`/`acceptEdits`로). 항상 켜두지 말 것.
3. **돈 상한:** 배포 전 **GCP 예산 알림/청구 한도** 설정 — 가장 가치 큰 안전장치.
4. **자주 커밋** — 커밋돼 있으면 `rm`/`reset` 피해가 작음.
5. **프로젝트 스코프 유지**(verex만, 전역 X) → 영향 범위(blast radius) 축소.

**결론:** 본인 샌드박스의 "코드 빌드" = 저위험. 클라우드/돈/신뢰 안 된 콘텐츠를 건드리면 = 프롬프트 켜둘 것.
특정 무인 실행에만 잠깐 켰다가 다시 끄는 걸 권장.

### B. Agent Teams 켜기 (나중에 쓰려고)
```jsonc
{
  "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" },  // 팀 가능하게 (실험적)
  "teammateMode": "auto"                                   // tmux 안이면 팀원을 패널로 분할
}
```
**주의:**
- **재시작 필요** — `env`는 시작 시에만 읽힘.
- 켠다고 자동으로 팀 생성 X — 작업이 맞거나 직접 요청할 때만.
- 현재는 `verex/.claude/settings.local.json`에만 켜둠(gitignore, 개인용, verex 전용).

---

## 10. 훅(hook) — "매번 X일 때 Y" 자동 동작 (2026-06-24)

> 자동·반복 동작은 **CLAUDE.md 규칙이 아니라 훅**으로 만든다. 규칙은 모델 판단(불확실),
> 훅은 하니스가 이벤트마다 **결정적으로** 실행.

### CLAUDE.md 규칙 vs 훅
| | CLAUDE.md 규칙 | 훅 (settings.json) |
|---|---|---|
| 실행 주체 | 모델(기억할 때만) | 하니스(이벤트마다 결정적) |
| 적합 | "이런 식으로 일해줘"(판단) | "매번 X 일어나면 Y 해라"(자동) |

→ "history 파일이 바뀔 때마다 복사" 같은 자동 동작은 **훅**. ("중요한 걸 그때그때 history에
기록" 처럼 *판단*이 필요한 건 CLAUDE.md 규칙 — [[feedback]] 참고.)

### 예: 프로젝트 history를 task/docs/history로 집계
`PostToolUse`(Write|Edit) 훅 — 편집된 파일이 `*/docs/history/*.md`면 task repo로 **프로젝트명을
붙여** 복사:
```
verex/docs/history/2026-06-24.md        →  task/docs/history/2026-06-24-verex.md
task/rabbit/docs/history/2026-06-24.md  →  task/docs/history/2026-06-24-rabbit.md
```
`~/.claude/settings.json` (전역):
```jsonc
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit|MultiEdit",
      "hooks": [{
        "type": "command",
        "command": "f=$(jq -r '.tool_input.file_path // empty'); case \"$f\" in */docs/history/*.md) ;; *) exit 0;; esac; case \"$f\" in \"$HOME/work/task/docs/history/\"*) exit 0;; esac; proj=$(basename \"$(dirname \"$(dirname \"$(dirname \"$f\")\")\")\"); base=$(basename \"$f\" .md); mkdir -p \"$HOME/work/task/docs/history\"; cp \"$f\" \"$HOME/work/task/docs/history/${base}-${proj}.md\""
      }]
    }]
  }
}
```
**주의:**
- **훅은 세션 시작 시 로드** → 추가 후 앱 재시작해야 적용.
- **잘못 만들면 조용히 실패** → `update-config` 스킬로 pipe-test 후 적용 권장.
- `case` 가드가 history 아닌 편집은 즉시 통과시켜 가볍다.
- task repo 자신의 history는 건너뜀(자기 복사/루프 방지).

---

## 11. OneNote MCP — Claude Desktop 연결 (2026-06-24)

> OneNote 데이터를 Claude가 읽고 쓰게 해주는 MCP 서버. 노트북·섹션·페이지를 조회/생성/편집.
> repo: <https://github.com/danosb/onenote-mcp>

### 설치 & 설정 (Claude Desktop 또는 다른 MCP 호환 어시스턴트)

1. repo를 **클론**하고 README의 설치 단계를 따른다.
2. MCP 서버 **시작**: `npm start`
3. Claude Desktop 설정에서 OneNote MCP 서버를 **추가**:
   - **Name**: `onenote`
   - **Command**: `node`
   - **Args**: `["/path/to/your/onenote-mcp.mjs"]` (반드시 **절대경로**)

JSON 설정 예시:
```json
{
  "mcpServers": {
    "onenote": {
      "command": "node",
      "args": ["/absolute/path/to/your/onenote-mcp.mjs"],
      "env": {}
    }
  }
}
```

4. 이제 Claude에게 **OneNote 데이터를 다뤄달라고** 요청할 수 있다.

> 참고: `node` 실행 + `.mjs` 절대경로 방식 → 이 repo의 [[sub-agents]] 다른 MCP 설정(절대경로 권장)과 동일 패턴.

---

## 12. 권한 프롬프트 실전 복기 — 왜 bypass인데도 물었나 (2026-06-26)

> §9의 실증. Task 1(rabbit) 빌드 중 프롬프트가 9개 떴는데, 원인이 또렷이 갈렸다.

- **`task/.claude/settings.local.json`엔 이미 `bypassPermissions` + 넓은 allow-list가 있음** — 그런데도 프롬프트가 떴다.
- 원인별 분류:

  | 떴던 명령 | 원인 | 막을 수 있나 |
  |---|---|---|
  | `cd <dir> && git …`, `cd <dir>; for…cat`, `cd <dir>; printf > file` | **cd + git/리다이렉션/복합** → un-bypassable 가드 (*"path resolution bypass"*) | allow-rule로 **불가**. 활성 bypass만 건너뜀 |
  | `node …tsc 2>&1 \| head; echo "${PIPESTATUS[0]}"` | **`${...}` expansion + 파이프** | 동일 (정적 분석 불가) |
  | `docker version …`, `docker run …` | **docker가 allow-list에 없음** | ✅ allow-rule 가능 ("Always allow") |

- **결론(가장 중요):** 9개 중 8개는 내 **명령 스타일** 탓(`cd` 복합 / expansion) — 설정으로 못 막는 범주.
  → **진짜 해법은 설정이 아니라 행동:**
  1. `cd … && git` → **`git -C <dir> <cmd>`**
  2. `cat` / `sed` / `for f…cat` → **Read/Grep/Glob 도구** (Bash를 안 거침 → 프롬프트 0)
  3. **절대경로, `cd` 금지**; 복합명령 내 `${...}` / `$(...)` / `PIPESTATUS` 회피

  > ⛔ **가장 자주 재발(파일 N개 읽기) — 이 한 줄만 기억:**
  > ```bash
  > # ❌ 절대 금지 — "Contains expansion" 가드로 매번 물음
  > for f in a.ts b.ts c.ts; do echo "== $f =="; cat "$f"; done
  > ```
  > ```text
  > # ✅ 대신: 한 메시지에서 Read 도구를 파일 수만큼 병렬 호출
  > Read(a.ts)  Read(b.ts)  Read(c.ts)   ← Bash 안 거침 → 프롬프트 0, 더 빠름
  > ```
  > 여러 파일을 훑을 땐 **Bash 루프가 아니라 병렬 Read**. 검색이면 Grep/Glob. cat/sed/for를 셸로 쓰지 말 것.
- **설정으로 메울 수 있는 빈틈(allow-list):** `pnpm`·`docker`가 없었음 → `settings.local.json`의 `allow`에 **`"Bash(pnpm:*)"`, `"Bash(docker:*)"` 추가(병합)** (2026-06-26 반영). 이미 `node`·`npx` 허용 중이라 일관.
  - ⚠️ 단, **`${...}`/파이프가 든 명령은 이걸 추가해도 여전히 물음** — "Contains expansion" 가드는 allow-rule로 못 막고 **활성 bypass만** 건너뜀. → 내가 명령을 **단순하게(파이프·`${PIPESTATUS}` 없이)** 써야 사라짐.
- **무인 실행 공식:** `bypassPermissions`(이미 설정) **+ 내가 `cd`를 절대 안 쓰기**. 세션이 bypass를 안 따르면 재시작 / 대화형은 **Shift+Tab** / `claude --dangerously-skip-permissions`. (§9-A 함정: `defaultMode`는 세션 *시작* 시에만 적용.)

> 한 줄: "설정은 이미 최대치 — 남은 프롬프트는 (a) **끌 수 없는 cd 가드** + (b) **내 cd 습관**." 둘 다 allow-rule이 아니라 *명령을 바꿔서* 없앤다. → §9 보강.

---

## 13. pnpm 11.5 + Prisma — `allowBuilds`로 빌드 스크립트 허용 (2026-06-26)

> Task 1(rabbit)에서 `pnpm db:push` / `pnpm install`이 `ERR_PNPM_IGNORED_BUILDS`로 계속 실패한 건
> **권한이 아니라 pnpm의 빌드-스크립트 차단** 때문. (위 §12 권한 가드와 별개의 문제.)

- **원인:** pnpm 11.5는 의존성의 `postinstall`/build 스크립트를 **기본 차단**(공급망 보안). Prisma는 그게
  필수 — `@prisma/engines`(쿼리 엔진 다운로드) · `@prisma/client`(클라이언트 생성). 게다가 pnpm은
  `pnpm <script>` 전에 deps-status 체크를 돌려서, 이 차단이 **모든 pnpm 명령**(`db:push`·`install`·`dev`)을 하드 실패시킴.
- **함정:** 옛 키 **`onlyBuiltDependencies`(리스트)는 pnpm 11.5에서 무시됨**. 새 키는 **`allowBuilds`(맵)**.
  pnpm이 직접 `pnpm-workspace.yaml`에 템플릿(`'pkg': set this to true or false`)을 써준다 — 이게 힌트.
- **해결** — `rabbit/pnpm-workspace.yaml`:
  ```yaml
  allowBuilds:
    '@prisma/client': true
    '@prisma/engines': true
    prisma: true
  ```
  그 후 **`pnpm install --force`** 한 번. (일반 install은 "Already up to date"라 빌드를 안 돌림 → `--force`로 강제 실행 → 엔진 다운로드 + 클라이언트 생성.)
- **표준 대안:** 대화형 `pnpm approve-builds`(prisma 3개 선택) — 같은 `allowBuilds` 항목을 써준다.
- **빠른 우회(필요 시):** pnpm을 안 거치고 `node node_modules/prisma/build/index.js generate` /
  `… db push` 를 직접 실행하면 pnpm의 deps-check 자체를 건너뛴다.

> 한 줄: pnpm 11.5는 prisma 빌드를 막는다 → `pnpm-workspace.yaml`에 **`allowBuilds: {prisma: true, …}` + `install --force`**.

---

## 참고 (Sources)
- Fortune — _I used Claude's new Dispatch feature for a month_
- AI Tomorrow (Medium) — _Meet Dispatch: assign tasks from anywhere_
- _What Is Claude Dispatch? (And Why It Changes How You Work)_
- Claude & Agents 코스 Day 13 — "Dispatch 패턴 (오케스트레이터/서브에이전트)"
