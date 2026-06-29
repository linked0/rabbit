from mlx_lm import load, generate

# 모델 로드 (처음엔 다운로드, 이후 캐시 사용)
model, tokenizer = load("mlx-community/Llama-3.3-70B-Instruct-4bit")

# 채팅 포맷으로 Verex 개발 도우미 활용
messages = [
    {"role": "system",
     "content": "You are a DeFi smart contract security auditor."},
    {"role": "user",
     "content": "Review potential reentrancy risks in a prediction market contract."}
]
formatted = tokenizer.apply_chat_template(
    messages, tokenize=False, add_generation_prompt=True
)
result = generate(
    model, tokenizer,
    prompt=formatted,
    max_tokens=500,
    verbose=True      # tokens/sec 측정 출력
)
print(result)