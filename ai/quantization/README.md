# Quantization (Day 5/50)

모델 가중치를 FP16 → Q8 → Q4 정수로 줄여 **메모리·대역폭을 절감**하는 기법.
핵심 트레이드오프: 비트를 줄일수록 가볍지만 품질(perplexity)이 떨어진다.

*Shrinking model weights from FP16 → Q8 → Q4 integers to **save memory and
bandwidth**. Core trade-off: fewer bits = lighter & faster, but worse quality
(higher perplexity).*

---

## 1. "가중치를 줄인다"는 게 정확히 뭔가 / What "shrinking weights" actually means

모델은 수십억 개의 **숫자(가중치)** 다 — 70B = 약 700억 개. "가중치를 줄인다"는
가중치 *개수*를 줄이는 게 아니라, **각 숫자를 저장하는 비트 수**를 줄이는 것이다.

*A model is billions of **numbers (weights)** — 70B ≈ 70 billion of them.
"Shrinking weights" does **not** mean *fewer* weights; it means **fewer bits to
store each one**.*

**(a) 비트 ↓ → 표현 가능한 값의 수 ↓ / fewer bits → fewer representable values**

| | 비트 | 표현 단계 수 | 느낌 |
|---|---|---|---|
| FP16 | 16 | ~65,536 (부동소수점) | 0.7341 같은 미세값도 표현 / fine |
| Q8 | 8 | 256 (2⁸) | 촘촘 / dense |
| Q4 | 4 | **16** (2⁴) | 연속 실수를 16개 정수 "계단"으로 근사 / coarse |

**(b) 정수로 바꾸는 법 — `scale` / how a float becomes an integer**

한 블록의 값 범위로 `scale` 을 정하고, 각 가중치를 **가장 가까운 정수 레벨로
반올림**해 저장한다. 추론 때 다시 복원(dequantize): `값 ≈ 레벨 × scale (+ zero-point)`.

```
실제값 0.734  ──quantize──▶  레벨 12 (4-bit)  ──dequantize──▶  0.75
                                                      └ 오차 0.016 = 양자화 오차
```

*Pick a `scale` from the block's value range, round each weight to the nearest
integer level, and reconstruct it with `value ≈ level × scale` at inference.
That small gap is the **quantization error**.*

**(c) 왜 가볍고, 왜 품질이 떨어지나 / why it's lighter, and why quality drops**

- **메모리 / memory**: 가중치당 바이트 ↓ → 70B 가 FP16 140GB → Q4 ~40GB
- **대역폭 / bandwidth**: 추론은 토큰마다 모든 가중치를 메모리에서 읽음 → 작을수록
  읽기 빠름 → **tok/s ↑**
- **품질 / quality**: "계단"이 거칠수록(16단계) 원래 값과의 오차가 누적 → **perplexity ↑**

> 한 줄: 가중치 **수**가 아니라 가중치 **하나하나의 정밀도(비트)**를 깎는 것.
> *In one line: you cut the **precision (bits) of each weight**, not the
> **number** of weights.*

---

### 70B 메모리 비교 / Approx. weight memory for a 70B model

| 포맷 / format | 비트 / bits | 바이트/파라미터 | 70B 크기 (≈) | 품질 / quality |
|---|---|---|---|---|
| FP16 | 16 | 2.0 | ~140 GB | 기준(최고) / baseline |
| Q8 (`q8_0`) | 8 | 1.0 | ~70 GB | 거의 손실 없음 / near-lossless |
| Q4 (`q4_K_M`) | 4 | ~0.5 | ~40 GB | 약간 저하 / slight drop |

> M5 128GB라면 70B를 Q4(~40GB)~Q8(~70GB)로 **로컬 실행** 충분.
> *On a 128GB M5 you can comfortably run a 70B model locally at Q4–Q8.*

---

## 2. k-quant 직관 / The `q4_K_M` naming

`q4_K_M` 를 분해하면 / Decoding the tag:

