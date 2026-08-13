# PBS·MEV 경매·타이밍 게임 — 빌더들이 블록 가치를 놓고 입찰하고, 제안자는 슬롯 안에서 제안 시점을 늦춰 더 높은 입찰을 노린다.
# 타이밍 게임은 "늦게 낼수록 입찰가는 오르지만 슬롯을 놓칠 확률도 오른다"는 트레이드오프를 기대값으로 최적화한다.

import random
random.seed(7)

def builder_bids(round_num):
    # 서처 번들이 쌓일수록 빌더 입찰가가 오른다고 가정
    return [round(random.uniform(0.5, 1.0) * (1 + 0.05 * round_num), 3) for _ in range(4)]

print("=== PBS 경매: 라운드마다 빌더 4곳이 입찰, 제안자는 최고가만 채택 ===")
for round_num in range(3):
    bids = builder_bids(round_num)
    print(f"라운드 {round_num}: 빌더 입찰 {bids} → 채택 입찰 {max(bids)}")

print("\n=== 타이밍 게임: 슬롯(12초) 안에서 제안 시점 t를 늦출수록 입찰가는 오르지만 놓칠 확률도 오른다 ===")
SLOT_SECONDS = 12

def bid_at(t):
    return 1.0 + 0.15 * t                      # 늦게 제안할수록 더 많은 번들을 모아 입찰가 상승

def miss_probability(t):
    return min(0.9, (t / SLOT_SECONDS) ** 2)    # 마감에 가까울수록 네트워크 전파 실패 위험 급증

best_t, best_ev = 0, -1
for t in range(0, SLOT_SECONDS + 1):
    ev = bid_at(t) * (1 - miss_probability(t))
    if ev > best_ev:
        best_t, best_ev = t, ev
    print(f"t={t:2d}s  입찰가={bid_at(t):.2f}  놓칠확률={miss_probability(t):.2%}  기대수익={ev:.3f}")

print(f"\n기대수익 최대화 제안 시점: t={best_t}s (기대수익={best_ev:.3f}) — 무한정 늦추는 게 최선이 아니다")
