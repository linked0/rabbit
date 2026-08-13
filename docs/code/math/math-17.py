# 반복게임과 평판(grim trigger) — 할인인자가 임계치 이상이면 "영원한 보복" 위협만으로
# 무한반복 죄수의 딜레마에서 협력이 균형으로 유지됨을 수치로 확인한다.

# 표준 PD payoff: R(둘다 협력) < T(배신 유혹) 이고 P(둘다 배신) 는 그 사이 어딘가
T, R, P, S = 5, 3, 1, 0  # Temptation, Reward, Punishment, Sucker

# grim trigger: 상대가 한 번이라도 배신하면 그 뒤로 영원히 배신으로 응징
# 협력 유지 조건(이탈 무이익): R/(1-δ) >= T + δ*P/(1-δ)  =>  δ >= (T-R)/(T-P)
threshold = (T - R) / (T - P)
print(f"협력 유지를 위한 할인인자 임계값 δ* = (T-R)/(T-P) = {threshold:.3f}")


def value_of_cooperating(delta: float) -> float:
    # 계속 협력 → 매 라운드 R을 무한히 할인합산
    return R / (1 - delta)


def value_of_deviating_once(delta: float) -> float:
    # 이번 라운드만 배신(T 획득) 후 상대의 grim trigger로 영원히 P
    return T + delta * P / (1 - delta)


for delta in (0.3, threshold, 0.7):
    coop = value_of_cooperating(delta)
    dev = value_of_deviating_once(delta)
    verdict = "협력 우세 → 협력이 균형으로 유지" if coop >= dev else "이탈 우세 → 협력 붕괴"
    print(f"δ={delta:.3f}: V(협력)={coop:8.3f}  V(1회 이탈+영구응징)={dev:8.3f}  → {verdict}")
