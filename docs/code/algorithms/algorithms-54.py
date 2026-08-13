# Raft 심화 — 전체 프로토콜 대신 리더 선출과 term 증가만 축약해 시뮬레이션한다.
# 팔로워가 리더의 하트비트를 못 받으면 election timeout 후 term을 올리고 후보가 된다.

import random

random.seed(4)

class Node:
    def __init__(self, node_id):
        self.node_id = node_id
        self.term = 0
        self.state = "follower"  # follower | candidate | leader
        self.voted_for = None

class Cluster:
    def __init__(self, n):
        self.nodes = [Node(i) for i in range(n)]
        self.leader = None

    def start_election(self, candidate):
        candidate.term += 1
        candidate.state = "candidate"
        candidate.voted_for = candidate.node_id
        votes = 1  # 자기 자신에게 투표
        for node in self.nodes:
            if node is candidate:
                continue
            # 후보의 term이 더 높고, 이번 term에 아직 투표 안 했으면 승인
            if candidate.term > node.term or node.voted_for is None:
                node.term = candidate.term
                node.voted_for = candidate.node_id
                votes += 1
        majority = len(self.nodes) // 2 + 1
        if votes >= majority:
            candidate.state = "leader"
            self.leader = candidate
            for node in self.nodes:
                if node is not candidate:
                    node.state = "follower"
            return True, votes
        candidate.state = "follower"
        return False, votes

cluster = Cluster(5)
print(f"초기 상태: 5개 노드, 모두 term=0, follower")

# 리더 부재로 election timeout 발생 -> node 2가 후보로 나섬
won, votes = cluster.start_election(cluster.nodes[2])
majority = len(cluster.nodes) // 2 + 1
print(f"node 2 선거 시작 (term=1): {votes}/{len(cluster.nodes)}표 획득 "
      f"(과반 {majority}) -> {'당선' if won else '낙선'}")
print(f"  leader = node {cluster.leader.node_id}, term = {cluster.leader.term}")

# 리더 파티션 -> 남은 노드 중 node 0이 새 term으로 재선거
cluster.leader = None
won2, votes2 = cluster.start_election(cluster.nodes[0])
print(f"\nnode 0 재선거 (term={cluster.nodes[0].term}): {votes2}/{len(cluster.nodes)}표 -> "
      f"{'당선' if won2 else '낙선'}")
print(f"  leader = node {cluster.leader.node_id}, term = {cluster.leader.term}")
print("-> term은 단조 증가하며, 같은 term에 한 노드만 투표를 받을 수 있어 리더가 유일하게 결정된다.")
