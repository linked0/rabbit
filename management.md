# 🚀 Project Management

## Collaboration & Infrastructure

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