- **`q4`** — 4-bit 정수 양자화 / 4-bit integer quantization
- **`_K_`** — **k-quant**: 블록마다 다른 스케일을 둬 *중요한* 가중치의 정밀도를 보존.
  단순 라운드보다 같은 4-bit에서도 품질 손실이 작다.
  *k-quant: per-block scales preserve precision for the weights that matter, so
  it loses less quality than naive rounding at the same bit-width.*
- **`_M`** — medium 변형 (S/M/L 중 중간) / the medium variant (of S/M/L)

---

## 3. GGUF vs MLX

| | GGUF (llama.cpp) | MLX (Apple) |
|---|---|---|
| 대상 / target | 범용 CPU/GPU / general | Apple Silicon 네이티브 |
| 런너 / runner | `llama.cpp`, **Ollama** | `mlx-lm` |
| 강점 / strength | 이식성·생태계 / portable | M-칩 메모리/속도 최적화 |

---

## 4. Prerequisites

> ⚠️ **이 예제는 동작하는 Ollama 가 필요합니다.** 현재 이 머신의 Homebrew Ollama 는
> 추론 백엔드(`llama-server`) 바이너리가 빠져 500 에러를 냅니다 — 공식 macOS 앱으로
> 재설치 후 사용하세요. (자세한 건 `../tokenizer-embedding` 디버깅 참고.)
>
> *These examples need a **working Ollama**. The current Homebrew build on this
> machine is missing the `llama-server` backend (HTTP 500) — reinstall the
> official macOS app first.*

- 디스크 / disk: q4 ≈ 40GB, q8 ≈ 70GB (둘 다 받으면 ~110GB)
- Ollama 실행 중 / Ollama running on `:11434`
- (선택 / optional) MLX: `pip install mlx-lm`

---

## 5. Files & how to run

| File | What |
|---|---|
| `compare.sh` | 강의의 원본 명령 그대로 — pull + run (Ollama) + MLX 주석 / raw lesson commands |
| `bench_quant.py` | 같은 프롬프트로 q4 vs q8 **자동 비교 + tok/s** (stdlib only) |

```bash
cd /Users/jay/work/task/ai/quantization

# (A) 손으로 비교 / by hand
./compare.sh "Explain KZG commitments in 2 lines"

# (B) 측정 자동화 / measured comparison (Ollama API → tokens/sec)
python3 bench_quant.py "Show a minimal Solidity reentrancy guard."
#   다른 모델로 / other tags:
python3 bench_quant.py --models llama3.1:8b-instruct-q4_K_M,llama3.1:8b-instruct-q8_0
```

`bench_quant.py` 는 Ollama `/api/generate` 응답의 `eval_count` / `eval_duration`(ns)
로 **tokens/sec** 를 계산한다. 모델 미설치/백엔드 오류는 멈추지 않고 건너뛴다.

*`bench_quant.py` computes tokens/sec from the `eval_count` / `eval_duration`
fields Ollama returns; missing models or backend errors are skipped, not fatal.*

---

## 6. Exercise

같은 프롬프트(예: `"Solidity reentrancy 가드 예시"`)를 `q4_K_M` 과 `q8_0` 에 던져
**응답 품질**과 **tok/s** 를 비교하고, 내 유스케이스(코딩)에서 어느 쪽이 가성비가
좋은지 한 줄 결론을 적는다.

*Run the same prompt through `q4_K_M` and `q8_0`, compare answer quality and
tok/s, then write a one-line verdict on which is the better value for coding.*

```bash
python3 bench_quant.py "Solidity reentrancy 가드 예시를 보여줘"
```

---

## 7. Verex 연결 / Verex tie-in

트랜잭션 분석 에이전트(Phase 4)를 로컬로 굴릴 때 **하이브리드 라우팅**:

- 24/7 백그라운드 추론 → **Q4** (전력·메모리 절감)
- 최종 리포트 등 품질이 중요한 순간 → **Q8 / 클라우드**

*Hybrid routing for the local transaction-analysis agent (Phase 4): run 24/7
background inference at **Q4** to save power/memory, and route only
quality-critical moments (e.g. final report generation) to **Q8 / cloud**.*
