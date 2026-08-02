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
