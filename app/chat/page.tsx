import Nav from "../Nav";
import ChatClient from "./ChatClient";
import { appMode } from "@/lib/mode";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// AI 챗 페이지 (plan §5) — 인증은 middleware가 보장
export const dynamic = "force-dynamic";

export default function ChatPage() {
  const lang = getLang();
  const local = appMode() === "local";
  const backend = local
    ? `Ollama (${process.env.OLLAMA_MODEL ?? pick(lang, "모델 미설정", "model not set")})`
    : `OpenAI (${process.env.AI_PROVIDER ?? "openai"})`;

  return (
    <>
      <Nav />
      <main>
        <h1>{pick(lang, "AI 챗", "AI Chat")}</h1>
        <p className="sub">{pick(lang, "백엔드: ", "Backend: ")}{backend}</p>
        <ChatClient />
      </main>
    </>
  );
}
