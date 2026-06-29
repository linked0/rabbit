"""
03_multihead_causal.py — Causal mask + Multi-Head, 그리고 길이² 비용 체감

추가 개념 2개:
  1) Causal mask: 자기회귀(생성) 모델은 "미래 토큰"을 보면 안 된다.
     → 위쪽 삼각(미래)을 -inf로 막아 softmax 후 가중치를 0으로.
  2) Multi-Head: Q,K,V를 head 개로 쪼개 각자 attention → 합침.
     서로 다른 "관점"을 병렬로 본다.

비용: scores 행렬이 (n × n)이라 메모리·연산이 길이의 제곱(O(n²)).
     → 이게 LLM 컨텍스트가 길수록 급격히 비싸지는 이유.

실행:
    python 03_multihead_causal.py
"""

import numpy as np


def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)


def causal_mask(n):
    # 상삼각(대각선 위 = 미래)을 True로 → 거기에 -inf를 넣는다.
    return np.triu(np.ones((n, n), dtype=bool), k=1)


def attention(Q, K, V, mask=None):
    d_k = Q.shape[-1]
    scores = Q @ K.swapaxes(-1, -2) / np.sqrt(d_k)
    if mask is not None:
        scores = np.where(mask, -np.inf, scores)  # 미래 차단
    w = softmax(scores, axis=-1)
    return w @ V, w


def multi_head_attention(X, Wq, Wk, Wv, n_heads, causal=True):
    n, d_model = X.shape
    d_head = d_model // n_heads
    Q, K, V = X @ Wq, X @ Wk, X @ Wv
    # (n, d_model) → (n_heads, n, d_head)
    def split(t):
        return t.reshape(n, n_heads, d_head).transpose(1, 0, 2)
    Qh, Kh, Vh = split(Q), split(K), split(V)
    mask = causal_mask(n) if causal else None
    outs = [attention(Qh[h], Kh[h], Vh[h], mask)[0] for h in range(n_heads)]
    # 각 head 결과를 다시 이어붙임 (n, d_model)
    return np.concatenate(outs, axis=-1)


def main():
    rng = np.random.default_rng(0)
    np.set_printoptions(precision=3, suppress=True)

    n, d_model, n_heads = 5, 8, 2
    X = rng.standard_normal((n, d_model))
    Wq = rng.standard_normal((d_model, d_model))
    Wk = rng.standard_normal((d_model, d_model))
    Wv = rng.standard_normal((d_model, d_model))

    # causal mask 한 head의 가중치만 살펴보기
    Q, K, V = X @ Wq, X @ Wk, X @ Wv
    _, w = attention(Q, K, V, causal_mask(n))
    print("=== causal attention weights (위 삼각=미래=0, 행 합=1) ===")
    print(w)
    print("→ 토큰 i는 자신과 과거(0..i)만 본다.\n")

    out = multi_head_attention(X, Wq, Wk, Wv, n_heads)
    print("=== multi-head 출력 shape ===", out.shape)

    print("\n=== 길이² 비용 (scores 행렬 크기 = n×n) ===")
    for n_tokens in (8, 128, 2048, 32768):
        cells = n_tokens * n_tokens
        print(f"n={n_tokens:6d} → scores 원소 {cells:>14,} 개  (≈ {cells*4/1e6:,.1f} MB @ float32)")
    print("→ 컨텍스트가 길수록 제곱으로 비싸진다. (FlashAttention 등이 이 비용을 줄이려는 것)")


if __name__ == "__main__":
    main()
