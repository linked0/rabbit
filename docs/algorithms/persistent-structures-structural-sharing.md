# Persistent Data Structures & Structural Sharing

*Developer Knowledge 100, Day 3/100 · 2026-08-13 · Section A, Advanced Algorithms*

A **persistent** data structure never mutates in place — every update returns a *new*
version while every old version stays fully readable. The trick that makes this
affordable is **structural sharing**: an update copies only the nodes on the path from
the root to the changed spot, and every subtree hanging off that path is reused by
reference in the new version.

> **One-line summary** — Copy only the path to the change, share everything else by
> pointer; that's what turns "clone the whole structure" into O(log n).

## The mechanism: path copying

A persistent singly-linked list makes this concrete. Prepending never touches the old
list at all — the new head just points at it:

```
v1: A -> B -> C
v2 = prepend(v1, X):  X -> A -> B -> C     (v1's A->B->C is untouched and shared)
```

For a tree, an update copies the nodes on the root-to-target path; every sibling
subtree off that path is the *same object* in both versions:

```
        root(v1)                    root(v2)
       /        \                  /        \
     L            R      -->     L'            R   <- shared, not copied
    / \          / \             / \
  LL   LR      RL   RR        LL'   LR
```

In a balanced tree of height O(log n), that's the entire cost of "produce a fully
independent new version."

## Three levels of persistence

- **Partial** — only the newest version can be updated; older versions are read-only.
- **Full** — any past version can be branched from and updated independently (this is
  conceptually how Git branches work).
- **Confluent** — two versions can be *merged* back into one (`git merge`, CRDTs) — the
  hard case.

## Why it matters

1. **Lock-free concurrent reads.** An old version is never mutated, so a reader holding
   v1 can keep reading it safely forever, even while a writer builds v2. No locks, no
   defensive copying before a read.
2. **Near-zero-cost versioning.** Snapshots, branches, rollback, and history become
   O(log n) instead of O(n) per version — which is what makes "keep thousands of live
   versions" practical instead of absurd.

## Where it actually shows up

| Domain | Example | What it buys |
|---|---|---|
| Version control | Git | Each commit's tree shares unchanged subtrees with its parent |
| CoW filesystems | ZFS, Btrfs | Instant, cheap snapshots for backup/rollback |
| Databases | Datomic, etcd, LMDB, Postgres (MVCC) | Readers never block writers; every revision stays queryable |
| Functional languages | Clojure, Scala, Haskell | Immutable-by-default collections, affordable via HAMT/finger-tree sharing |
| Frontend state | Redux, Immutable.js | `===` reference equality replaces deep diffing; enables time-travel debugging |
| Blockchains | Ethereum's state trie | Each block's state root shares almost the whole trie with the previous block |

## Marginal cost vs. cumulative cost — the catch

Structural sharing makes *each* update cheap (O(log n) new nodes), but that doesn't make
history free. "Cheap per update" × "millions of updates over years" still adds up to a
lot of total storage — which is exactly why Ethereum archive nodes (full history) run
15+ TB while pruned full nodes (last ~128 blocks only) stay in the hundreds of GB. Real
systems handle this the same way in every domain: a **retention/GC policy** on top of
the persistent structure — Postgres `VACUUM`, `git gc`, ZFS snapshot deletion, or
Ethereum pruning nodes no root references anymore.

