"""
02_router_rules.py — Router로 규칙 기반 자동 전환

핵심 아이디어:
  매번 모델 문자열을 손으로 고르지 않는다. Router에 별칭(cheap/smart)을 등록해 두고,
  "작업 종류"에 따라 코드가 알아서 로컬↔클라우드를 고른다.

  규칙(이 예제): audit/proof 같은 고난도 → smart(클라우드 OpenAI)
                그 외 일상 작업       → cheap(로컬 Ollama)

이 파일은 (1) 라우팅 "결정"을 먼저 보여주고, (2) 백엔드가 준비됐을 때만 실제 호출한다.
백엔드가 없어도 결정 로직은 그대로 확인할 수 있게 try/except로 감쌌다.

준비물:
  - pip install litellm
  - 로컬:   `ollama serve` + `ollama pull llama3.3:70b`
  - 클라우드: 환경변수 OPENAI_API_KEY

실행:
    python 02_router_rules.py
"""

import os

from litellm import Router

router = Router(
    model_list=[
        {"model_name": "cheap", "litellm_params": {"model": "ollama/llama3.3:70b"}},
        {"model_name": "smart", "litellm_params": {"model": "openai/gpt-4o"}},
    ]
)

# 고난도로 분류해 클라우드로 보낼 작업 종류
HARD_KINDS = ("audit", "proof")


def pick(task_kind: str) -> str:
    """작업 종류 → 별칭(cheap/smart) 결정. 호출 없이 규칙만 본다."""
    return "smart" if task_kind in HARD_KINDS else "cheap"


def route(task_kind: str, prompt: str):
    name = pick(task_kind)
    return router.completion(
        model=name, messages=[{"role": "user", "content": prompt}]
    )


def main() -> None:
    jobs = [
        ("summarize", "이 PR 변경을 한 줄로 요약"),
        ("audit", "이 컨트랙트의 reentrancy 위험을 감사"),
        ("translate", "Translate 'gm' to Korean"),
        ("proof", "이 불변식이 항상 성립함을 증명"),
    ]

    has_cloud = bool(os.getenv("OPENAI_API_KEY"))

    for kind, prompt in jobs:
        name = pick(kind)
        print(f"[{kind:10}] → {name:5}", end="  ")
        # smart(클라우드)인데 키가 없으면 결정만 출력하고 호출은 생략
        if name == "smart" and not has_cloud:
            print("(결정만: OPENAI_API_KEY 미설정 → 호출 생략)")
            continue
        try:
            resp = route(kind, prompt)
            print("✅", resp.choices[0].message.content[:60].replace("\n", " "), "…")
        except Exception as e:  # 백엔드 미준비 등
            print(f"⚠️  호출 실패: {type(e).__name__} — {str(e)[:60]}")


if __name__ == "__main__":
    main()
