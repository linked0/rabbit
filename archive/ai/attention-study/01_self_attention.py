"""
01_self_attention.py — Self-Attention 핵심 수식 한 번에 (Day 3 오늘의 목표)

    Attention(Q, K, V) = softmax( Q·Kᵀ / √d_k ) · V

직관: "각 토큰이 다른 모든 토큰을 얼마나 참고할지"를 학습한다.
  - Q·Kᵀ      : 토큰 간 유사도 점수 (n×n)
  - / √d_k    : 스케일 (점수 폭주 방지 → softmax 기울기 안정)
  - softmax   : 행마다 합이 1인 가중치
  - · V       : 그 가중치로 V를 가중합 → 문맥이 섞인 새 표현

실행:
    python 01_self_attention.py
"""

import numpy as np


def softmax(x, axis=-1):
    # 수치 안정화: 최댓값을 빼고 exp (오버플로 방지). 결과는 동일.
    x = x - x.max(axis=axis, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)


def attention(Q, K, V):
    d_k = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)   # (n, n) 유사도
    weights = softmax(scores, axis=-1)  # 행마다 합 1
    out = weights @ V                  # (n, d_v) 문맥 표현
    return out, weights


def main():
    rng = np.random.default_rng(0)

    # 토큰 4개, 임베딩 차원 8. 실제로는 입력 임베딩에 학습된 가중치를 곱해 Q,K,V를 만든다.
    n, d_model, d_k = 4, 8, 8
    X = rng.standard_normal((n, d_model))      # 입력 임베딩 (n, d_model)
    Wq = rng.standard_normal((d_model, d_k))
    Wk = rng.standard_normal((d_model, d_k))
    Wv = rng.standard_normal((d_model, d_k))

    Q, K, V = X @ Wq, X @ Wk, X @ Wv           # 선형 변환
    out, weights = attention(Q, K, V)

    np.set_printoptions(precision=3, suppress=True)
    print("=== attention weights (행=각 토큰, 합=1) ===")
    print(weights)
    print("행 합 확인:", weights.sum(axis=-1))   # 전부 1.0
    print("\n=== output (문맥이 섞인 새 표현) shape ===", out.shape)
    print(out)


if __name__ == "__main__":
    main()