Real-world tries also push the branching factor up (16-way for Ethereum's
Merkle-Patricia Trie, 32-way for Clojure's HAMT) specifically to keep tree depth — and
therefore path-copy cost — low; see Day 5 for how Verkle trees push this further by
replacing hash-based proofs with polynomial commitments.

## Exercise

Using the `cons`/`Node` code below, prove to yourself that `v2` and `v3` (both built by
consing onto `v1`) never touch each other's memory: add a `mutate` helper that walks
`v2` and flips a value in place, then check that `v3`'s printed contents are unaffected.

## Related code

[docs/code/algorithms/algorithms-3.py](../code/algorithms/algorithms-3.py) — the
persistent linked list (`cons`/`to_list`) above, as a runnable file: three versions
branching off each other, with a pointer-identity check proving the shared tail is the
same object.

---

# 한국어

# 영속(persistent) 자료구조와 구조 공유

*매일의 개발 지식 100 Day 3/100 · 2026-08-13 · A 고급 알고리즘 구간*

**영속** 자료구조는 제자리에서 갱신되지 않는다 — 매 갱신은 *새* 버전을 반환하고, 이전
버전은 여전히 완전히 읽을 수 있는 상태로 남는다. 이걸 감당 가능하게 만드는 트릭이
**구조 공유**다: 갱신은 루트에서 변경 지점까지의 경로 위 노드만 복사하고, 그 경로에
매달린 나머지 서브트리는 새 버전에서도 참조로 그대로 재사용된다.

> **한 줄 정리** — 변경된 경로만 복사하고 나머지는 포인터로 공유한다. 이게 "전체 복제"를
> O(log n)으로 바꾸는 전부다.

## 메커니즘: 경로 복사(path copying)

영속 단일 연결 리스트로 보면 구체적이다. 앞에 추가하는 연산은 기존 리스트를 전혀
건드리지 않는다 — 새 head가 그냥 그걸 가리키기만 한다:

```
v1: A -> B -> C
v2 = prepend(v1, X):  X -> A -> B -> C     (v1의 A->B->C는 그대로 공유됨)
```

트리라면, 갱신은 루트-대상 경로 위 노드만 복사하고, 그 경로에서 갈라져 나간 형제
서브트리는 두 버전에서 *같은 객체*다:

```
        root(v1)                    root(v2)
       /        \                  /        \
     L            R      -->     L'            R   <- 공유됨, 복사 안 됨
    / \          / \             / \
  LL   LR      RL   RR        LL'   LR
```

높이 O(log n)인 균형 트리에서는, 이게 "완전히 독립적인 새 버전을 만드는" 연산의 비용
전부다.

## 영속성의 세 단계

- **부분(partial)** — 최신 버전만 갱신 가능, 과거 버전은 읽기 전용.
- **완전(full)** — 과거 어떤 버전에서도 분기해서 독립적으로 갱신 가능 (개념적으로 Git
  브랜치가 이렇게 동작한다).
- **합류(confluent)** — 두 버전을 다시 하나로 **병합** 가능 (`git merge`, CRDT) — 어려운
  경우다.

## 왜 중요한가

1. **락 없는 동시 읽기.** 과거 버전은 절대 변형되지 않으므로, v1을 쥔 리더는 writer가
   v2를 만드는 동안에도 영원히 안전하게 읽을 수 있다. 락도, 읽기 전 방어적 복사도 필요
   없다.
2. **거의 공짜에 가까운 버전 관리.** 스냅샷·브랜치·롤백·히스토리가 버전당 O(n)이 아니라
   O(log n)이 되고, 그래서 "수천 개 버전을 동시에 살려두기"가 터무니없는 게 아니라
   현실적인 선택이 된다.

## 실제로 쓰이는 곳

| 분야 | 예시 | 얻는 것 |
|---|---|---|
| 버전 관리 | Git | 각 커밋의 tree가 부모와 바뀌지 않은 서브트리를 공유 |
| CoW 파일시스템 | ZFS, Btrfs | 백업/롤백을 위한 즉각적이고 저렴한 스냅샷 |
| 데이터베이스 | Datomic, etcd, LMDB, Postgres (MVCC) | 리더가 라이터를 절대 블로킹하지 않고, 모든 리비전이 계속 조회 가능 |
| 함수형 언어 | Clojure, Scala, Haskell | 기본 불변 컬렉션 — HAMT/finger-tree 구조 공유 덕에 감당 가능 |
| 프론트엔드 상태 | Redux, Immutable.js | `===` 참조 비교가 깊은 비교를 대체 — time-travel debugging의 기반 |
| 블록체인 | 이더리움의 state trie | 블록마다 state root가 이전 블록과 trie 대부분을 공유 |

## 한계 비용 vs 누적 비용 — 함정

구조 공유는 *갱신 하나*를 저렴하게 만들지만(O(log n)개의 새 노드), 그게 히스토리를
공짜로 만드는 건 아니다. "갱신 한 번은 저렴함" × "수년간 수백만 번의 갱신"은 여전히
상당한 총 저장량으로 쌓인다 — 그래서 이더리움 아카이브 노드(전체 히스토리 보관)는
15TB 이상인 반면, pruned full node(최근 ~128블록만)는 수백 GB 수준에 머문다. 실제
시스템은 모든 분야에서 같은 방식으로 이걸 다룬다 — 영속 자료구조 위에 얹은
**보존/GC 정책**: Postgres `VACUUM`, `git gc`, ZFS 스냅샷 삭제, 혹은 어떤 root도
더 이상 참조하지 않는 노드를 지우는 이더리움 pruning.

실제 trie들은 트리 깊이(=경로 복사 비용)를 낮게 유지하려고 분기 계수도 일부러 키운다
(이더리움 Merkle-Patricia Trie는 16진, Clojure의 HAMT는 32진). Verkle tree가 해시 기반
증명 대신 다항식 커밋먼트로 이걸 한 단계 더 밀어붙이는 이야기는 Day 5에서 이어진다.

## 연습

아래 `cons`/`Node` 코드로, `v1`에서 각각 분기한 `v2`와 `v3`가 서로의 메모리를 절대
건드리지 않는다는 걸 직접 확인할 것 — `v2`를 순회하며 값 하나를 제자리에서 바꾸는
`mutate` 헬퍼를 추가하고, `v3`의 출력 내용이 영향받지 않는지 확인해보라.

## 관련 코드

[docs/code/algorithms/algorithms-3.py](../code/algorithms/algorithms-3.py) — 위 영속
연결 리스트(`cons`/`to_list`)를 그대로 실행 가능한 파일로 뺀 것: `v1`에서 갈라진 세
버전과, 공유된 tail이 같은 객체임을 보여주는 포인터 동일성 체크.
