# TypeScript infer + Rust Borrowing + LLM Tokenizer Session

**날짜:** 2026-05-12  
**카테고리:** Learning · typescript · rust · llm

---

## 1. TypeScript — infer 키워드

### 핵심 개념
TypeScript 타입 시스템은 **타입을 계산하는 별도의 프로그래밍 언어**다.
타입 컨버트(변환)가 아닌 타입 프로세싱(처리).

### infer 패턴

```typescript
// Promise 안의 타입 추출
type UnwrapPromise<T> = T extends Promise<infer R> ? R : T;

// 함수 첫 번째 인자 타입 추출
type FirstArg<T extends (...args: any) => any> =
  T extends (first: infer F, ...rest: any[]) => any ? F : never;

// 이벤트 핸들러 인자 타입 추출
type EventArg<T extends (event: any) => void> =
  T extends (event: infer E) => void ? E : never;

// 패턴 요약
// Promise<infer R>       → Promise 안의 타입
// (arg: infer A) => any  → 인자 타입
// () => infer R          → 리턴 타입
// Array<infer Item>      → 배열 요소 타입
```

### DeepReadonly — 재귀 타입

```typescript
type DeepReadonly<T> = { readonly [K in keyof T]: DeepReadonly<T[K]> };
// 재귀 종료: string/number 등 primitive는 keyof가 never → 자동 종료
// Readonly는 겉만, DeepReadonly는 끝까지 잠금
```

### viem ABI 타입 추론
- `as const` 없으면 ABI = `object[]` → 타입 추론 불가
- `as const` 붙이면 viem이 infer로 파싱 → 자동완성 + 타입 체크
- **실무 워크플로우:** `forge build` → `wagmi generate` → import해서 사용

---

## 2. Rust — Borrowing Rules

```
&T  (불변 참조) — 여러 개 동시에 OK, 읽기 전용
&mut T (가변 참조) — 딱 하나만, 혼자만, 읽기+쓰기

&T  + &T      → ✅
&mut T        → ✅ (혼자일 때)
&T  + &mut T  → ❌
&mut T + &mut T → ❌
```

- 마지막 `&T` 사용 후 → 빌림 해제 → 그 다음부터 `&mut T` 허용
- 목적: **data race를 컴파일 시점에 원천 차단**

---

## 3. LLM 실습 코드

### 위치
```
/Users/jay/work/task/ai/tokenizer-embedding/
├── main.py          — 토큰화 + 임베딩 + 코사인 유사도
├── pyproject.toml   — uv 프로젝트 (tiktoken 의존성)
└── README.md        — 실행 방법 + 기술 설명
```

### 실행 방법
```bash
cd /Users/jay/work/task/ai/tokenizer-embedding
uv sync                  # 최초 1회 — 환경 생성 + tiktoken 설치
uv run python main.py
```

### Ollama 설치 모델
```
nomic-embed-text:latest   274 MB   ← 임베딩용 (사용 중)
llama3.3:70b              42 GB    ← 대화/생성용
qwen2.5-coder:32b         19 GB    ← 코딩용
```

### 기술 내용

**토큰화 — BPE (tiktoken)**
- Ollama `/api/tokenize` 엔드포인트가 이 버전에 없어서 tiktoken으로 대체
- BPE: 자주 등장하는 문자 쌍을 반복 병합해 vocabulary 구성
- 한국어는 영어보다 2-3배 토큰 소모
- 이더리움 주소(`0x...`)는 토큰 비효율적 → 프롬프트 설계 시 고려

**임베딩 — nomic-embed-text**
- 텍스트 → 768차원 벡터
- 의미 유사할수록 벡터 방향이 같음
- 최대 입력: 8192 tokens

**코사인 유사도 결과**
```
'betting platform' ↔ 'prediction market' → 0.6580  ← 가장 유사
'blockchain'       ↔ 'prediction market' → 0.4695
'Verex'            ↔ 'prediction market' → 0.4185
'예측시장'          ↔ 'prediction market' → 0.4185  ← Verex와 동일!
```
→ 한국어 "예측시장"과 영어 "Verex"가 같은 벡터 → 다국어 임베딩 정상 동작

### 내일 이어서 할 것
- `uv run python main.py` 실행 확인 (tiktoken 버전)
- 코사인 유사도 추가 실험 (더 많은 Verex 관련 텍스트)
- Verex RAG 시스템 연결 구상

---

## 4. Morning Report SKILL.md 변경 사항

- 섹션 헤딩: `## N. 한글` → `## N 영어` (마침표 제거, Obsidian 앵커 호환)
- 백링크: `[▲ 목차로](#목차)` → `[▲ Contents](#contents)`
- 12 English: 10개 혼합 → **구동사 5개 + 어려운 단어/개발 용어 5개**
- 섹션 순서: Tech Item 14번 → **12번** (Interest Tech 바로 다음)

---

## 5. 영어 학습 피드백

Jay 현재 수준: **중급 (6-8/10)**

자주 틀리는 패턴:
- 관사 누락 (`a`, `the`)
- 3인칭 단수 `-s` 누락
- 전치사 선택 (`for` vs `of`, `in` vs `from`)
- 축약어 사용 (`eng` → `English`)

적용 중인 체크 포맷:
```
Your version: (원문)
✅ Corrected: (교정)
💬 More natural: (네이티브 표현)
⭐ Fluency score: X/10 — (피드백)
```
