# LiteLLM Routing — 로컬↔클라우드 모델 자동 전환

> **오늘의 최소 목표**: `pip install litellm` 후 `python 02_router_rules.py` 한 번 실행 → 작업 종류별로 `cheap`(로컬)/`smart`(클라우드) **라우팅 결정**이 출력되면 성공. (5분, 백엔드 없이도 결정 로직은 확인됨)

LiteLLM은 OpenAI·Anthropic·Ollama 등 서로 다른 LLM 백엔드를 **하나의 인터페이스**(`completion()`)로
호출하게 해주는 라이브러리다. 호출 코드를 특정 백엔드에 종속시키지 않는 게 핵심.

---

## 1. 왜 이게 필요한가

| 항목 | 내용 |
|------|------|
| **단일 인터페이스** | 모델 문자열만 바꾸면 같은 코드로 로컬/클라우드 호출. 백엔드 교체 시 호출부 수정 0. |
| **로컬 vs 클라우드 분리** | 쉬운·민감 작업 → 로컬 Ollama(무료, 데이터 기기 밖으로 안 나감). 고난도 작업 → 클라우드 OpenAI(품질 우선). |
| **Router 규칙 라우팅** | 별칭(`cheap`/`smart`)을 등록하고 "작업 종류"로 자동 분기. 매번 모델명을 손으로 고를 필요 없음. |
| **점진적 비용 절감** | 일상 작업을 로컬로 흘려보내 클라우드 호출(=비용)을 고난도에만 집중. |

---

## 2. 설치

```bash
cd /Users/jay/work/task/ai/litellm-routing
/usr/bin/python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt          # litellm
```

백엔드 준비 (선택 — 없어도 라우팅 결정은 확인 가능):

```bash
# 로컬
ollama serve
ollama pull llama3.3:70b
# 클라우드
export OPENAI_API_KEY=sk-...
```

---

## 3. 예제 (이 폴더)

| 파일 | 내용 | 학습 포인트 |
|------|------|-------------|
| [`01_unified_completion.py`](01_unified_completion.py) | 하나의 `ask()`로 로컬·클라우드 호출 | `completion(model=...)`, 모델 문자열만 교체 |
| [`02_router_rules.py`](02_router_rules.py) | **오늘의 목표**: 작업 종류별 자동 분기 | `Router`, 별칭 라우팅, 결정 vs 실제 호출 분리 |

```bash
python 02_router_rules.py     # 오늘 이것만 돌아가면 성공 (결정만 봐도 OK)
python 01_unified_completion.py
```

---

## 4. Verex 파이프라인과의 연결

```
요청(작업 종류)
     │
     ▼  route(task_kind)
  ┌───────────────┬────────────────┐
  │ 일상/요약/번역 │ 감사/증명(audit)│
  ▼               ▼                ▼
cheap=로컬 Ollama        smart=클라우드 OpenAI
(무료·프라이버시)         (감사 수준 코드리뷰)
```

예측시장 이벤트 요약·번역 같은 **일상 작업은 로컬**(`mlx-study/04_verex_summarize.py`와 같은 결),
컨트랙트 **감사·증명처럼 틀리면 안 되는 작업은 클라우드**로 보내는 분리가 자연스럽다.

---

## 5. 다음 단계

- 규칙을 길이/비용/지연으로 확장 (긴 입력만 클라우드 등)
- LiteLLM `Router`의 fallback: 로컬 실패 시 클라우드로 자동 폴백
- `litellm` proxy 서버로 OpenAI 호환 엔드포인트 노출 → 다른 앱이 그대로 사용
- 호출 로그/비용 추적 붙이기
