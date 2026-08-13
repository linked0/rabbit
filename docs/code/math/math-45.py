# 군론 기초(순환군·이산로그) — Z_p^*의 생성원 찾기, 위수(Lagrange), 이산로그 브루트포스
# 교육용 예시: 실제 암호에는 훨씬 큰 소수를 쓴다.

p = 23  # 소수 => Z_p^* = {1,...,p-1}는 위수 p-1 = 22인 순환군

def order_of(g, p):
    """g의 위수: g^k = 1이 되는 최소 양의 k."""
    k, x = 1, g % p
    while x != 1:
        x = (x * g) % p
        k += 1
    return k

group_order = p - 1
print(f"|Z_{p}^*| = {group_order}")

# 모든 원소의 위수를 나열하고 Lagrange 정리(위수는 항상 군의 크기를 나눔) 확인
orders = {g: order_of(g, p) for g in range(1, p)}
for g, o in orders.items():
    assert group_order % o == 0, "Lagrange 정리 위반!"
print("각 원소의 위수(Lagrange 정리: 모두 22를 나눔):")
print({g: o for g, o in list(orders.items())[:6]}, "...")

# 위수가 group_order와 같은 원소 = 생성원(primitive root)
generators = [g for g, o in orders.items() if o == group_order]
print(f"\n생성원들: {generators}")

g = generators[0]
x_secret = 15  # 비밀 지수
h = pow(g, x_secret, p)
print(f"\ng={g}, h=g^x mod p={h} (x는 비밀)")

# 이산로그 브루트포스: h = g^x가 되는 x를 처음부터 찾아본다 (작은 군이라 가능)
for x in range(group_order):
    if pow(g, x, p) == h:
        print(f"브루트포스로 복원한 이산로그 x={x} (정답과 일치: {x == x_secret})")
        break
print("-> 군이 커지면(p가 수백 비트) 이 브루트포스는 우주 나이보다 오래 걸린다 — 이 비대칭성이 공개키 암호의 토대.")
