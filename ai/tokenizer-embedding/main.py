import math
import urllib.request
import urllib.error
import json
import tiktoken  # pip install tiktoken

OLLAMA_BASE = "http://localhost:11434"
EMBED_MODEL = "nomic-embed-text"

# tiktoken — LLaMA 계열과 동일한 BPE 토크나이저 (로컬, 빠름)
_enc = tiktoken.get_encoding("cl100k_base")


def _post(endpoint: str, payload: dict) -> dict:
    """Ollama API POST helper"""
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{OLLAMA_BASE}{endpoint}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read().decode("utf-8")
        lines = [l for l in raw.strip().splitlines() if l.strip()]
        return json.loads(lines[-1])


# 1. 토큰화 — tiktoken (로컬, 빠름, 정확)
def tokenize(text: str) -> dict:
    tokens = _enc.encode(text)
    return {"tokens": tokens, "count": len(tokens)}


# 2. 임베딩
def get_embedding(text: str, model: str = EMBED_MODEL) -> list:
    resp = _post("/api/embeddings", {"model": model, "prompt": text})
    return resp["embedding"]


# 3. 코사인 유사도
def cosine_similarity(a: list, b: list) -> float:
    dot   = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x ** 2 for x in a))
    mag_b = math.sqrt(sum(x ** 2 for x in b))
    return dot / (mag_a * mag_b)


if __name__ == "__main__":

    # ── 1. 토큰화 ──────────────────────────────────────────
    print("=== 토큰화 ===")
    texts = [
        "Hello",
        "blockchain",
        "블록체인",
        "0x742d35Cc6634C0532925a3b8D4C9C0fb2D8c0e2",
    ]
    for text in texts:
        result = tokenize(text)
        print(f"  '{text}' → {result['count']} token(s)  {result['tokens']}")

    # ── 2. 임베딩 & 코사인 유사도 ──────────────────────────
    print("\n=== 코사인 유사도 ===")
    pairs = [
        ("Verex",            "prediction market"),
        ("예측시장",          "prediction market"),
        ("betting platform", "prediction market"),
        ("blockchain",       "prediction market"),
    ]
    for a, b in pairs:
        try:
            score = cosine_similarity(get_embedding(a), get_embedding(b))
            print(f"  '{a}' ↔ '{b}' → {score:.4f}")
        except Exception as e:
            print(f"  '{a}' ↔ '{b}' → 실패: {e}")
