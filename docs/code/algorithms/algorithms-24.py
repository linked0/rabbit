# JIT 계층화·워밍업·역최적화(deopt) — 호출 횟수로 티어를 올리고, 타입 가정이 깨지면 deopt한다.

class JitFunction:
    def __init__(self, threshold=5):
        self.call_count = 0
        self.threshold = threshold
        self.tier = "interpreter"
        self.assumed_type = None
        self.deopt_count = 0

    def call(self, x):
        self.call_count += 1
        if self.tier == "interpreter" and self.call_count >= self.threshold:
            self.tier = "optimized"
            self.assumed_type = type(x)          # 관측한 타입으로 특수화(가정 수립)

        if self.tier == "optimized":
            if type(x) is not self.assumed_type:  # guard 실패
                self.tier = "interpreter"          # deopt: 인터프리터 프레임으로 복귀
                self.deopt_count += 1
                self.assumed_type = None
                self.call_count = 0
            else:
                return x * 2                       # 특수화된 빠른 경로
        return x * 2                                # 일반(느린) 경로

fn = JitFunction(threshold=3)
trace = []
for x in [1, 2, 3, 4, 5, "oops", 6, 7, 8, 9]:
    tier_before = fn.tier
    result = fn.call(x)
    trace.append((x, tier_before, fn.tier, result))

for x, before, after, result in trace:
    marker = " <- DEOPT" if before == "optimized" and after == "interpreter" else ""
    print(f"call({x!r:>7}): tier {before:>11} -> {after:<11} result={result}{marker}")
print(f"\n총 deopt 횟수: {fn.deopt_count}")
