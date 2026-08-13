# RAG 설계·리트리버 품질 지표 — 토이 문서 집합에서 코사인 유사도 리트리버로
# top-k 검색을 수행하고 recall@k 로 검색 품질을 측정하는 최소 예시.

import math, re
from collections import Counter

docs = [
    "raft leader election uses randomized timeouts",
    "b+tree index supports range queries efficiently",
    "lsm tree favors write throughput over read amplification",
    "vector database uses hnsw for approximate nearest neighbor search",
    "merkle tree enables logarithmic membership proofs",
]

def to_vec(text):
    words = re.findall(r"[a-z]+", text.lower())
    return Counter(words)

def cosine(a: Counter, b: Counter) -> float:
    keys = set(a) | set(b)
    dot = sum(a[k] * b[k] for k in keys)
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0

doc_vecs = [to_vec(d) for d in docs]

def retrieve(query, k=3):
    qv = to_vec(query)
    scored = [(cosine(qv, dv), i) for i, dv in enumerate(doc_vecs)]
    scored.sort(reverse=True)
    return scored[:k]

query = "how does approximate nearest neighbor search work"
top = retrieve(query, k=3)
print(f"질의: {query!r}")
for score, i in top:
    print(f"  top: score={score:.3f}  doc[{i}]={docs[i]!r}")

# recall@k 평가: 이 질의의 정답 문서는 doc[3] (hnsw ANN) 이라고 가정
gold_idx = 3
eval_set = [("how does approximate nearest neighbor search work", 3),
            ("what helps range queries on sorted keys", 1),
            ("how are membership proofs made small", 4)]

def recall_at_k(eval_set, k):
    hits = 0
    for q, gold in eval_set:
        retrieved_ids = [i for _, i in retrieve(q, k)]
        hits += gold in retrieved_ids
    return hits / len(eval_set)

print(f"\nrecall@1 = {recall_at_k(eval_set, 1):.2f}")
print(f"recall@3 = {recall_at_k(eval_set, 3):.2f}")
