# Attention Study — Day 3/50: Transformer & Self-Attention (직관 + 수식)

> **오늘의 핵심**: Attention은 "각 토큰이 다른 모든 토큰을 얼마나 참고할지"를 학습한다.
> numpy 한 개로 수식을 직접 돌려보며 감을 잡는다. (프레임워크 불필요)

```
Attention(Q, K, V) = softmax( Q·Kᵀ / √d_k ) · V
```

---

## 0. 핵심 개념 (Core Idea & Purpose)

### "attention"이라는 말의 의미
사람이 글을 읽을 때 모든 단어를 똑같이 보지 않고 **중요한 것에 선택적으로 집중(pay attention)** 하고 나머지는 흘려보낸다. 모델의 attention도 똑같다 — **각 토큰이 자기를 이해하는 데 필요한 다른 토큰들에만 선택적으로 집중**한다. 이름 그대로 "주의(집중)"의 메커니즘이다.

### 한 문장 핵심
**Attention = 각 토큰이 "지금 나를 이해하려면 어떤 토큰을 봐야 하나"를 스스로 정해, 그 정보를 가중합으로 섞어 넣는 메커니즘.**
= **내용 기반의(content-based), 학습된, 동적(dynamic) 가중 조회(lookup).**

3겹으로:
1. **단어의 의미는 문맥에서 나온다.** "bank"가 강둑인지 은행인지는 주변이 정한다 → 참고 정도를 `softmax(Q·Kᵀ/√d_k)`로 수치화.
2. **누구를 볼지는 고정이 아니라 입력 내용에 따라 매번 달라진다** (content-based routing).
3. **결과는 "문맥이 섞인 더 풍부한 표현"** — 각 토큰 벡터가 관련 토큰 정보를 흡수.

### 왜 혁명이었나 (Purpose)
이전 방식(RNN/LSTM)의 한계를 한 번에 풀었다:

| 문제 | RNN | Attention |
|------|-----|-----------|
| **장거리 의존성** | 멀수록 정보가 희미 | 어떤 두 토큰도 **직접(거리 1) 연결** |
| **병렬화** | 앞 토큰부터 순차 | **모든 토큰 동시 계산** → GPU에서 빠름 |
| **무엇에 집중** | 고정된 흐름 | **동적으로** 관련된 것만 가중 |

→ 긴 문맥 직접 연결 + 병렬 학습 + 동적 집중 → **모델을 거대하게 키울 수 있게 됨** → 오늘날 모든 LLM(GPT·Claude·Qwen)의 토대. (논문 제목: *"Attention Is All You Need"*)

### 비유
질문(**Query**)을 들고 → 각 책의 색인(**Key**)과 얼마나 맞는지 점수 → 잘 맞는 책의 내용(**Value**)을 그 점수만큼 섞어 답을 만든다. **매번 질문에 맞춰 관련 책들을 비율대로 합쳐 읽는 것.**

> **한 줄 요약**: 핵심은 "문맥을 내용 기반으로 동적으로 섞기", 목적은 "긴 의존성을 병렬로 처리해 LLM 규모를 가능케 하기".

---

## 1. 수식 한 줄씩 (왜 이렇게 생겼나)

| 조각 | 의미 |
|------|------|
| **Q, K, V** | 입력 임베딩의 **선형 변환**. Query(질문)·Key(열쇠)·Value(내용) |
| **Q·Kᵀ** | 토큰 간 **유사도 점수** 행렬 (n×n). "i가 j를 얼마나 닮았나" |
| **/ √d_k** | **스케일**. 차원이 크면 내적이 커져 softmax가 한쪽으로 폭주 → √d_k로 나눠 기울기 안정 |
| **softmax** | 행마다 **합이 1인 가중치** (확률처럼) |
| **· V** | 그 가중치로 V를 **가중합** → 문맥이 섞인 새 표현 |

핵심 한 줄: **유사도로 가중치를 만들고, 그 가중치로 내용을 섞는다.**

---

## 2. 설치 & 실행

```bash
cd /Users/jay/work/task/ai/attention-study
/usr/bin/python3 -m venv .venv        # arm64 네이티브 python
source .venv/bin/activate
pip install -r requirements.txt        # numpy만
```

```bash
python 01_self_attention.py    # 핵심 수식 — 오늘의 목표
python 02_softmax_lmsr.py      # softmax = Attention ∩ LMSR (오늘의 연결고리)
python 03_multihead_causal.py  # causal mask + multi-head + 길이² 비용
```

---

## 3. 예제 파일

| 파일 | 내용 | 학습 포인트 |
|------|------|-------------|
| [`01_self_attention.py`](01_self_attention.py) | 수식 그대로 구현 | `Q·Kᵀ/√d_k → softmax → ·V`, 가중치 행 합=1 |
| [`02_softmax_lmsr.py`](02_softmax_lmsr.py) | softmax 온도 = 민감도 | **`p_i = softmax(q_i/b)`** 와 동일 구조 |
| [`03_multihead_causal.py`](03_multihead_causal.py) | causal mask + multi-head | 미래 차단, 다관점 병렬, **O(n²) 비용** |

---

## 4. 오늘의 연결고리 — softmax는 Attention과 LMSR이 공유한다 ⭐

- **Attention 가중치**: `w = softmax(scores / √d_k)`
- **LMSR 가격**: `p_i = softmax(q_i / b)`

→ **√d_k(attention의 온도)** 와 **b(LMSR 유동성 파라미터)** 는 **같은 역할 = 민감도 조절**.
- 분모(온도)가 **크면** → 분포가 **평평**(고름) → 둔감
- 분모(온도)가 **작으면** → 분포가 **뾰족**(승자독식) → 민감

> 두 분야(딥러닝 / 예측시장), 하나의 수학. `02_softmax_lmsr.py`로 b·√d_k를 바꿔가며 직접 확인.

---

## 5. 왜 "길이² 비용"인가 (Exercise)

`Q·Kᵀ`는 **모든 토큰 쌍**을 보므로 점수 행렬이 **n×n** → 메모리·연산이 **O(n²)**.
`03_multihead_causal.py` 마지막 출력이 토큰 수별 행렬 크기를 보여준다.

**M5 실습(Day 2 스택 연결)**: `mlx-study`에서 7B 모델을 `--verbose`로 한 번 추론 →
prompt/gen 토큰 수와 tok/s를 보며 "attention이 모든 토큰 쌍을 본다 = 길이²"를 체감.
```bash
mlx_lm.generate --model mlx-community/Qwen2.5-7B-Instruct-4bit \
  --prompt "Explain self-attention in two sentences." --max-tokens 200 --verbose
```

---

## 6. 🔁 복습 (Day 2: MLX)

- MLX는 **통합 메모리**라 GPU 전송 없이 추론.
- 포맷이 **GGUF(Ollama)와 다르며** `mlx-community` 리포에서 받는다.
- (Day 2 폴더: [`../mlx-study`](../mlx-study))

---

## 7. 다음 단계 (Day 4 이후 후보)

- Positional encoding(위치 정보) — attention 자체는 순서를 모른다.
- Multi-head를 "관점"으로 해석 — head별 가중치 시각화.
- O(n²)를 줄이는 기법: FlashAttention, sliding-window, KV-cache.
- 실제 모델에서 attention 가중치 뽑아 보기 (transformers `output_attentions`).
