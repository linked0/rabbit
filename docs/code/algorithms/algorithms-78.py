# 벡터 DB와 ANN 인덱스 — 소규모 벡터 집합에 대한 브루트포스 최근접 탐색을 베이스라인으로 구현.
# 실제 HNSW/IVF-PQ 는 이 exact 결과를 근사(recall<1.0)로 더 빠르게 흉내내는 것이 목표다.

import numpy as np

rng = np.random.default_rng(42)
DIM, N = 8, 200
vectors = rng.normal(size=(N, DIM)).astype("float32")
ids = [f"doc-{i}" for i in range(N)]

def cosine_distance(a, b):
    a_n = a / np.linalg.norm(a)
    b_n = b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-9)
    return 1.0 - b_n @ a_n

def brute_force_knn(query, k=5):
    dists = cosine_distance(query, vectors)      # 전수 비교: O(N*DIM)
    top_k = np.argsort(dists)[:k]
    return [(ids[i], float(dists[i])) for i in top_k]

query = vectors[7] + rng.normal(scale=0.05, size=DIM).astype("float32")  # doc-7 근처 질의
result = brute_force_knn(query, k=5)

print("query is a noisy copy of doc-7")
print("brute-force top-5 nearest neighbors (id, cosine distance):")
for doc_id, dist in result:
    print(f"  {doc_id}: {dist:.4f}")
print("exact search cost: O(N * DIM) per query — ANN indexes trade this for recall < 1.0")
