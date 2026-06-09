#!/usr/bin/env python3
"""
Day 5/50 — 양자화 비교 벤치 / Quantization comparison bench.

같은 프롬프트를 여러 양자화 변형(예: q4_K_M vs q8_0)에 던져 응답과
처리 속도(tokens/sec)를 비교한다 — Day-5 Exercise 자동화.

Sends the SAME prompt to several quantization variants (e.g. q4_K_M vs q8_0)
and compares the response plus throughput (tokens/sec) — automating the
Day-5 exercise.

표준 라이브러리만 사용 (Ollama HTTP API). 의존성 없음 / Stdlib only, no deps.

Prereq: Ollama 가 :11434 에서 동작 중이고, 비교할 모델이 pull 되어 있어야 함.
    ollama pull llama3.1:70b-instruct-q4_K_M   # ~40GB
    ollama pull llama3.1:70b-instruct-q8_0     # ~70GB

Run:
    python3 bench_quant.py
    python3 bench_quant.py "Show a minimal Solidity reentrancy guard."
    python3 bench_quant.py --models llama3.1:8b-instruct-q4_K_M,llama3.1:8b-instruct-q8_0
"""
import argparse
import json
import sys
import urllib.error
import urllib.request

OLLAMA = "http://localhost:11434"
DEFAULT_MODELS = [
    "llama3.1:70b-instruct-q4_K_M",  # 4-bit, ~40GB
    "llama3.1:70b-instruct-q8_0",    # 8-bit, ~70GB
]
DEFAULT_PROMPT = "Show a minimal Solidity reentrancy guard example."


def generate(model: str, prompt: str) -> dict:
    """Ollama /api/generate (non-streaming). Returns full JSON incl. timing stats."""
    body = json.dumps({"model": model, "prompt": prompt, "stream": False}).encode()
    req = urllib.request.Request(
        f"{OLLAMA}/api/generate",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=600) as resp:
        return json.loads(resp.read())


def tok_per_sec(stats: dict) -> float:
    """tokens/sec = generated tokens / generation time. eval_duration is in nanoseconds."""
    n = stats.get("eval_count", 0)
    ns = stats.get("eval_duration", 0)
    return n / (ns / 1e9) if ns else 0.0


def main() -> int:
    ap = argparse.ArgumentParser(description="Compare Ollama quantization variants.")
    ap.add_argument("prompt", nargs="?", default=DEFAULT_PROMPT)
    ap.add_argument("--models", default=",".join(DEFAULT_MODELS),
                    help="comma-separated Ollama model tags to compare")
    args = ap.parse_args()
    models = [m.strip() for m in args.models.split(",") if m.strip()]

    print(f"prompt: {args.prompt!r}\n")
    summary = []
    for model in models:
        print(f"=== {model} ===")
        try:
            r = generate(model, args.prompt)
        except urllib.error.HTTPError as e:
            print(f"  HTTP {e.code}: {e.read().decode()[:200]}")
            print("  (모델 미설치이거나 Ollama 백엔드 문제 / model not pulled or backend error)\n")
            continue
        except Exception as e:  # noqa: BLE001 — surface any connection error, keep going
            print(f"  실패 / failed: {e}\n")
            continue
        tps = tok_per_sec(r)
        ntok = r.get("eval_count", 0)
        print(r.get("response", "").strip()[:800])
        print(f"\n  → {ntok} tokens, {tps:.1f} tok/s\n")
        summary.append((model, ntok, tps))

    if summary:
        print("=== summary (tok/s) ===")
        for model, ntok, tps in summary:
            print(f"  {model:42} {tps:6.1f} tok/s  ({ntok} tok)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
