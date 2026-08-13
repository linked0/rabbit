# 사기 증명 vs 유효성 증명의 게임 이론 — 본드·이득·검증비용·적발확률로 "사기가 손해"인 조건을 구한다.
# 기대이익 = (1-p)*이득 - p*본드 가 0보다 작아야 사기가 억제되며, 그 경계 p*를 계산한다.

def expected_profit_from_fraud(gain, bond, detect_prob):
    return (1 - detect_prob) * gain - detect_prob * bond

gain = 50_000          # 사기가 성공했을 때 얻는 이득
bond = 100_000         # 사기가 적발되면 몰수당하는 본드(슬래싱)
challenge_cost = 500   # 정직한 챌린저가 검증·이의제기에 쓰는 비용

for detect_prob in (0.3, 0.5, 0.7, 0.9):
    ev = expected_profit_from_fraud(gain, bond, detect_prob)
    verdict = "사기 시도가 이득" if ev > 0 else "사기 시도가 손해(억제됨)"
    print(f"적발확률 p={detect_prob:.1f} → 기대이익={ev:,.0f} → {verdict}")

# 손익분기 적발확률: (1-p)*gain - p*bond = 0  =>  p* = gain / (gain + bond)
breakeven_p = gain / (gain + bond)
print(f"\n손익분기 적발확률 p* = {breakeven_p:.3f} (이보다 낮으면 사기가 합리적 선택이 된다)")

# verifier's dilemma: 챌린지 비용이 있으므로, 적발 시 보상이 최소 challenge_cost는 넘어야
# 합리적 챌린저가 실제로 나선다 — 그렇지 않으면 아무도 검증하지 않아 p 자체가 0에 가까워진다
slashed_reward_share = bond * 0.1  # 슬래싱된 본드의 10%를 챌린저에게 분배한다고 가정
incentive = "있음" if slashed_reward_share > challenge_cost else "없음"
print(f"챌린저 보상(본드의 10%)={slashed_reward_share:,.0f} vs 챌린지 비용={challenge_cost:,} → 챌린저가 나설 유인 {incentive}")
