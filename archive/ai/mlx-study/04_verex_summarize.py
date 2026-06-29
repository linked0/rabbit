"""
04_verex_summarize.py — Verex 연결 예제: 예측시장 이벤트 로컬 요약·번역

배경 (50일 로드맵 Phase 4, Day 48):
  Polymarket/UMA 같은 예측시장 이벤트 설명을 로컬 LLM으로 요약하고
  한국어로 번역하는 파이프라인. 클라우드 API 대비 장점:
    - 프라이버시: 데이터가 기기를 벗어나지 않음
    - 비용 0, rate limit 없음, 오프라인 동작
    - M5 128GB면 7B~70B까지 로컬

이 파일은 그 파이프라인의 "한 단계"를 단순화한 데모다.
입력(이벤트 설명) → ① 3줄 요약 → ② 한국어 번역 을 한 번의 모델 로드로 처리한다.

실행:
    python 04_verex_summarize.py
"""

from mlx_lm import load, generate

MODEL = "mlx-community/Qwen2.5-7B-Instruct-4bit"

# 실제로는 Polymarket API 등에서 가져온다. 여기선 하드코딩된 샘플 이벤트.
SAMPLE_EVENT = """
Market: Will the Ethereum PeerDAS upgrade go live on mainnet before October 1, 2026?
Resolution: This market resolves YES if PeerDAS (Peer Data Availability Sampling),
as part of the Fusaka hard fork, is activated on Ethereum mainnet before
2026-10-01 00:00 UTC. It resolves NO otherwise. Resolution source is the official
Ethereum Foundation blog and core dev call notes, adjudicated by UMA's optimistic oracle.
"""


def summarize(model, tokenizer, event_text: str) -> str:
    messages = [
        {"role": "system", "content": "You are a precise prediction-market analyst."},
        {
            "role": "user",
            "content": (
                "Summarize the following prediction market in exactly 3 bullets: "
                "(1) what is being predicted, (2) the YES condition, "
                "(3) the resolution source.\n\n" + event_text
            ),
        },
    ]
    prompt = tokenizer.apply_chat_template(messages, add_generation_prompt=True)
    return generate(model, tokenizer, prompt=prompt, max_tokens=200, verbose=False)


def translate_to_korean(model, tokenizer, english_text: str) -> str:
    messages = [
        {"role": "system", "content": "You are a professional EN->KO translator."},
        {
            "role": "user",
            "content": "Translate to natural Korean. Keep the bullet format:\n\n"
            + english_text,
        },
    ]
    prompt = tokenizer.apply_chat_template(messages, add_generation_prompt=True)
    return generate(model, tokenizer, prompt=prompt, max_tokens=300, verbose=False)


def main() -> None:
    # 핵심: 모델은 한 번만 로드하고, 여러 단계(요약→번역)에 재사용한다.
    model, tokenizer = load(MODEL)

    print("=== 1) ENGLISH SUMMARY ===")
    summary = summarize(model, tokenizer, SAMPLE_EVENT)
    print(summary)

    print("\n=== 2) KOREAN TRANSLATION ===")
    korean = translate_to_korean(model, tokenizer, summary)
    print(korean)


if __name__ == "__main__":
    main()
