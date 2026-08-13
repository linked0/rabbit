# 분산 트레이싱과 샘플링 전략 — trace_id 전파로 스팬을 하나의 트레이스로 묶고,
# 헤드 기반 샘플링(시작 시 결정)과 테일 기반 샘플링(완료 후 에러/느린 트레이스만 선별)을 비교한다.

import random
import uuid

random.seed(3)

class Span:
    def __init__(self, trace_id, name, duration_ms, error=False, parent=None):
        self.trace_id = trace_id
        self.span_id = uuid.uuid4().hex[:8]
        self.parent = parent.span_id if parent else None
        self.name = name
        self.duration_ms = duration_ms
        self.error = error

def make_trace(slow=False, error=False):
    trace_id = uuid.uuid4().hex[:8]
    root = Span(trace_id, "api.handle", random.uniform(5, 15))
    child = Span(trace_id, "match.execute", random.uniform(3, 8), parent=root)
    tail = Span(trace_id, "db.settle", 200 if slow else random.uniform(2, 6),
                error=error, parent=child)
    return [root, child, tail]

def head_sample_decision(trace_id, rate=0.1):
    """트레이스 시작 시점에 확률적으로 결정하고, 이 결정을 모든 자식 스팬에 전파한다."""
    return (int(trace_id, 16) % 1000) < rate * 1000

def tail_sample_decision(spans, latency_threshold_ms=100):
    """트레이스가 끝난 뒤 전체를 보고, 에러거나 느리면 남긴다."""
    total = sum(s.duration_ms for s in spans)
    has_error = any(s.error for s in spans)
    return has_error or total > latency_threshold_ms

traces = (
    [make_trace() for _ in range(20)]
    + [make_trace(slow=True) for _ in range(2)]
    + [make_trace(error=True) for _ in range(2)]
)

head_kept = sum(1 for t in traces if head_sample_decision(t[0].trace_id))
tail_kept_important = sum(
    1 for t in traces
    if tail_sample_decision(t) and (any(s.error for s in t) or sum(s.duration_ms for s in t) > 100)
)
important_total = sum(1 for t in traces if any(s.error for s in t) or sum(s.duration_ms for s in t) > 100)
head_kept_important = sum(
    1 for t in traces
    if head_sample_decision(t[0].trace_id) and (any(s.error for s in t) or sum(s.duration_ms for s in t) > 100)
)

print(f"전체 트레이스: {len(traces)}, 그중 중요한(에러/느림) 트레이스: {important_total}")
print(f"헤드 샘플링(10%)으로 보존된 트레이스: {head_kept}, 그중 중요한 것: {head_kept_important}")
print(f"테일 샘플링으로 보존된 중요한 트레이스: {tail_kept_important} / {important_total}")
print("-> 테일 샘플링은 저장량을 줄이면서도 중요한 트레이스를 놓치지 않는다.")
