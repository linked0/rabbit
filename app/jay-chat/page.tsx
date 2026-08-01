import Nav from "../Nav";
import JayChatClient from "./JayChatClient";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Public "Jay Chat" page — no login required (docs/features/ai-chat.md).
export const dynamic = "force-dynamic";

export default function JayChatPage() {
  const lang = getLang();

  return (
    <>
      <Nav />
      <main>
        <h1>{pick(lang, "제이 챗", "Jay Chat")}</h1>
        <JayChatClient />
      </main>
    </>
  );
}
