"""
02_chat_template.py — chat template로 instruct 모델을 올바르게 호출하기

왜 중요한가:
  Instruct/Chat 모델은 학습할 때 특정 포맷(<|im_start|>user ... 등)을 썼다.
  raw 문자열을 그대로 넣으면 성능이 크게 떨어진다.
  tokenizer.apply_chat_template()이 모델마다 맞는 포맷을 자동으로 입힌다.

실행:
    python 02_chat_template.py
"""

from mlx_lm import load, generate

MODEL = "mlx-community/Qwen2.5-7B-Instruct-4bit"


def main() -> None:
    model, tokenizer = load(MODEL)

    messages = [
        {"role": "system", "content": "You are a concise financial analyst."},
        {"role": "user", "content": "Summarize prediction markets in 3 bullets."},
    ]

    # add_generation_prompt=True → 모델이 "이제 assistant 차례"라고 인식하도록
    #                              생성 시작 토큰을 붙여준다.
    prompt = tokenizer.apply_chat_template(
        messages,
        add_generation_prompt=True,
    )

    text = generate(
        model,
        tokenizer,
        prompt=prompt,
        max_tokens=256,
        verbose=True,
    )

    print("\n=== RESULT ===")
    print(text)


if __name__ == "__main__":
    main()
