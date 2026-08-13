# 셸링 포인트 — 순수 조정 게임에는 대칭적인 내시균형이 여러 개 존재하지만,
# 게임 밖의 "현저성(salience)"이 그중 하나를 특별히 눈에 띄게 만들어 조정을 가능케 한다.

locations = ["Grand Central 시계탑", "Times Square 한복판", "무명 주차장 B구역"]
n = len(locations)

# 순수 조정 게임 payoff: 두 참가자가 같은 곳을 고르면 1, 다르면 0 (완전 대칭)
payoff = [[1 if i == j else 0 for j in range(n)] for i in range(n)]

# 대칭 payoff 행렬에서 순수전략 내시균형은 "둘 다 같은 곳을 고르는" 모든 대각선 칸
pure_nash = [(locations[i], locations[i]) for i in range(n) if payoff[i][i] == 1]
print("payoff 만으로 찾은 순수전략 내시균형 (모두 동등):")
for a, b in pure_nash:
    print(f"  - ({a}, {b})")

# 게임 자체는 이 균형들을 구분하지 못한다. 현실에서는 "얼마나 유명하고 서로 알 만한가"
# 라는 현저성 점수가 선택을 결정한다 — 이것이 셸링 포인트.
salience = {"Grand Central 시계탑": 0.9, "Times Square 한복판": 0.95, "무명 주차장 B구역": 0.05}

focal_point = max(locations, key=lambda loc: salience[loc])
print(f"\n현저성 점수: {salience}")
print(f"셸링 포인트(예측되는 실제 선택): '{focal_point}'")
print("→ payoff 구조는 동일해도, 공유된 현저성이 균형을 하나로 좁힌다.")
