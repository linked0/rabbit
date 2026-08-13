# 내시균형·죄수의 딜레마 — 2x2 보수행렬을 놓고 최적대응(best response)으로
# 내시균형을 직접 찾는다: 상대가 무엇을 하든 배신이 낫다 -> (배신,배신)이 유일한 균형.

# 행: 나의 선택, 열: 상대의 선택. 값은 (나의 보수, 상대의 보수). 낮을수록 형량이 짧다(=이득이 큼).
COOPERATE, DEFECT = "협력", "배신"
payoff = {
    (COOPERATE, COOPERATE): (-1, -1),
    (COOPERATE, DEFECT):    (-3, 0),
    (DEFECT, COOPERATE):    (0, -3),
    (DEFECT, DEFECT):       (-2, -2),
}

def best_responses(my_options, opp_action, my_index):
    # opp_action 이 고정일 때, 내가 얻는 보수가 가장 좋은(가장 큰) 선택지들을 반환.
    scores = {my: payoff[(my, opp_action)][my_index] if my_index == 0 else payoff[(opp_action, my)][my_index]
              for my in my_options}
    best = max(scores.values())
    return [a for a, s in scores.items() if s == best]

actions = [COOPERATE, DEFECT]

print("A가 최적대응(B의 선택별로 A가 최선인 행동):")
for b in actions:
    br = best_responses(actions, b, my_index=0)
    print(f"  B={b} -> A의 최적대응 = {br}")

print("B가 최적대응(A의 선택별로 B가 최선인 행동):")
for a in actions:
    br = best_responses(actions, a, my_index=1)
    print(f"  A={a} -> B의 최적대응 = {br}")

# 내시균형: 두 사람 모두 상대의 선택에 대해 최적대응 중인 조합.
nash_equilibria = []
for a in actions:
    for b in actions:
        a_is_best = a in best_responses(actions, b, my_index=0)
        b_is_best = b in best_responses(actions, a, my_index=1)
        if a_is_best and b_is_best:
            nash_equilibria.append((a, b))

print("\n내시균형:", nash_equilibria)
print("각자 -1(모두 협력)보다 나쁜 -2(모두 배신)가 균형 -> 개인합리성과 집단효율의 괴리 확인.")
