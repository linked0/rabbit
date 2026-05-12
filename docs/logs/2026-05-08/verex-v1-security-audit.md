# Verex v1 Security Audit (2026-05-08)

> **Category**: Refactor · **Repo**: verex
>
> Verex W1 산출물 (contracts + SDK + CLI)의 경량 셀프 보안 감사. forge lint warning에서 시작해 디자인 footgun 5개와 검증된 안전 사항 11개를 카탈로그화. plan §11.3에 액션 항목 5개를 트래킹 표로 등재.

---

## What was done (요약)

- **셀프 감사 doc 작성**: HIGH 0 / MEDIUM 1 / LOW 2 / INFO 6. v1 발견의 ~70%가 v2 (CTF + UMA) 도입으로 자동 해소되는 매핑 표 포함.
- **Plan §11.3 신설**: 5개 액션 항목 표 (severity / 트리거 시점 / 코드 위치 링크). audit doc이 owner, plan §11.3은 추적용 — 두 곳 중복 없이 분리.
- **부수 작업**: `verex` CLI 호출 패턴 명확화 (`pnpm verex <subcommand>`), root `package.json`에 `verex` 스크립트 추가 (workspace 패키지 bin shim 자동 생성 안 됨 → command not found 우회).

## Key findings

- **MEDIUM**: 단일 글로벌 owner = SPOF. v2 (UMA optimistic oracle) 도입 시 자동 해소.
- **LOW**: 한쪽 풀 0인 상태에서 winner 쪽 선택 → 자금 영구 동결. v1 운영 절차로 mitigate.
- **LOW**: `getMarkets()` unbounded 배열. 마켓 100+ 시 indexer pagination 필요.
- **INFO ×4**: forge lint의 `block.timestamp` 비교 경고 — 시간 단위가 시/일 grain이라 12s drift 무관, 수용.

## Idiom of the Day

> *"defense in depth"* — multiple independent layers of protection so that if one fails, others still hold. *"audit catalogues 11 verified-safe items via defense-in-depth checks."* (Standard security vocabulary.)

---

## 깊은 내용은 verex 저장소

이 entry는 task repo workspace 인덱싱용 짧은 pointer. 자세한 7-섹션 audit (의도된 v1 단순화, severity 판단 근거, mitigation 분석, v2 handoff 매핑, 재검증 절차)은:

- 📄 `verex/docs/history/2026-05-08-v1-security-audit.md`
- 📄 `verex/docs/history/history.md` 의 2026-05-08 항목

[← Back to Daily Log Summary](../summary.md)
