// Visitor activity notifications — Telegram, mirroring the pattern already built for
// verex's trade/faucet/resolve events. Every message is prefixed 🐰 (this portfolio site);
// verex uses 🔮, so the two projects are distinguishable at a glance in the chat. Fire-and-forget: a Telegram hiccup must never
// affect a real page load or chat request. Reuses the same bot (@ClaudeAgentJayBot,
// same token value as verex/the Claude Code channel) — one bot, multiple use-cases.

// 프라미스를 돌려준다 — 대부분의 호출부는 무시하지만(fire-and-forget), 한도 점검
// 프로브는 기다려야 한다. Cloud Run 은 응답을 보낸 뒤 CPU 를 거둬 가서, 기다리지 않은
// 텔레그램 요청은 끝나지 못할 수 있다 (2026-10-09).
function send(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return Promise.resolve();

  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
    .then(() => undefined)
    .catch((e) => console.error("visitor-notify telegram error:", e));
}

// Per-visitor debounce: the same visitor within an hour is one visit, not several
// (jay, 2026-10-09; was 5 minutes). Applies to home visits and Jay Chat starts alike.
// In-memory, which is exact here: rabbit runs a single Cloud Run instance (--max-instances 1).
const DEBOUNCE_MS = 60 * 60 * 1000;
const lastSeen = new Map<string, number>();

function debounced(key: string): boolean {
  const now = Date.now();
  const prev = lastSeen.get(key);
  if (prev !== undefined && now - prev < DEBOUNCE_MS) return true;
  lastSeen.set(key, now);
  return false;
}

// 알림 정책 (jay, 2026-10-09): **홈 방문 + Jay Chat** 만 알린다. 2026-08-05 에는 이 둘이었고,
// 2026-09-10 에 "홈을 빼고 다른 상단 메뉴 페이지 전부"로 뒤집었다가, 그게 데모를 돌리는
// 우리 자신의 클릭까지 울리는 소음이 되어 다시 이 둘로 돌아왔다. 다른 페이지에 핑을
// 붙이고 싶어지면 이 이력부터 볼 것. (장애 알림 — notifyAiLimit / notifyJayChatDown /
// notifyDevnetDown — 은 방문 알림이 아니라 이 정책 밖이다.)
export function notifyHomeVisit(ip: string) {
  if (debounced(`home:${ip}`)) return;
  send(`🐰 👀 Rabbit — home page visit (${ip})`);
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
}): Promise<void> {
  // 소진 상태는 몇 시간씩 이어진다. 5분 디바운스로는 틱마다 같은 비명을 지른다.
  const key = `ai:${args.kind}:${args.host}`;
  const now = Date.now();
  const prev = lastLimit.get(key);
  if (prev !== undefined && now - prev < LIMIT_DEBOUNCE_MS) return Promise.resolve();
  lastLimit.set(key, now);

  const head =
    args.kind === "quota"
      ? `🐰 🚨 Rabbit — ${args.host} quota exhausted (top up)`
      : `🐰 ⏳ Rabbit — ${args.host} rate limited (will recover)`;
  return send(
    `${head}\nmodel ${args.model} · HTTP ${args.status}\n${args.detail.slice(0, 300)}\n` +
      `Jay Chat and the agent tick are both down until this clears.`,
  );
}

// 한도가 아닌 실패 — 키 오류(401), 제공자 장애(5xx), 네트워크 오류 (jay, 2026-10-09).
// 방문자 경로에선 이걸 알리지 않는다(소음). 매시간 도는 한도 점검 프로브만 부른다 —
// 한 시간에 한 번이라 디바운스 없이도 조용하고, 고쳐질 때까지 매시간 다시 울리는 게 맞다.
export function notifyJayChatDown(args: { host: string; model: string; status: number; detail: string }): Promise<void> {
  const what = args.status === 0 ? "unreachable" : `HTTP ${args.status}`;
  return send(
    `🐰 🛑 Rabbit — Jay Chat health check failed (${what})\n` +
      `${args.host} · model ${args.model}\n${args.detail.slice(0, 300)}\n` +
      `Not a quota issue — check the key (401) or the provider (5xx).`,
  );
}

// Jayverse Devnet 상태 (jay, 2026-10-09). 같은 날 devnet VM 부트 디스크가 가득 차서
// anvil 이 5일 동안 재시작만 반복했는데, 아무도 몰랐다 — /chains 페이지는 "unreachable"
// 을 보여 줬지만 아무도 그 페이지를 보지 않았다. Jay Chat 과 같은 매시간 점검이 부른다.
export function notifyDevnetDown(problem: string, statusUrl: string): Promise<void> {
  return send(`🐰 ⛓️ Rabbit — Jayverse Devnet health check failed\n${problem}\n${statusUrl}`);
}
