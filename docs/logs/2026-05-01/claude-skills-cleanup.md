# Claude Skills Cleanup (2026-05-01)

> **Category**: Refactor
>
> 두 개의 user-level Claude Code skill (`coding-principles`, `summ`)을 정리. 첫 번째는 frontmatter / 마크다운 구조를 표준 포맷에 맞게 다시 작성, 두 번째는 출력 위치를 GitHub 기반 task repo에서 iCloud 자동 동기화 폴더로 옮김.

---

## What was done

- **`coding-principles` SKILL.md 정상화**
  - YAML frontmatter 추가 — `name` 필드 + trigger 중심 `description` ("non-trivial code 작업 시 적용 / trivial 변경 skip")
  - `1. Think Before Coding` 같은 ordered-list-item으로 잘못 파싱되던 "헤딩"들을 진짜 `##` 마크다운 헤딩으로 변환
  - sub-point들을 명시적 bullet으로 분리해 시각적 한 덩어리 → 단계별 구조로
  - Tradeoff 라인은 blockquote로, 핵심 self-check 질문은 *italic* 강조 추가
- **`summ` SKILL.md 출력 경로 이전**
  - `/Users/jay/work/task/docs/` → `/Users/jay/Library/Mobile Documents/com~apple~CloudDocs/web/daily-log/`
  - master 페이지 이름 변경: `know-summary.html` → `summary.html` (이제 standalone이라 know prefix 불필요)
  - 기존 `know.html` "Today's Learnings" 업데이트 단계 제거 — 다른 repo이고 깨진 링크 발생할 위치라 정리에 부적합
  - git commit + push 단계 제거 — iCloud Drive가 자동 동기화하므로 중복
  - 경로에 공백이 있으니 shell quoting 주의 노트 추가
- **이 detail 페이지 + `summary.html` 새로 생성** — 새 skill 정의대로 첫 실행이라 master 페이지 처음부터 작성

## Techniques & Learnings

- **Skill 트리거 정확도는 description의 첫 문장이 결정.** 모델은 skill body가 아니라 frontmatter description만 보고 "지금 이 skill을 호출할까"를 판단함. "무엇인가" 보다 "언제 호출하는가"를 명시해야 적절한 순간에만 켜짐. (예: "Apply when implementing or modifying code in non-trivial tasks. Skip for typo fixes.")
- **마크다운에서 `1. Heading` 은 헤딩이 아니라 ordered list item.** 그 아래 들여쓰기된 내용들이 같은 list item에 포섭돼 시각적으로 한 덩어리로 보임. 진짜 헤딩이 필요하면 `## 1. Heading`으로.
- **Storage backend 변경 시 downstream coupling을 같이 audit.** docs/ → iCloud로 옮길 때 docs/ 경로를 참조하던 know.html 업데이트 단계와 git commit 단계를 함께 제거. 안 그러면 깨진 링크 + 의미 없는 commit이 남음.
- **iCloud Drive를 git 대안으로 쓰는 패턴.** 디바이스 간 자동 sync, version control 없음. 협업/롤백 필요 없는 개인 로그/노트엔 git 보다 마찰 적음. (단점: 충돌 발생 시 마지막 쓴 게 이김, history 없음)

## Idiom of the Day

> *"iron out the kinks"* — to fix small problems or imperfections in something that is mostly working but not yet smooth.

**In context**: "The two skills already worked, but they had rough edges — missing frontmatter, broken markdown headings, paths pointing at the wrong place. We just *ironed out the kinks* so they trigger reliably and write to the right folder."

---

[← Back to Daily Log Summary](../summary.md)
