"""
03_streaming.py — 토큰 스트리밍 (한 글자씩 실시간 출력)

왜 중요한가:
  실제 앱(챗 UI, CLI 도구)에서는 전체 생성이 끝날 때까지 기다리지 않고
  토큰이 나오는 즉시 보여줘야 체감 속도가 빠르다.
  generate()는 완성본을 한 번에 주지만, stream_generate()는 조각씩 yield 한다.

실행:
    python 03_streaming.py
"""

from mlx_lm import load, stream_generate

MODEL = "mlx-community/Qwen2.5-7B-Instruct-4bit"


def main() -> None:
    model, tokenizer = load(MODEL)

    messages = [
        {"role": "user", "content": "List 3 risks of running LLMs locally."},
    ]
    prompt = tokenizer.apply_chat_template(messages, add_generation_prompt=True)

    print("=== STREAMING ===")
    last = None
    for chunk in stream_generate(model, tokenizer, prompt=prompt, max_tokens=300):
        # chunk.text 는 새로 생성된 조각. end=""로 이어 붙여 출력.
        print(chunk.text, end="", flush=True)
        last = chunk

    print("\n\n=== STATS ===")
    if last is not None:
        # 마지막 chunk에 누적 통계가 담겨 있다.
        print(f"prompt: {last.prompt_tokens} tok @ {last.prompt_tps:.1f} tok/s")
        print(f"gen:    {last.generation_tokens} tok @ {last.generation_tps:.1f} tok/s")
        print(f"peak memory: {last.peak_memory:.2f} GB")


if __name__ == "__main__":
    main()
