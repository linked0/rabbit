// Claude 경로 스모크 테스트 (T1, 2026-10-28). 실제 API 를 부르므로 크레딧이 든다
// (Opus 5.5 기준 한 번에 몇 센트). 서버를 띄우지 않고 lib 를 직접 부른다:
//   AI_PROVIDER=anthropic npx -y tsx --env-file=.env --tsconfig tsconfig.json scripts/smoke-claude.ts
// 확인하는 것: 모델 라벨 · 헬스 프로브 · 한/영 답변 스트림 · 프롬프트 캐시 read · 추정 JSON 스키마.
import { buildAboutMeSystemMessage } from "@/lib/about-me";
import { streamJayChat, probeJayChat } from "@/lib/jay-chat";
import { aiModelLabel, claude, claudeModel } from "@/lib/ai-provider";

async function ask(q: string, history: { role: "user" | "assistant"; content: string }[] = []) {
  const t0 = Date.now();
  const stream = await streamJayChat([buildAboutMeSystemMessage(q), ...history, { role: "user", content: q }]);
  const reader = stream.getReader(); const dec = new TextDecoder(); let out = "";
  for (;;) { const { done, value } = await reader.read(); if (done) break; out += dec.decode(value); }
  console.log(`\n### Q: ${q}  (${Date.now() - t0} ms)\n${out}`);
  return out;
}

(async () => {
  console.log("label:", aiModelLabel(), "| model:", claudeModel());
  console.log("probe:", JSON.stringify(await probeJayChat()));
  const a1 = await ask("이현재는 어떤 프로젝트를 했어?");
  await ask("What is he strongest at?", [{ role: "assistant", content: "earlier answer" }, { role: "user", content: "이현재는 어떤 프로젝트를 했어?" }, { role: "assistant", content: a1 }]);
  // cache check: same system prefix twice, read usage directly
  const sys = buildAboutMeSystemMessage("Verex").content; const cut = sys.indexOf("[Context about");
  for (const i of [1, 2]) {
    const r = await claude().messages.create({ model: claudeModel(), max_tokens: 64, output_config: { effort: "low" },
      system: [{ type: "text", text: sys.slice(0, cut), cache_control: { type: "ephemeral" } }, { type: "text", text: sys.slice(cut) }],
      messages: [{ role: "user", content: "One word: what is Verex?" }] });
    console.log(`cache run ${i}: in=${r.usage.input_tokens} write=${r.usage.cache_creation_input_tokens} read=${r.usage.cache_read_input_tokens} out=${r.usage.output_tokens}`);
  }
  const est = await claude().messages.create({ model: claudeModel(), max_tokens: 2000, output_config: { effort: "low", format: { type: "json_schema",
    schema: { type: "object", properties: { p: { type: "number" }, rationale: { type: "string" } }, required: ["p", "rationale"], additionalProperties: false } } },
    system: "Estimate the probability the question resolves YES. Return the JSON.", messages: [{ role: "user", content: "Question: Will ETH close above $1 on 2026-12-31?\nNews:\n[1] 2026-10-27 test: ETH trades near $3,000." }] });
  console.log("estimate JSON:", est.content.map((b) => (b.type === "text" ? b.text : "")).join(""));
})().catch((e) => { console.error("FAILED:", e?.status, e?.message ?? e); process.exit(1); });
