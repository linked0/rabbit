"""
02_softmax_lmsr.py — softmax는 Attention과 LMSR이 공유하는 같은 함수

오늘의 연결고리:
  - Attention 가중치 : w = softmax(scores / √d_k)
  - LMSR 가격        : p_i = softmax(q_i / b)

√d_k(attention의 "온도")와 b(LMSR의 유동성 파라미터)는 같은 역할 = 민감도 조절.
  - 온도(분모)가 크면  → 분포가 평평(고름) → 둔감
  - 온도(분모)가 작으면 → 분포가 뾰족(승자독식) → 민감

실행:
    python 02_softmax_lmsr.py
"""

import numpy as np


def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)


def lmsr_price(q, b):
    """LMSR: 각 결과(outcome)의 가격 = softmax(q_i / b). 가격 합 = 1 (확률처럼)."""
    return softmax(q / b)


def main():
    np.set_printoptions(precision=3, suppress=True)

    # 예측시장: 결과 3개에 쌓인 수량(q). 같은 수량이라도 b가 다르면 가격이 달라진다.
    q = np.array([10.0, 6.0, 2.0])
    print("=== LMSR 가격 = softmax(q/b), 합=1 ===")
    for b in (1.0, 5.0, 20.0):
        p = lmsr_price(q, b)
        print(f"b={b:4.0f} → price={p}  (합={p.sum():.3f})  [b 클수록 평평=둔감]")

    print("\n=== Attention도 똑같은 구조: softmax(scores/√d_k) ===")
    scores = np.array([10.0, 6.0, 2.0])  # 한 query가 본 key 3개에 대한 유사도
    for d_k in (1, 25, 400):
        temp = np.sqrt(d_k)
        w = softmax(scores / temp)
        print(f"√d_k={temp:5.1f} → weights={w}  [√d_k 클수록 평평]")

    print("\n핵심: 분모(온도 b 또는 √d_k)가 '민감도'를 조절한다. 두 분야, 같은 수학.")


if __name__ == "__main__":
    main()
