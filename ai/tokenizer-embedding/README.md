# Tokenizer & Embedding Explorer

LLM이 텍스트를 어떻게 읽는지 탐구하는 스크립트.
Ollama API를 통해 토큰화, 임베딩, 코사인 유사도를 직접 실험한다.

---

## Prerequisites

- Python 3.9+
- [uv](https://docs.astral.sh/uv/) — Python 패키지 매니저
- [Ollama](https://ollama.com) — 이미 설치됨

---

## Setup

### 1. 필요한 Ollama 모델 설치

```bash
# 임베딩용 (274MB — 가볍고 빠름)
ollama pull nomic-embed-text

# 토큰화는 tiktoken으로 로컬 처리 (Ollama 불필요)
```

### 2. Ollama 서버 실행 확인

```bash
curl http://localhost:11434
# 응답: "Ollama is running" 이면 OK
# 안 뜨면: ollama serve
```

### 3. Python 환경 생성 및 의존성 설치

```bash
cd /Users/jay/work/task/ai/tokenizer-embedding

# 환경 생성 + tiktoken 설치 (한 번만)
uv sync
```

### 4. 실행

```bash
uv run python main.py
```

### 패키지 추가 시

```bash
uv add 패키지명
```

---

## Expected Output

```
=== 토큰화 ===
'Hello' → 1 tokens
'blockchain' → 1 tokens
'블록체인' → 4 tokens        ← 한국어는 토큰 더 많이 사용
'0x742d35Cc...' → 12 tokens  ← 이더리움 주소는 토큰 많이 필요

=== 코사인 유사도 ===
'Verex' ↔ 'prediction market' → 0.7821
'예측시장' ↔ 'prediction market' → 0.8134
'betting platform' ↔ 'prediction market' → 0.9201
'blockchain' ↔ 'prediction market' → 0.6543
```

---

## Technical Details

### Tokenization — BPE (Byte Pair Encoding)

LLM은 텍스트를 문자 단위가 아닌 **토큰** 단위로 읽는다.

```
"lower" → ['low', 'er']        # 2 tokens
"blockchain" → ['block', 'chain']  # 2 tokens
"블록체인" → ['▁블', '록', '체', '인']  # 4 tokens
```

**BPE 알고리즘 원리:**
1. 모든 텍스트를 개별 문자로 분리
2. 가장 자주 등장하는 문자 쌍을 하나로 병합
3. 반복 → vocabulary 크기만큼 병합

```
초기:   ['l', 'o', 'w', 'e', 'r']
1회:    ['lo', 'w', 'e', 'r']     ← 'lo' 가 자주 등장 → 병합
2회:    ['low', 'e', 'r']
3회:    ['low', 'er']             ← 최종 토큰
```

**왜 중요한가:**
- 컨텍스트 창(context window)은 토큰 수로 제한됨 (예: 128k tokens)
- 한국어는 영어보다 토큰을 2-3배 더 사용 → 같은 내용이 더 많은 토큰 소모
- 이더리움 주소(`0x...`)는 토큰 비효율적 → 프롬프트 설계 시 고려 필요

---

### Embedding — 벡터 공간

텍스트를 고차원 벡터(숫자 배열)로 변환한다.
의미가 비슷한 텍스트는 벡터 공간에서 가까이 위치한다.

```
"예측시장"       → [0.12, -0.34, 0.89, ...]  # 768차원 벡터
"prediction market" → [0.11, -0.31, 0.91, ...]  # 비슷한 방향
"blockchain"     → [0.55,  0.22, 0.13, ...]  # 다른 방향
```

**모델: nomic-embed-text**
- 차원: 768
- 최대 입력: 8192 tokens
- 특징: 로컬 실행, 빠름, 다국어 지원

---

### Cosine Similarity — 유사도 측정

두 벡터 사이의 각도로 의미적 유사성을 측정한다.

```
공식: cos(θ) = (A·B) / (|A| × |B|)

범위: -1.0 ~ 1.0
  1.0  → 완전히 동일한 의미
  0.0  → 관련 없음
 -1.0  → 반대 의미
```

**실전 활용 기준:**
```
0.9 이상 → 거의 같은 의미
0.7~0.9  → 관련 있음
0.5~0.7  → 약간 관련
0.5 미만 → 관련 없음
```

---

## Verex 연결

이 코드의 핵심 개념은 Verex RAG 시스템에 직접 사용된다.

```
사용자 질문: "ETH 가격이 3000 달러 넘을까?"
    ↓ get_embedding()
질문 벡터: [0.23, -0.11, ...]
    ↓ cosine_similarity()
유사한 과거 마켓 검색: "Will ETH exceed $2500?" (유사도: 0.91)
    ↓
관련 마켓 데이터를 컨텍스트로 LLM에 전달
```

---

## API Reference

### Ollama Tokenize API
```bash
curl -X POST http://localhost:11434/api/tokenize \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.3:70b", "content": "Hello"}'
```

### Ollama Embeddings API
```bash
curl -X POST http://localhost:11434/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model": "nomic-embed-text", "prompt": "Hello"}'
```
