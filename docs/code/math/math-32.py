# Day 32 — 고정소수점 산술 (Q64.96)
# 정수 하나에 소수부 96비트를 암묵적으로 두는 Q64.96 형식을 흉내내어 곱셈/나눗셈 스케일링을 보여준다.

Q96 = 96
SCALE = 1 << Q96  # 2^96


def to_fixed(x: float) -> int:
    return int(round(x * SCALE))


def from_fixed(x_fixed: int) -> float:
    return x_fixed / SCALE


def fixed_mul(a_fixed: int, b_fixed: int) -> int:
    # 곱셈 결과의 소수부는 2*96비트가 되므로 다시 SCALE로 나눠 되돌린다.
    return (a_fixed * b_fixed) // SCALE


def fixed_div(a_fixed: int, b_fixed: int) -> int:
    # 나눗셈은 먼저 SCALE을 곱해 정밀도를 보존한 뒤 나눈다.
    return (a_fixed * SCALE) // b_fixed


price_a = to_fixed(1.0001)  # Uniswap v3 스타일 sqrtPrice 유사값
price_b = to_fixed(2.5)

product_fixed = fixed_mul(price_a, price_b)
quotient_fixed = fixed_div(price_a, price_b)

print(f"a = {from_fixed(price_a)}, b = {from_fixed(price_b)}")
print(f"a * b (fixed) = {from_fixed(product_fixed):.10f} (참값 {1.0001 * 2.5})")
print(f"a / b (fixed) = {from_fixed(quotient_fixed):.10f} (참값 {1.0001 / 2.5})")
print(f"\n원시 정수 a_fixed 자릿수: {len(str(price_a))} (Q64.96은 160비트 안에 들어감)")
