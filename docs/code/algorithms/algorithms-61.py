# 데이터 가용성 샘플링과 소거부호(Reed-Solomon) — k=4,n=8 시스터매틱 RS 부호로 조각 4개만으로 원본 복원.
# 원본 데이터를 다항식 평가값으로 삼아 보간한 뒤 8개 지점에서 평가해 조각을 만들고, 임의의 4조각으로 라그랑주 보간해 되살린다.

P = 257  # 8비트 심볼보다 큰 소수 (GF(p) 산술)

def lagrange_interpolate(xs, ys, x, p=P):
    total = 0
    n = len(xs)
    for i in range(n):
        xi, yi = xs[i], ys[i]
        num, den = 1, 1
        for j in range(n):
            if i == j:
                continue
            num = (num * (x - xs[j])) % p
            den = (den * (xi - xs[j])) % p
        total = (total + yi * num * pow(den, p - 2, p)) % p
    return total % p

k, n = 4, 8
data = [65, 66, 67, 68]            # 원본 데이터 심볼 (예: 'A','B','C','D')
xs_known = list(range(k))          # 0,1,2,3 지점에 원본을 심는다 (systematic 배치)

# 원본 4점을 지나는 차수<=3 다항식을 8개 지점(0..7)에서 평가해 소거부호 조각을 만든다
shares = [lagrange_interpolate(xs_known, data, x) for x in range(n)]
print("원본 데이터:", data)
print("소거부호 조각 8개:", shares)

# 원본 조각(0~3)이 전부 사라지고 패리티 조각(4~7)만 남았다고 가정
available = [4, 5, 6, 7]
recovered = [lagrange_interpolate(available, [shares[i] for i in available], x) for x in range(k)]
print("원본 조각 전부 소실, 패리티 4개로만 복원:", recovered)
print("복원 성공 여부:", recovered == data)

def sampling_pass_prob_hidden_undetected(n, hidden, s):
    """숨겨진 조각을 표본 s개가 하나도 건드리지 못할 확률 (=DAS가 은닉을 놓칠 확률)."""
    visible = n - hidden
    if s > visible:
        return 0.0
    prob = 1.0
    for i in range(s):
        prob *= (visible - i) / (n - i)
    return prob

print()
for s in (1, 2, 4, 8):
    p_miss = sampling_pass_prob_hidden_undetected(n=8, hidden=4, s=s)
    print(f"조각 절반이 숨겨졌을 때 샘플 {s}개로 은닉을 놓칠 확률: {p_miss:.4f}")
