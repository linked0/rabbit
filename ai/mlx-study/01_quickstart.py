"""
01_quickstart.py — MLX 최소 실행 예제 (Day 2 오늘의 목표)

목표: "돌아간다"만 확인한다. tok/s 숫자를 눈으로 보면 성공.

실행:
    python 01_quickstart.py

CLI 한 줄로도 동일하게 가능:
    mlx_lm.generate \
      --model mlx-community/Qwen2.5-7B-Instruct-4bit \
      --prompt "Explain PeerDAS in two sentences." \
      --max-tokens 200
"""

from mlx_lm import load, generate

# 핵심 1) MLX 포맷은 GGUF(llama.cpp)와 별개다.
#         반드시 mlx-community HF 리포에서 받는다. (-4bit = 4비트 양자화)
MODEL = "mlx-community/Qwen2.5-7B-Instruct-4bit"


def main() -> None:
    # 최초 1회는 HuggingFace에서 가중치를 내려받는다(수 GB). 이후엔 캐시 사용.
    model, tokenizer = load(MODEL)

    prompt = "Explain PeerDAS in two sentences."

    # verbose=True 면 생성 텍스트와 함께 prompt/gen tok/s 통계가 출력된다.
    # 통합 메모리(Unified Memory) 덕분에 CPU<->GPU 복사 없이 바로 추론된다.
    text = generate(
        model,
        tokenizer,
        prompt=prompt,
        max_tokens=200,
        verbose=True,
    )

    print("\n=== RESULT ===")
    print(text)


if __name__ == "__main__":
    main()
