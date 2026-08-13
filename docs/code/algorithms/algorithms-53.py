# 논리 시계·벡터 시계 — 벡터 시계로 두 이벤트가 인과적으로 순서가 있는지, 동시(concurrent)인지 판별한다.
# Lamport 시계는 동시성을 구분 못하지만, 벡터 시계는 노드별 카운터 배열로 정확히 판별한다.

class VectorClock:
    def __init__(self, node_id, n_nodes):
        self.node_id = node_id
        self.clock = [0] * n_nodes

    def local_event(self):
        self.clock[self.node_id] += 1
        return tuple(self.clock)

    def send(self):
        self.clock[self.node_id] += 1
        return tuple(self.clock)

    def receive(self, remote_clock):
        self.clock = [max(a, b) for a, b in zip(self.clock, remote_clock)]
        self.clock[self.node_id] += 1
        return tuple(self.clock)

def compare(vc_a, vc_b):
    """a <= b 성분별 비교로 인과 순서 또는 동시성을 판별"""
    le = all(a <= b for a, b in zip(vc_a, vc_b))
    ge = all(a >= b for a, b in zip(vc_a, vc_b))
    if vc_a == vc_b:
        return "동일 이벤트"
    if le:
        return "a -> b (a가 b의 원인)"
    if ge:
        return "b -> a (b가 a의 원인)"
    return "concurrent (동시, 인과관계 없음)"

n = 3
node0, node1, node2 = VectorClock(0, n), VectorClock(1, n), VectorClock(2, n)

e1 = node0.local_event()              # node0: [1,0,0]
msg = node0.send()                    # node0: [2,0,0]
e2 = node1.receive(msg)                # node1: [2,1,0] <- node0 인과적으로 앞섬
e3 = node2.local_event()              # node2: [0,0,1] <- node0/node1과 무관하게 독립 발생

print(f"e1 (node0 local)      = {e1}")
print(f"e2 (node1, e1 이후 수신) = {e2}")
print(f"e3 (node2 독립 이벤트)   = {e3}")

print(f"\ncompare(e1, e2) = {compare(e1, e2)}")  # e1이 e2의 원인
print(f"compare(e1, e3) = {compare(e1, e3)}")  # concurrent
print(f"compare(e2, e3) = {compare(e2, e3)}")  # concurrent
