# 크로스체인 신뢰 가정 분류 — 브릿지 vs 라이트클라이언트 vs 인텐트/솔버, 정족수 비율과 최악 손실로 비교한다.
# 각 방식이 "누구를 얼마나 믿어야 자금이 안전한가"를 정족수 비율과 최악 손실액으로 계량화한다.

bridges = [
    {"name": "외부 검증형 멀티시그 브릿지", "type": "external", "n": 9, "threshold": 5, "tvl": 10_000_000},
    {"name": "라이트클라이언트 브릿지", "type": "lightclient", "n": 100, "threshold": 67, "tvl": 10_000_000},
    {"name": "인텐트/솔버 브릿지", "type": "intent", "solver_collateral": 500_000, "tvl": 10_000_000},
]

def worst_case_loss(b):
    if b["type"] in ("external", "lightclient"):
        quorum_fraction = b["threshold"] / b["n"]
        return b["tvl"], quorum_fraction   # 정족수 이상이 담합하면 TVL 전액이 위험
    if b["type"] == "intent":
        return min(b["solver_collateral"], b["tvl"]), None  # 손실은 솔버 담보로 상한이 걸린다
    raise ValueError("unknown bridge type")

for b in bridges:
    loss, quorum_fraction = worst_case_loss(b)
    if quorum_fraction is not None:
        print(f"{b['name']}: 담합 필요 비율 {quorum_fraction:.0%}, 최악 손실 ${loss:,}")
    else:
        print(f"{b['name']}: 담합 비율 N/A(솔버 단독 위험), 최악 손실 ${loss:,} (담보 상한)")

# 라이트클라이언트는 담합 비율이 호스트 체인 자체의 BFT 안전 가정(2/3)과 같아 "추가 신뢰가 없다" —
# 반면 외부 멀티시그는 별도의 작은 검증자 집합을 새로 신뢰해야 한다
print("\n추가 신뢰 요구 여부:")
for b in bridges:
    extra_trust = "없음(호스트 체인 신뢰만 재사용)" if b["type"] == "lightclient" else "있음(별도 주체 신뢰 필요)"
    print(f"  {b['name']}: {extra_trust}")
