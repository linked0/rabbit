# 고정소수점 산술과 반올림 정책 — 정수 스케일(1e18)로 나눗셈 절사 오차를 다루고,
# "프로토콜에 유리한 방향"으로 반올림해 dust leak(잔여분 누적 착취)을 막는 것을 시연.

SCALE = 10**18  # 고정소수점 스케일 (EVM의 흔한 관례)

def mul_div_floor(a, b, denom):
    return (a * b) // denom            # 사용자가 "받는" 양 — 내림 (프로토콜에 유리)

def mul_div_ceil(a, b, denom):
    return -((-(a * b)) // denom)      # 사용자가 "내는" 양 — 올림 (프로토콜에 유리)

price = 3 * SCALE // 7  # 나누어떨어지지 않는 가격 (절사 오차가 필연적으로 생김)

def swap_user_receives(amount_in):
    # 사용자가 amount_in 을 내고 price 만큼의 비율로 얼마를 받는지: 내림 처리
    return mul_div_floor(amount_in, SCALE, price)

def swap_user_pays(amount_out_wanted):
    # 사용자가 amount_out_wanted 를 원할 때 얼마를 내야 하는지: 올림 처리
    return mul_div_ceil(amount_out_wanted * price, 1, SCALE)

amount_in = 1_000_000  # 아주 작은 입력 (절사 오차가 상대적으로 크게 드러나도록)
received_correct = swap_user_receives(amount_in)   # 내림 (안전)
received_wrong = (amount_in * SCALE) // price if True else None
paid_correct = swap_user_pays(received_correct)     # 올림 (안전)

print("price (scaled):", price, "=> approx", price / SCALE)
print("user receives (floor, protocol-favoring):", received_correct)
print("re-quoted amount user must pay (ceil, protocol-favoring):", paid_correct)
print("paid >= amount_in (no value leaked to user via rounding):", paid_correct >= amount_in)

# 반대로 "받는 양"을 올림 처리하면 반복 거래로 프로토콜에서 조금씩 잔여분을 긁어갈 수 있다
def swap_user_receives_UNSAFE(amount_in):
    return mul_div_ceil(amount_in, SCALE, price)

unsafe_received = swap_user_receives_UNSAFE(amount_in)
print()
print("UNSAFE variant (rounds in user's favor) receives:", unsafe_received)
print("unsafe > safe by:", unsafe_received - received_correct, "=> repeated trades could drain dust")
