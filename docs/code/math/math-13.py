# 메커니즘 디자인(VCG 개념) — 단일 물품 경매에 VCG를 적용하면 2위가격(비크리) 경매가 됨을
# 직접 계산으로 확인: 지불액 = "내가 없었다면 다른 참가자들이 얻었을 후생" = 차순위 입찰가.

def vcg_payment(bids: dict, winner: str) -> float:
    # 배분: 신고된 가치 합(단일 물품이므로 = 최고 입찰자)을 최대화.
    # 지불액: 위너가 참여하지 않았을 때 다른 참가자들이 얻는 최적 후생(=차순위 최고가)
    #        에서, 위너 참여 시 다른 참가자들이 얻는 후생(=0, 물품을 못 받으므로)을 뺀 값.
    others = {b: v for b, v in bids.items() if b != winner}
    welfare_without_winner = max(others.values()) if others else 0.0
    welfare_of_others_with_winner = 0.0  # 물품이 하나뿐이라 위너가 다 가져가면 남에게 후생 0
    return welfare_without_winner - welfare_of_others_with_winner

bids = {"alice": 90, "bob": 70, "carol": 55}
winner = max(bids, key=bids.get)
payment = vcg_payment(bids, winner)
second_highest = sorted(bids.values(), reverse=True)[1]

print("입찰:", bids)
print(f"낙찰자(신고 가치 합 최대화): {winner} (가치={bids[winner]})")
print(f"VCG 지불액: {payment}")
print(f"차순위 입찰가(2위가격): {second_highest}")
print("VCG 지불액 == 2위가격?", payment == second_highest)

# 유인합치성 확인: 낙찰자가 진실보다 낮게 신고해도 지불액(payment)은 안 바뀌므로
# (payment 는 '남의' 입찰가에만 의존) 거짓 신고로 순이익을 늘릴 수 없음을 수치로 보인다.
true_value = bids["alice"]
for reported in (95, 90, 75, 60):  # alice 가 진실(90) 대신 다르게 신고해봄
    trial_bids = dict(bids)
    trial_bids["alice"] = reported
    trial_winner = max(trial_bids, key=trial_bids.get)
    if trial_winner == "alice":
        pay = vcg_payment(trial_bids, "alice")
        surplus = true_value - pay   # 실제 가치 기준 순이익
    else:
        surplus = 0.0
    print(f"alice 신고={reported:3} -> 낙찰자={trial_winner:6} 순이익(진짜가치 기준)={surplus}")
