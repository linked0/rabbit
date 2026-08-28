// Visitor activity notifications — Telegram, mirroring the pattern already built for
// verex's trade/faucet/resolve events. Every message is prefixed 🐰 (this portfolio site);
// verex uses 🔮, so the two projects are distinguishable at a glance in the chat. Fire-and-forget: a Telegram hiccup must never
// affect a real page load or chat request. Reuses the same bot (@ClaudeAgentJayBot,
// same token value as verex/the Claude Code channel) — one bot, multiple use-cases.

function send(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch((e) => console.error("visitor-notify telegram error:", e));
}

// Light per-(page, visitor) debounce so refreshes/soft-navigations within a few minutes
// don't spam Telegram with duplicate notifications for the same visit.
const DEBOUNCE_MS = 5 * 60 * 1000;
const lastSeen = new Map<string, number>();

function debounced(key: string): boolean {
  const now = Date.now();
  const prev = lastSeen.get(key);
  if (prev !== undefined && now - prev < DEBOUNCE_MS) return true;
  lastSeen.set(key, now);
  return false;
}

// 알림을 보내는 시점은 딱 둘이다 — 홈 방문, 그리고 Jay Chat 대화 시작 (jay, 2026-08-05).
// /projects 방문 알림은 제거했다: 페이지마다 알림을 붙이면 신호가 아니라 소음이 되고, 정작
// 알아야 할 두 이벤트가 묻힌다. 새 페이지에 notifyPageView 를 추가하기 전에 이 결정을 먼저 볼 것.
export function notifyPageView(pathname: string, ip: string) {
  const key = `page:${pathname}:${ip}`;
  if (debounced(key)) return;
  send(`🐰 👀 Rabbit — visitor on ${pathname} (${ip})`);
}

export function notifyChatStart(ip: string) {
  const key = `chat:${ip}`;
  if (debounced(key)) return;
  send(`🐰 💬 Rabbit — Jay Chat conversation started (${ip})`);
}

// Someone is genuinely engaged, not just poking at it — worth knowing separately from the
// "a conversation started" ping. No debounce: the route only calls this on the exact
// threshold turn, so it fires once per conversation.
export function notifyChatMilestone(turns: number, ip: string) {
  send(`🐰 🔥 Rabbit — Jay Chat: ${turns} questions in one conversation (${ip})`);
}

// ── LLM 제공자 한도 (jay, 2026-08-28) ─────────────────────────────────
// **왜 이것만 따로 알리나.** 위 세 알림은 "누가 왔다"는 좋은 소식이고, 이건
// **기능이 멈췄다**는 나쁜 소식이다. 크레딧이 떨어지면 Jay Chat(공개)과
// 에이전트 추정이 동시에 죽는데, 그 사실은 지금 서버 로그에만 남는다 — 아무도
// 안 보는 곳이다. 사이트가 조용히 반쯤 죽은 채로 며칠 가는 것이 실제 위험이다.
//
// 소진(quota)과 스로틀(rate)은 **다른 사건**이라 문구를 나눈다: 하나는 돈을
// 넣어야 풀리고, 하나는 기다리면 풀린다. 같은 문장으로 뭉개면 받는 사람이
// 지갑을 열지 기다릴지 정할 수 없다.
const LIMIT_DEBOUNCE_MS = 30 * 60 * 1000;
const lastLimit = new Map<string, number>();

export function notifyAiLimit(args: {
  kind: "quota" | "rate";
  host: string;
  model: string;
  status: number;
  detail: string;
}) {
  // 소진 상태는 몇 시간씩 이어진다. 5분 디바운스로는 틱마다 같은 비명을 지른다.
  const key = `ai:${args.kind}:${args.host}`;
  const now = Date.now();
  const prev = lastLimit.get(key);
  if (prev !== undefined && now - prev < LIMIT_DEBOUNCE_MS) return;
  lastLimit.set(key, now);

  const head =
    args.kind === "quota"
      ? `🐰 🚨 Rabbit — ${args.host} quota exhausted (top up)`
      : `🐰 ⏳ Rabbit — ${args.host} rate limited (will recover)`;
  send(
    `${head}\nmodel ${args.model} · HTTP ${args.status}\n${args.detail.slice(0, 300)}\n` +
      `Jay Chat and the agent tick are both down until this clears.`,
  );
}
