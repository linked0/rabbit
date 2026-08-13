# 트랜스포머 계산 구조·KV 캐시 — 단일 헤드 self-attention을 numpy로 구현하고,
# 자기회귀 decode 시 K/V를 매 스텝 재계산하지 않고 캐시에 append 만 하는 것을 시연.

import numpy as np

np.random.seed(0)
d_model, d_k = 8, 4

Wq = np.random.randn(d_model, d_k) * 0.1
Wk = np.random.randn(d_model, d_k) * 0.1
Wv = np.random.randn(d_model, d_k) * 0.1

def softmax(x):
    e = np.exp(x - x.max(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)

def attention(q, K, V):
    scores = (q @ K.T) / np.sqrt(d_k)          # (1, seq_len)
    weights = softmax(scores)
    return weights @ V, weights                # (1, d_k), (1, seq_len)

# prefill: 초기 프롬프트 3토큰을 한 번에 처리하며 K/V 캐시를 채운다
tokens = np.random.randn(3, d_model) * 0.1
K_cache = tokens @ Wk
V_cache = tokens @ Wv
print("prefill 후 KV 캐시 길이:", len(K_cache))

# decode: 새 토큰마다 Q만 새로 계산하고, K/V는 "재계산 없이" 캐시에 append 만 한다
for step in range(3):
    new_token = np.random.randn(1, d_model) * 0.1
    q = new_token @ Wq
    k_new, v_new = new_token @ Wk, new_token @ Wv
    K_cache = np.vstack([K_cache, k_new])       # O(1) append, 과거 K 재계산 없음
    V_cache = np.vstack([V_cache, v_new])
    out, weights = attention(q, K_cache, V_cache)
    print(f"decode step {step}: KV 캐시 길이={len(K_cache)}, "
          f"attention weights={np.round(weights[0], 3).tolist()}")

print("\n캐시가 없다면 매 decode 스텝마다 전체 시퀀스의 K/V를 O(n) 재계산해야 한다.")
