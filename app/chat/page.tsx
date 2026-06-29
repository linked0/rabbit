import Nav from "../Nav";
import ChatClient from "./ChatClient";
import { appMode } from "@/lib/mode";

// AI 챗 페이지 (plan §5) — 인증은 middleware가 보장
export const dynamic = "force-dynamic";

export default function ChatPage() {
  const local = appMode() === "local";
  const backend = local
    ? `Ollama (${process.env.OLLAMA_MODEL ?? "모델 미설정"})`
    : `OpenAI (${process.env.AI_PROVIDER ?? "openai"})`;

  return (
    <>
      <Nav />
      <main>
        <h1>AI 챗</h1>
        <p className="sub">백엔드: {backend}</p>
        <ChatClient />
      </main>
    </>
  );
}
