# LMSR/마켓 스코어링(Verex 연결) — 로그-합-지수 비용함수와 경로독립적 가격
# C(q) = b*ln(sum(exp(q_i/b))), price_i = exp(q_i/b) / sum(exp(q_j/b))  (softmax)

import math

def cost(q, b):
    m = max(q)  # 오버플로 방지를 위한 log-sum-exp 안정화 트릭
    return b * (m / b + math.log(sum(math.exp((qi - m) / b) for qi in q)))

def prices(q, b):
    m = max(q)
    exps = [math.exp((qi - m) / b) for qi in q]
    s = sum(exps)
    return [e / s for e in exps]

b = 100.0  # 유동성 파라미터: 클수록 가격 변동은 완만해지고 손실 상한은 커진다
q = [0.0, 0.0]  # 두 결과(YES/NO) 초기 보유 수량, 시작 가격은 각각 0.5

print("초기 가격:", [round(p, 4) for p in prices(q, b)])

def buy(q, b, outcome, shares):
    before = cost(q, b)
    q2 = list(q)
    q2[outcome] += shares
    after = cost(q2, b)
    return q2, after - before  # 지불해야 할 비용

# YES에 20주 매수
q, paid = buy(q, b, 0, 20)
print(f"YES 20주 매수 비용 = {paid:.4f}, 매수 후 가격 = {[round(p,4) for p in prices(q, b)]}")

# 같은 거래를 유동성이 작은 마켓(b=20)에서 하면 가격이 훨씬 크게 움직인다
q_small, paid_small = buy([0.0, 0.0], 20.0, 0, 20)
print(f"[b=20] 같은 20주 매수 비용 = {paid_small:.4f}, 가격 = {[round(p,4) for p in prices(q_small, 20.0)]}")

# 마켓 메이커의 최대 손실 상한은 b*ln(결과 수)로 유한하다
worst_case_loss = b * math.log(len(q))
print(f"b={b}일 때 마켓 메이커 최대 손실 상한 = {worst_case_loss:.4f}")
