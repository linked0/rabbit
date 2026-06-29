"""
01_unified_completion.py — 하나의 인터페이스로 여러 백엔드 호출

핵심 아이디어:
  LiteLLM의 completion()은 모델 문자열만 바꾸면 OpenAI / Anthropic / Ollama 등
  서로 다른 백엔드를 "똑같은 코드"로 호출한다. 호출부를 백엔드에 종속시키지 않는 게 목적.

  - 로컬(ollama): 무료, 데이터가 기기를 벗어나지 않음 → 쉬운/민감 작업
  - 클라우드(openai): 고난도 작업(감사 수준 리뷰, 증명) → 품질 우선

준비물:
  - pip install litellm
  - 로컬:   `ollama serve` 후 `ollama pull llama3.3:70b`
  - 클라우드: 환경변수 OPENAI_API_KEY 설정

실행:
    python 01_unified_completion.py
"""

import os

from litellm import completion

# 클라우드 모델 (원하면 gpt-4o-mini, gpt-4.1 등으로 교체)
CLOUD_MODEL = "openai/gpt-4o"


def ask(model: str, prompt: str) -> str:
    """모델 문자열만 다를 뿐, 호출 코드는 모든 백엔드에서 동일하다."""
    resp = completion(model=model, messages=[{"role": "user", "content": prompt}])
    return resp.choices[0].message.content


def main() -> None:
    # 로컬(무료·민감 데이터) — M5에서 직접 추론
    print("=== LOCAL (ollama/llama3.3:70b) ===")
    print(ask("ollama/llama3.3:70b", "이 함수가 하는 일을 한 줄로 요약해줘: def add(a,b): return a+b"))

    # 클라우드(고난도) — 키가 없거나 잘못돼도 크래시 없이 안내만 한다
    print(f"\n=== CLOUD ({CLOUD_MODEL}) ===")
    if not os.getenv("OPENAI_API_KEY"):
        print("(OPENAI_API_KEY 미설정 — 클라우드 호출 건너뜀)")
        return
    try:
        print(ask(CLOUD_MODEL, "감사 수준의 코드리뷰 체크리스트 3가지만"))
    except Exception as e:
        # 가장 흔한 원인: 키 오타/공백/만료 → 401 authentication_error
        print(f"⚠️  클라우드 호출 실패: {type(e).__name__}")
        print(f"   {str(e)[:120]}")
        print("   힌트: OPENAI_API_KEY 값 확인 (sk- 로 시작, 공백/따옴표 없이).")


if __name__ == "__main__":
    main()
