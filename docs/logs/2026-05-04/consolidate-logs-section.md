# Consolidate Logs Section (2026-05-04)

> **Category**: Refactor
>
> `task` repo의 두 갈래로 나뉘어 있던 일일 로그 ("Today's Learnings" 상단 섹션 + "Dev Logs" 하단 섹션)를 단일 **Logs** 섹션으로 합치고, 흩어져 있던 날짜 폴더(`docs/2026-03-24/`, `docs/2026-04-02/`)를 `docs/logs/` 아래로 모음. `summ` skill도 새 구조에 맞춰 갱신.

---

## What was done

- **날짜 폴더 통합** — `docs/2026-03-24/`, `docs/2026-04-02/` 를 `docs/logs/` 아래로 이동. 이전부터 새 entries는 거기 들어가고 있었는데 과거 entries만 docs/ 루트에 남아있어서 일관성 깨졌던 걸 정리.
- **이동된 3개 HTML 파일의 back-link 갱신** — `../know-summary.html` → `../summary.html`. 한 단계 더 깊어진 것 + 새 master 페이지 가리키게.
- **`know.html` 섹션 통합**:
  - 상단 "Today's Learnings (2026-04-02)" 섹션 → **"Logs"** 섹션으로 교체 (위치는 그대로 맨 위)
  - 하단 "Dev Logs" 섹션 제거 (병합 후 중복)
  - 8개 카드 통합 (날짜 내림차순): May 1 · Apr 2 · Mar 24×2 · Dec 9×4
  - 각 카드에 카테고리별 좌측 보더 색 + rgba 배지 적용 (REFACTOR amber, RESEARCH blue, TECHNIQUE purple, FEATURE green, 기존 nostra entries는 HTML/MD 배지 유지)
  - "View All Logs" 링크를 `docs/logs/summary.html`로 변경
- **`summ` SKILL.md 일관성** — §4 제목과 본문에서 "Dev Logs section" → "Logs section" replace_all (know.html 변경과 매칭).
- **Commit + push**: `0882a1f Reorganize logs: merge Today's Learnings + Dev Logs into single Logs section` (6 files, 342+/42-) → `origin/main`. 이전 미push 3 commits 함께 push.

## Techniques & Learnings

- **Git의 rename detection은 의외로 관대함.** 파일을 `mv` 한 후 back-link 한 줄까지 수정했는데도 git이 98~99% 유사도로 rename으로 잡아줘서 이력이 끊기지 않음. 임계값(기본 50%) 안쪽이면 자동 인식.
- **두 개의 평행 feed보다 단일 feed가 늘 낫다.** "Today's Learnings"(상단)과 "Dev Logs"(하단)는 결국 같은 종류의 entry — 시간만 다른 — 인데 분리돼 있어 어디 들어갈지 매번 결정 비용이 발생했음. newest-first 단일 섹션으로 합치니 결정 비용 0, 가독성 ↑.
- **Color-coded left border + matching badge** — 카테고리별로 보더와 배지 색을 같이 맞추면 한눈에 카테고리가 들어옴. 배지만으로는 시선이 카드 우측에 가야 보이지만, 좌측 보더는 페이지 스크롤 중 주변시야로 인식됨.
- **경로를 옮길 땐 내부 상대 링크부터 audit** — `../know-summary.html` 류 back-link이 한 단계 깊어지면 자동으로 깨짐. `grep -E 'href="\.\.|href="\./'` 한 번 돌려서 깨질 곳 미리 확인하면 사후 수정보다 깔끔.
- **"Dev"라는 단어를 떼는 의미**: 원래 "Dev Logs"는 nostra repo 코딩 작업 로그용이었는데, 이제 skill 사용 학습 / harness 실험 / 보안 연구 등도 같이 들어가니 "Logs"라는 더 일반적인 이름이 맞음. 단어 한 글자 빼는 것도 의미 변화의 신호.

## Idiom of the Day

> *"put your house in order"* — to organize your own affairs, work, or environment properly before doing other things; to fix the disorder you've allowed to accumulate.

**In context**: "The log files had been piling up across two different sections and inconsistent folders for weeks. Today we finally *put the house in order* — one folder, one section, one chronological feed."

---

[← Back to Daily Log Summary](../summary.md)
