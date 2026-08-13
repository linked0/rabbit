# Day 29 — Gradient Descent / Convex 직관
# 볼록함수 f(x) = (x - 3)^2 위에서 경사하강법을 돌려 최소점 x=3 으로 수렴하는 과정을 본다.

def f(x):
    return (x - 3) ** 2


def f_prime(x):
    return 2 * (x - 3)


x = 10.0  # 시작점
learning_rate = 0.1
history = [x]

for step in range(30):
    grad = f_prime(x)
    x = x - learning_rate * grad
    history.append(x)

print("경사하강 진행 (x, f(x)):")
for i in [0, 1, 2, 5, 10, 20, len(history) - 1]:
    xi = history[i]
    print(f"  step {i:2d}: x = {xi:.6f}, f(x) = {f(xi):.8f}")

print(f"\n최종 x = {history[-1]:.6f} (참값 x* = 3)")
print(f"최종 f(x) = {f(history[-1]):.10f} (참값 f(x*) = 0)")
