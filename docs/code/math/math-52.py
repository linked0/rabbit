# 신뢰된 셋업 vs 투명성(STARK vs SNARK) — 신뢰된 셋업이 있는 스킴은 "독성 폐기물"(toxic
# waste, 셋업에 쓰인 비밀 난수)이 새면 위조 증명이 가능해진다는 걸 토이 버전으로 보여준다.

import random


def trusted_setup():
    # 이 비밀(tau)을 아무도 몰라야 안전 — 만약 한 명이라도 저장해 두면 "독성 폐기물" 유출.
    tau = random.randint(1, 10**9)
    public_params = pow(2, tau, 10**9 + 7)   # 공개되는 건 tau 로 만든 파생값뿐
    return tau, public_params


def verify_honest_proof(public_params, claimed_value):
    return claimed_value == public_params


def forge_with_leaked_tau(tau):
    # tau 가 새어 나가면 검증자를 속이는 "증명"을 그냥 다시 계산해서 만들 수 있다.
    return pow(2, tau, 10**9 + 7)


tau, params = trusted_setup()
print(f"신뢰된 셋업 공개 파라미터 = {params}")
print("정직한 증명자:", verify_honest_proof(params, params), "(정상 검증 통과)")

forged = forge_with_leaked_tau(tau)   # tau 를 안다면 누구나 위조 가능
print("tau 유출 시 위조 증명도 검증 통과:", verify_honest_proof(params, forged))
print("\n반대로 STARK 류(투명성)는 이런 비밀 tau 자체가 없다 — 공개 무작위성(예: 해시)만")
print("쓰므로 '독성 폐기물'이 존재하지 않는다. 대가는 증명 크기가 더 크다는 것.")
