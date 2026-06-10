import { appMode } from "@/lib/mode";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

// AI 채팅 추상화 (plan §5): local → Ollama, cloud → OpenAI
// 반환: 어시스턴트 텍스트 조각(plain text)의 스트림
export async function streamChat(
  messages: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  return appMode() === "cloud" ? streamCloud(messages) : streamOllama(messages);
}

const OPENAI_MODEL = "gpt-4o-mini";

async function streamOllama(messages: ChatMessage[]) {
  const base = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL;
  if (!model) throw new Error("OLLAMA_MODEL이 설정되지 않았습니다.");

  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: true }),
  });
  if (!res.ok || !res.body) throw new Error(`Ollama 오류: HTTP ${res.status}`);

  // NDJSON 줄 → message.content 만 추출
  return extractLines(res.body, (line) => {
    return JSON.parse(line)?.message?.content ?? "";
  });
}

async function streamCloud(messages: ChatMessage[]) {
  const provider = process.env.AI_PROVIDER ?? "openai";
  if (provider !== "openai") {
    throw new Error(`지원하지 않는 AI_PROVIDER: ${provider}`);
  }
  const key = process.env.AI_API_KEY;
  if (!key) throw new Error("AI_API_KEY가 설정되지 않았습니다.");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: OPENAI_MODEL, messages, stream: true }),
  });
  if (!res.ok || !res.body) throw new Error(`OpenAI 오류: HTTP ${res.status}`);

  // SSE("data: {...}") 줄 → choices[0].delta.content 만 추출
  return extractLines(res.body, (line) => {
    if (!line.startsWith("data: ")) return "";
    const payload = line.slice(6);
    if (payload === "[DONE]") return "";
    return JSON.parse(payload)?.choices?.[0]?.delta?.content ?? "";
  });
}

// 업스트림 바이트 스트림을 줄 단위로 잘라, extract로 뽑은 텍스트만 재전송
function extractLines(
  body: ReadableStream<Uint8Array>,
  extract: (line: string) => string
) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buf = "";
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buf += decoder.decode(chunk, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const text = extract(trimmed);
            if (text) controller.enqueue(encoder.encode(text));
          } catch {
            // 파싱 불가 줄(keep-alive 등)은 무시
          }
        }
      },
    })
  );
}
