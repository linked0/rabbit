# 영지식 증명의 3성질(완전성·건전성·영지식) — 그래프 3색칠 문제의 대화형 ZK 프로토콜을
# 여러 라운드 시뮬레이션해, "거짓 증명이 계속 통과할 확률이 지수적으로 줄어드는 것"을 본다.

import random

# 삼각형 하나(간선 3개) — 진짜 3색칠 가능한 그래프
edges = [(0, 1), (1, 2), (2, 0)]
coloring = {0: "R", 1: "G", 2: "B"}   # 증명자만 아는 비밀


def prover_commit(coloring, perm):
    # 색을 무작위로 재배치(퍼뮤테이션)해서 커밋 — 매 라운드 다른 색 배정처럼 보이게.
    return {v: perm[c] for v, c in coloring.items()}


def round_trip(coloring, edges, cheat=False):
    perm = {"R": "G", "G": "B", "B": "R"}   # 색 재배치(진짜 증명자는 이런 순열을 매번 새로 고름)
    committed = prover_commit(coloring, perm) if not cheat else {0: "R", 1: "R", 2: "B"}  # 부정직: 두 정점 같은 색
    u, v = random.choice(edges)             # 검증자가 무작위로 간선 하나 선택
    return committed[u] != committed[v]      # 그 간선의 두 끝점 색이 다른지만 공개


N = 20
honest_ok = sum(round_trip(coloring, edges) for _ in range(N))
cheat_ok = sum(round_trip(coloring, edges, cheat=True) for _ in range(N))
print(f"정직한 증명자: {honest_ok}/{N} 라운드 통과 (완전성 — 항상 통과해야 함)")
print(f"부정직한 증명자: {cheat_ok}/{N} 라운드 통과 (매 라운드 들킬 확률 >= 1/|E| — 반복할수록 사기 확률이 지수적으로 감소)")
print("영지식성: 검증자는 매 라운드 '두 끝점 색이 다르다'만 보고, 실제 색은 절대 못 봄")
