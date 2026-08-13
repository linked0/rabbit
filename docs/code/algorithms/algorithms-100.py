# [Final] 내 스택의 ADR + 위협 모델 한 편 쓰기 — 코드 대신, 채워 넣기만 하면 되는
# ADR/위협 모델 템플릿을 구조화된 형태로 출력한다 (범위: 결정 하나, 시스템 하나로 좁힐 것).

ADR_TEMPLATE = {
    "title": "결정 제목 (예: '오라클 결과 확정 방식으로 낙관적 제안+이의제기 채택')",
    "context": "왜 이 결정이 필요했는가 — 제약, 요구사항, 지금 상태",
    "alternatives": ["검토한 대안 1과 기각 이유", "검토한 대안 2와 기각 이유"],
    "decision": "실제 선택과 그 근거",
    "consequences": "이 결정으로 생기는 결과와 감수하는 트레이드오프",
}

THREAT_MODEL_TEMPLATE = {
    "asset": "보호해야 할 자산 (예: 사용자 예치금, 오라클 결과값, 개인키)",
    "trust_boundary": "신뢰 경계가 어디인가 (예: 온체인 vs 오프체인, 컨트랙트 vs 오퍼레이터)",
    "attacker_capability": "각 경계에서 공격자가 할 수 있는 것 (예: 트랜잭션 순서 조작, 오라클 값 지연)",
    "mitigation": "대응책 (예: 이의제기 기간, 다중서명, 타임락)",
    "residual_risk": "대응 후에도 남는 위험과, 그 위험을 누가 감수하는가",
}

def print_section(title, template):
    print(f"\n== {title} ==")
    for key, value in template.items():
        if isinstance(value, list):
            print(f"- {key}:")
            for item in value:
                print(f"    · {item}")
        else:
            print(f"- {key}: {value}")

def check_completed(template):
    # 빈 칸(placeholder 그대로) 없이 실제로 채워졌는지 확인하는 게이트
    missing = [k for k, v in template.items() if not v]
    return len(missing) == 0, missing

print_section("ADR 템플릿", ADR_TEMPLATE)
print_section("위협 모델 템플릿", THREAT_MODEL_TEMPLATE)

adr_ok, adr_missing = check_completed(ADR_TEMPLATE)
tm_ok, tm_missing = check_completed(THREAT_MODEL_TEMPLATE)
print(f"\nADR 작성 완료 게이트 통과: {adr_ok} (누락: {adr_missing})")
print(f"위협 모델 작성 완료 게이트 통과: {tm_ok} (누락: {tm_missing})")
print("\n다음 100일 사이클로 넘어가기 전, 실제 값으로 위 두 템플릿을 채운 문서 한 편을 남길 것.")
