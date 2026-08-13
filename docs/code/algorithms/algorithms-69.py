# MVCC 내부와 스냅샷 격리의 이상현상(write skew) — 두 트랜잭션이 같은 스냅샷을 읽고 서로 다른 행을 갱신해 불변식이 깨진다.
# "온콜 최소 1명" 불변식을 스냅샷 격리에서 재현한다: 각자 상대가 아직 온콜이라 보고 자신을 뺐지만 합치면 0명이 된다.

class VersionedTable:
    def __init__(self, initial):
        self.versions = {k: [(0, v)] for k, v in initial.items()}  # key -> [(txn_id, value), ...]

    def snapshot_read(self, key, as_of_txn):
        # as_of_txn 이전에 커밋된 가장 최신 버전만 보인다 (스냅샷 격리)
        visible = [v for (tid, v) in self.versions[key] if tid <= as_of_txn]
        return visible[-1] if visible else None

    def write(self, key, txn_id, value):
        self.versions[key].append((txn_id, value))

table = VersionedTable({"alice_on_call": True, "bob_on_call": True})

SNAPSHOT_TXN = 0  # 두 트랜잭션 모두 같은 시점의 스냅샷에서 시작
a_sees_bob = table.snapshot_read("bob_on_call", SNAPSHOT_TXN)     # A: bob이 아직 온콜이니 alice는 빠져도 된다
b_sees_alice = table.snapshot_read("alice_on_call", SNAPSHOT_TXN)  # B: alice가 아직 온콜이니 bob도 빠져도 된다

print("A가 본 bob 상태:", a_sees_bob, "→ alice를 오프콜로 전환")
print("B가 본 alice 상태:", b_sees_alice, "→ bob을 오프콜로 전환")

if a_sees_bob:
    table.write("alice_on_call", txn_id=1, value=False)
if b_sees_alice:
    table.write("bob_on_call", txn_id=2, value=False)

final_alice = table.snapshot_read("alice_on_call", as_of_txn=99)
final_bob = table.snapshot_read("bob_on_call", as_of_txn=99)
print(f"\n최종 상태: alice={final_alice}, bob={final_bob}")

invariant_ok = final_alice or final_bob
note = "" if invariant_ok else " ← write skew로 위반됨"
print("불변식(최소 1명 온콜) 유지 여부:", invariant_ok, note)
