# MLX Study — Day 2/50: Apple Silicon 네이티브 추론

> **오늘의 최소 목표**: `pip install mlx-lm` 후 `python 01_quickstart.py` 한 번 실행 → tok/s 숫자가 보이면 Day 3로 전진. (5분)

MLX는 Apple이 만든 Apple Silicon(M1~M5) 전용 머신러닝 프레임워크다.
`mlx-lm`은 그 위에서 LLM을 로드/추론/양자화하는 라이브러리다.

---

## 1. 핵심 기술 내용 (왜 MLX인가)

| 항목 | 내용 |
|------|------|
| **통합 메모리 (Unified Memory)** | CPU와 GPU가 같은 물리 메모리를 공유. PyTorch+CUDA처럼 `host→device` 복사가 없어 즉시 추론. M5 128GB면 RAM 전체를 GPU가 그대로 사용 → 70B 모델도 로컬 적재 가능. |
| **MLX 포맷 ≠ GGUF** | llama.cpp의 GGUF와 별개 포맷. 모델은 반드시 `mlx-community` HuggingFace 리포에서 받는다. (예: `mlx-community/Qwen2.5-7B-Instruct-4bit`) |
| **양자화 (`-4bit`)** | 가중치를 4비트로 압축해 메모리/속도 이득. 7B 모델이 약 4GB로 줄어 노트북에서 쾌적. |
| **Lazy evaluation** | MLX 연산은 호출 즉시 계산하지 않고 그래프로 쌓았다가 필요할 때 한 번에 실행. 불필요한 중간 계산을 건너뛴다. |
| **Chat template** | Instruct 모델은 학습 때 쓴 포맷을 그대로 줘야 성능이 나온다. `tokenizer.apply_chat_template()`이 모델별 포맷을 자동 적용. |

---

## 2. 설치 (이 머신에서 검증 완료 ✅)

이 폴더에는 이미 `.venv`가 만들어져 있고 `mlx-lm`이 설치돼 있다.
바로 쓰려면:

```bash
cd /Users/jay/work/task/ai/mlx-study
source .venv/bin/activate
```

처음부터 다시 만들 때 (검증된 방법):

```bash
cd /Users/jay/work/task/ai/mlx-study
/usr/bin/python3 -m venv .venv          # 시스템 python = arm64 네이티브 3.9.6
source .venv/bin/activate
pip install -r requirements.txt          # mlx-lm + 의존성
```

> 참고: 시스템 python이 LibreSSL이라 `urllib3` 관련 경고가 한 줄 뜨는데, **무해**하다.

---

## 3. 실행 방법

### 가장 빠른 길 — CLI 한 줄

```bash
mlx_lm.generate \
  --model mlx-community/Qwen2.5-7B-Instruct-4bit \
  --prompt "Explain PeerDAS in two sentences." \
  --max-tokens 200
```

최초 실행 시 가중치를 HuggingFace에서 내려받는다(수 GB, 1회만). 이후엔 캐시 사용.

### Python 예제 (이 폴더)

| 파일 | 내용 | 학습 포인트 |
|------|------|-------------|
| [`01_quickstart.py`](01_quickstart.py) | 최소 실행 — **오늘의 목표** | `load()` + `generate()`, tok/s 확인 |
| [`02_chat_template.py`](02_chat_template.py) | instruct 모델 올바른 호출 | `apply_chat_template()`, system/user role |
| [`03_streaming.py`](03_streaming.py) | 토큰 실시간 스트리밍 | `stream_generate()`, chunk별 통계/메모리 |
| [`04_verex_summarize.py`](04_verex_summarize.py) | **Verex 연결**: 예측시장 이벤트 요약→한국어 번역 | 모델 1회 로드 후 다단계 재사용 |

```bash
python 01_quickstart.py      # 오늘 이것만 돌아가면 성공
python 02_chat_template.py
python 03_streaming.py
python 04_verex_summarize.py
```

---

## 4. Verex 파이프라인과의 연결 (50일 로드맵)

`04_verex_summarize.py`는 **Phase 4, Day 48**에서 쓸 파이프라인의 축소판이다.

```
Polymarket/UMA 이벤트 설명
        │
        ▼  (로컬 MLX 모델, 기기 밖으로 안 나감)
   ① 3줄 영어 요약
        │
        ▼
   ② 한국어 번역
        │
        ▼
   예측시장 대시보드 / 알림
```

**클라우드 API 대비 우위**: 프라이버시(데이터가 로컬에 머묾), 비용 0,
rate limit 없음, 오프라인 동작. M5 128GB면 더 큰 모델로 품질을 올릴 여지도 크다.

---

## 5. 다음 단계 (Day 3 이후 후보)

- 더 큰 모델로 교체해 품질/속도 비교: `mlx-community/Qwen2.5-14B-Instruct-4bit`
- `mlx_lm.server`로 OpenAI 호환 로컬 API 서버 띄우기
- 직접 양자화: `mlx_lm.convert`로 임의 HF 모델 → 4bit MLX 변환
- LoRA 파인튜닝: `mlx_lm.lora`
