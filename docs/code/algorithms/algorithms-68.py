# [복습] 장애 모델과 신뢰 가정을 먼저 쓰는 습관 — 컴포넌트별 장애 모델·타이밍 모델·정족수를 명시하고 위반 시 무엇이 무너지는지 판정한다.
# 가정을 표로 적어두면 "안전성 vs 활성 중 무엇을 먼저 잃는가"를 코드 없이도 기계적으로 도출할 수 있다.

components = [
    {"name": "체인 합의", "failure_model": "byzantine", "timing": "partial-sync", "quorum_desc": "2f+1 of 3f+1"},
    {"name": "오라클", "failure_model": "crash-recovery", "timing": "async", "quorum_desc": "1-of-N 정직한 리포터"},
    {"name": "시퀀서", "failure_model": "crash-stop", "timing": "sync", "quorum_desc": "단일 운영자(정족수 없음)"},
]

def assess(c):
    if "단일" in c["quorum_desc"]:
        return "활성 취약: 운영자 장애 시 서비스 정지 / 안전성은 유지"
    if c["failure_model"] == "byzantine":
        return "안전성: 악의 노드 < 1/3이면 유지 / 활성: partial-sync 가정이 깨지면 정지"
    if c["timing"] == "async":
        return "안전성 유지 가능 / 활성: 메시지 지연이 무한하면 정지 보장 불가"
    return "안전성: 장애 수 < 정족수면 유지 / 활성: 정족수 확보 시 유지"

for c in components:
    print(f"[{c['name']}] 장애모델={c['failure_model']}, 타이밍모델={c['timing']}, 정족수={c['quorum_desc']}")
    print(f"  -> 판정: {assess(c)}")
