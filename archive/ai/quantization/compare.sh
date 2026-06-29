#!/usr/bin/env bash
# Day 5/50 — 양자화 변형 직접 비교 / Compare quantization variants by hand.
#
# 주의: 모델이 큼 (q4 ≈ 40GB, q8 ≈ 70GB). 디스크·대역폭 필요.
# Note:  models are large (q4 ≈ 40GB, q8 ≈ 70GB). Needs disk + bandwidth.
#
# Usage:  ./compare.sh ["your prompt"]
set -euo pipefail

PROMPT="${1:-Explain KZG commitments in 2 lines}"

echo "== Ollama: pull both variants =="
ollama pull llama3.1:70b-instruct-q4_K_M   # 4-bit, ~40GB
ollama pull llama3.1:70b-instruct-q8_0     # 8-bit, ~70GB

echo "== Ollama: run q4_K_M =="
ollama run llama3.1:70b-instruct-q4_K_M "$PROMPT"

echo "== Ollama: run q8_0 =="
ollama run llama3.1:70b-instruct-q8_0 "$PROMPT"

# ── MLX (Apple Silicon 네이티브) — 같은 모델 4-bit ─────────────────────
# MLX (native Apple Silicon) — same model, 4-bit:
#
#   pip install mlx-lm
#   python -m mlx_lm.generate \
#     --model mlx-community/Meta-Llama-3.1-70B-Instruct-4bit \
#     --prompt "Explain slow-oracle settlement" --max-tokens 200
#
# 측정 자동화는 bench_quant.py 사용 / For measured tok/s, use bench_quant.py.
