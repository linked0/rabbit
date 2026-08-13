# 컬럼 스토어와 벡터화 실행(OLAP) — 로우 스토어와 컬럼 스토어의 I/O·압축 차이를 흉내낸다.
# 컬럼별로 값을 모으면 RLE 압축이 잘 듣고, 한 컬럼만 읽어도 되는 질의에서 I/O 가 줄어든다.

rows = [
    {"country": "KR", "amount": 100},
    {"country": "KR", "amount": 120},
    {"country": "US", "amount": 90},
    {"country": "US", "amount": 95},
    {"country": "US", "amount": 80},
]

# 로우 스토어: "amount 합계"를 구하려면 레코드 전체를 훑어야 한다.
row_store_bytes_touched = sum(len(r) for r in rows) * 8  # 필드 전부를 스캔한다고 가정

# 컬럼 스토어: amount 컬럼만 연속 배치로 저장 → 그 컬럼만 읽으면 된다.
column_store = {
    "country": [r["country"] for r in rows],
    "amount": [r["amount"] for r in rows],
}
column_store_bytes_touched = len(column_store["amount"]) * 8  # amount 컬럼만 스캔

def run_length_encode(values):
    out = []
    for v in values:
        if out and out[-1][0] == v:
            out[-1][1] += 1
        else:
            out.append([v, 1])
    return out

# 벡터화 실행: 튜플 하나씩이 아니라 컬럼 배열 전체에 한 번에 연산(sum)을 적용한다.
def vectorized_sum(col):
    return sum(col)  # 실제 엔진은 SIMD 로 배치 처리하지만, 여기선 개념만 시연

country_rle = run_length_encode(column_store["country"])
total_amount = vectorized_sum(column_store["amount"])

print("row store bytes touched for SUM(amount):", row_store_bytes_touched)
print("column store bytes touched for SUM(amount):", column_store_bytes_touched)
print("country column RLE:", country_rle)          # [['KR', 2], ['US', 3]]
print("vectorized SUM(amount):", total_amount)      # 485
