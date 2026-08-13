# Red-Black vs B+Tree vs Skip List — A Concurrency-Level View

*Developer Knowledge 100, Day 2/100 · 2026-08-11 · Section A, Advanced Algorithms*

All three are "a sorted-key dictionary in O(log n)." Textbook-wise they sit in the same
box, but in practice they end up in completely different places. What separates them
isn't complexity — it's **disk and concurrency**.

> **One-line summary** — Where and how much you lock, and how many keys you pack into one
> node, decide the data structure's fate.

## Comparison

| | Red-Black | B+Tree | Skip List |
|---|---|---|---|
| Keys per node | 1 | Hundreds (page-sized) | 1 |
| Strength | Single-threaded, in-memory | **Disk / page locality** | **Lock-free concurrency** |
| Concurrency | Rotation locks up to the ancestors → worst case | Latch coupling (propagation is short) | No rotation → per-node CAS |
| Typical home | Kernel schedulers, C++ `std::map` | MySQL/Postgres indexes | Redis zset, RocksDB memtable |

## The key insight: the cost isn't the search, it's the rebalancing

What's expensive in a balanced tree isn't walking down it — it's **rotation**. A rotation
has to atomically change several nodes at once, and that's why **lock scope widens
toward the ancestors.** Under heavy concurrent writes, that lock scope directly caps
throughput.

A skip list doesn't **eliminate** this problem so much as **sidestep** it. Instead of
maintaining balance structurally, it **buys balance with probability** — flip a coin to
decide a node's level on insert, the expected height comes out to O(log n), and because
there's no rotation at all, insertion is **local**. Local means a CAS is enough, and if a
CAS is enough, a lock-free implementation becomes practical.

```python
import random

def random_level(p=0.5, max_lv=16):
    lv = 1
    while random.random() < p and lv < max_lv:
        lv += 1                 # flip a coin — balance is bought with probability
    return lv

# Expected height O(log n), no rebalancing (rotation) → inserts stay local (CAS-friendly)
print(sorted(random_level() for _ in range(20)))
```

RocksDB using a skip list for its memtable, then converting to an SST (a B+Tree-family
structure) when data moves to disk, is exactly these two properties being taken
separately — **memory buys balance with probability, disk buys it with pages.**

## Ethereum clients sit on the same axis

Leave an MPT (Merkle Patricia Trie) **as-is on disk and it's a random-I/O bomb.** So
Geth and Reth flatten the MPT and **layer it on top of a B+Tree-family KV store
(LevelDB/MDBX).**

> **A structure for proving ≠ a structure for storing.**

The MPT's shape is there to prove a state root; the KV's shape is there to read and write
it. Holding the same data in two shapes isn't waste — it's answering two different
questions.

Verex's indexer DB choice runs into the same question — **is the read pattern a range
scan (B+Tree, Postgres), or a write flood (LSM, RocksDB)?**

## Exercise

By hand, derive that with `p = 0.5`, the expected number of levels for n keys is
`log₂ n`. Hint: the expected number of nodes at level k or higher is `n · p^(k-1)`.

## Related code

[docs/code/algorithms/algorithms-2.py](../code/algorithms/algorithms-2.py) — the Skip
List `random_level` code above, pulled out into a runnable file.

---

# 한국어

# Red-Black vs B+Tree vs Skip List — 동시성 관점

*매일의 개발 지식 100 Day 2/100 · 2026-08-11 · A 고급 알고리즘 구간*

셋 다 "정렬된 키의 O(log n) 사전"이다. 교과서적으로는 같은 칸에 들어가는데, 실전에서는
전혀 다른 곳에 쓰인다. 갈리는 축은 복잡도가 아니라 **디스크와 동시성**이다.

> **한 줄 정리** — 락을 어디에 얼마나 잡는가, 그리고 한 노드에 키를 몇 개 담는가가
> 자료구조의 운명을 정한다.

## 비교

| | Red-Black | B+Tree | Skip List |
|---|---|---|---|
| 노드당 키 | 1 | 수백 (페이지 크기) | 1 |
| 강점 | 메모리 내 단일스레드 | **디스크·페이지 지역성** | **락프리 동시성** |
| 동시성 | 회전이 조상까지 잠금 → 최악 | 래치 커플링(전파 짧음) | 회전 없음 → 노드 단위 CAS |
| 대표 사용처 | 커널 스케줄러, C++ `std::map` | MySQL·Postgres 인덱스 | Redis zset, RocksDB memtable |

## 핵심: 비용은 탐색이 아니라 재균형이다

균형 트리에서 비싼 건 내려가는 길이 아니라 **회전(rotation)** 이다. 회전은 여러 노드를
원자적으로 바꿔야 하고, 그래서 **락 범위가 조상 쪽으로 넓어진다.** 동시 쓰기가 많으면
이 락 범위가 그대로 처리량 상한이 된다.

Skip List는 이 문제를 **없애는 게 아니라 피한다.** 균형을 구조적으로 유지하는 대신
**확률로 산다** — 삽입할 때 동전을 던져 레벨을 정하면 기대 높이가 O(log n)이 되고,
회전이 아예 존재하지 않으므로 삽입이 **지역적**이다. 지역적이면 CAS로 충분하고, CAS로
충분하면 락프리 구현이 실용적이 된다.

```python
import random

def random_level(p=0.5, max_lv=16):
    lv = 1
    while random.random() < p and lv < max_lv:
        lv += 1                 # 동전 던지기 — 균형을 '확률'로 산다
    return lv

# 기대 높이 O(log n), 재균형(회전) 없음 → 삽입이 지역적(CAS 친화)
print(sorted(random_level() for _ in range(20)))
```

RocksDB가 memtable에 Skip List를 쓰고, 디스크로 나갈 때 SST(B+Tree 계열)로 바꾸는 게
이 두 성질을 각각 취한 결과다 — **메모리는 확률로, 디스크는 페이지로.**

## 이더리움 클라이언트도 같은 축 위에 있다

MPT(머클 패트리샤 트라이)를 **그대로 디스크에 두면 랜덤 I/O 폭탄**이다. 그래서 Geth·Reth는
MPT를 평탄화해 **B+Tree 계열 KV(LevelDB·MDBX) 위에 얹는다.**

> **증명용 구조 ≠ 저장용 구조.**

MPT는 상태 루트를 증명하기 위한 모양이고, KV는 그것을 읽고 쓰기 위한 모양이다. 같은
데이터를 두 모양으로 들고 있는 건 낭비가 아니라 서로 다른 질문에 답하기 때문이다.

Verex 인덱서의 DB 선택에도 같은 질문이 온다 — **읽기 패턴이 범위 스캔인가(B+Tree,
Postgres), 쓰기 폭주인가(LSM, RocksDB).**

## 연습

`p = 0.5`일 때 n개 키의 기대 레벨 수가 `log₂ n`임을 손으로 유도할 것.
힌트: 레벨 k 이상인 노드의 기대 개수 = `n · p^(k-1)`.

## 관련 코드

[docs/code/algorithms/algorithms-2.py](../code/algorithms/algorithms-2.py) — 위 Skip List `random_level` 코드를 그대로 실행 가능한 파일로 뺀 것.
