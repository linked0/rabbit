import { pick, type Lang } from "@/lib/i18n";

// "Doing it for real" (jay, 2026-10-29): how the simulation above maps onto real Discord and X
// accounts. Explanation only: nothing on this page talks to Discord or X. T4 in docs/tasks/current-plan.md
// plans only the read-only part of this (`/ask`, `/status`); `/pay` is not planned. Step numbers match
// the ①–⑧ in the chat answer this came from.

type Two = { ko: string; en: string };
type Step = { n: string; route: Two; what: Two };

const STEPS: Step[] = [
  {
    n: "①",
    route: { ko: "Discord → 서버", en: "Discord → server" },
    what: {
      ko: "내가 `/pay alice 10` 을 입력합니다. Discord 가 서명한 요청을 서버가 `DISCORD_PUBLIC_KEY` 로 검증합니다.",
      en: "You type `/pay alice 10`. The server verifies Discord's signature on the request with `DISCORD_PUBLIC_KEY`.",
    },
  },
  {
    n: "②",
    route: { ko: "서버", en: "server" },
    what: {
      ko: "보낸 사람의 사용자 id 가 jay 인지 확인합니다(허용 목록).",
      en: "Checks that the sender's user id is jay's (allowlist).",
    },
  },
  {
    n: "③",
    route: { ko: "서버 → Discord", en: "server → Discord" },
    what: {
      ko: '3초 안에 "처리 중…" 으로 먼저 답합니다(지연 응답).',
      en: 'Answers "working…" within 3 seconds (a deferred reply).',
    },
  },
  {
    n: "④",
    route: { ko: "서버", en: "server" },
    what: {
      ko: 'Cloud Tasks 작업에서 에이전트가 송금을 계획합니다. 받는 사람 "alice" 는 내 명령에서 가져오고, 메모리나 대화 기록에서는 절대 가져오지 않습니다.',
      en: 'A Cloud Tasks job lets the agent plan the transfer. The recipient "alice" comes from your command, never from memory or chat history.',
    },
  },
  {
    n: "⑤",
    route: { ko: "서버 → Discord", en: "server → Discord" },
    what: {
      ko: "[확인] [취소] 버튼이 달린 후속 메시지를 보냅니다.",
      en: "Sends a follow-up message with [Confirm] [Cancel] buttons.",
    },
  },
  {
    n: "⑥",
    route: { ko: "Discord → 서버", en: "Discord → server" },
    what: {
      ko: "확인을 누르면 서명을 다시 검증한 뒤에야 10 jUSD 를 보냅니다(테스트넷).",
      en: "When you click Confirm, the signature is verified again, and only then are 10 jUSD sent (testnet).",
    },
  },
  {
    n: "⑦",
    route: { ko: "서버 → Discord", en: "server → Discord" },
    what: {
      ko: '인터랙션 토큰으로 "완료, tx 0x…" 를 알립니다.',
      en: 'Reports "done, tx 0x…" through the interaction token.',
    },
  },
  {
    n: "⑧",
    route: { ko: "서버 → X", en: "server → X" },
    what: {
      ko: '@kindofblue91 로 영수증을 게시합니다: "alice 에게 10 jUSD · tx 0x…"',
      en: 'Posts the receipt as @kindofblue91: "Paid alice 10 jUSD · tx 0x…"',
    },
  },
];

const KEYS: { key: string; at: Two; secret: boolean }[] = [
  {
    key: "DISCORD_PUBLIC_KEY",
    at: {
      ko: "①, ⑥: 요청이 정말 Discord 에서 왔는지 증명",
      en: "①, ⑥: proves a request really came from Discord",
    },
    secret: false,
  },
  {
    key: "DISCORD_APPLICATION_ID",
    at: {
      ko: "`/pay` 등록, ⑤·⑦ 후속 메시지",
      en: "registering `/pay`, the follow-ups at ⑤ and ⑦",
    },
    secret: false,
  },
  {
    key: "DISCORD_BOT_TOKEN",
    at: {
      ko: "명령 등록, 또는 인터랙션 없이 채널에 글쓰기",
      en: "registering commands, or posting in a channel without an interaction",
    },
    secret: true,
  },
  {
    key: "X OAuth 2.0 user token (tweet.write)",
    at: { ko: "⑧, @kindofblue91 로 게시", en: "⑧, posting as @kindofblue91" },
    secret: true,
  },
];

const RULES: { title: Two; body: Two }[] = [
  {
    title: {
      ko: "권한은 Discord 가 서명한, 내 id 에서 온 명령에만 있다",
      en: "Only Discord-signed commands from your user id carry authority",
    },
    body: {
      ko: '다른 Discord 메시지나 X 멘션은 전부 데이터일 뿐입니다. 에이전트가 읽을 수는 있어도, 그것으로 송금이 일어날 수는 없습니다. 위 시뮬레이션의 ① 오염 메시지가 바로 이 "다른 메시지"입니다.',
      en: "Every other Discord message or X mention is just data. The agent can read it, but it can never trigger a payment. Step ① in the simulation above, the poisoning post, is exactly such a message.",
    },
  },
  {
    title: {
      ko: "받는 사람은 내가 보낸 명령에서 온다",
      en: "The recipient comes from the command you sent",
    },
    body: {
      ko: '메모리에서 가져오지 않습니다. 서명은 내가 아니라 Discord 가 하고(①), 보낸 사람이 나인지는 id 로 따로 확인합니다(②). 위 시뮬레이션에서 "방어"를 켰을 때 검증자들이 하는 일이 이것입니다.',
      en: "Not from memory. You sign nothing yourself: Discord signs the request (①), and the user id check (②) is what proves it is you. This is what the validators do in the simulation above when the defense is on.",
    },
  },
  {
    title: {
      ko: "돈은 확인 버튼 뒤에만, X 는 쓰기 전용",
      en: "Money moves only after Confirm; X stays write-only",
    },
    body: {
      ko: "⑥ 전에는 아무것도 움직이지 않습니다. 에이전트가 X 멘션을 명령으로 읽으면, 전 세계 누구나 트윗으로 명령을 내릴 수 있게 됩니다.",
      en: "Nothing moves before ⑥. If the agent read X mentions as commands, anyone in the world could tweet it orders.",
    },
  },
];

// Backticks in the copy mark a command; render them as <code>.
function Rich({ text }: { text: string }) {
  return (
    <>
      {text
        .split("`")
        .map((part, i) =>
          i % 2 ? <code key={i}>{part}</code> : <span key={i}>{part}</span>,
        )}
    </>
  );
}

const cell = { textAlign: "left" as const, verticalAlign: "top" as const };

export default function ChannelsScenario({ lang }: { lang: Lang }) {
  const t = (s: Two) => pick(lang, s.ko, s.en);
  return (
    <section style={{ maxWidth: 720 }}>
      <h2 style={{ marginTop: 32 }}>
        {pick(
          lang,
          "실제 계정으로 하면: Discord 로 명령, X 로 영수증",
          "With real accounts: orders in on Discord, receipts out on X",
        )}
      </h2>
      <p className="sub">
        {pick(
          lang,
          '시나리오: Discord 에서 "Alice 에게 10 jUSD 보내 줘", 영수증은 X 에. 계정마다 맡은 일이 하나씩 있습니다. Discord 는 지휘 채널입니다. 거기서 명령을 내리고, 시스템은 그 명령이 정말 내게서 왔다는 걸 증명할 수 있습니다. X 는 공개 게시판입니다. 에이전트는 거기에 올리기만 하고, 절대 명령을 받지 않습니다.',
          'Scenario: "Pay Alice 10 jUSD" from Discord, with the receipt posted on X. Each account has one job. Discord is the control channel: you give orders there, and the system can prove they came from you. X is the public notice board: the agent only posts there and never takes orders from it.',
        )}
      </p>

      <div className="panel" style={{ overflowX: "auto", padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th style={cell}>#</th>
              <th style={cell}>{pick(lang, "어디서 어디로", "Between")}</th>
              <th style={cell}>{pick(lang, "무슨 일이", "What happens")}</th>
            </tr>
          </thead>
          <tbody>
            {STEPS.map((s) => (
              <tr key={s.n}>
                <td style={cell}>{s.n}</td>
                <td style={cell}>{t(s.route)}</td>
                <td style={cell}>
                  <Rich text={t(s.what)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>{pick(lang, "각 키가 하는 일", "What each key does")}</h3>
      <div className="panel" style={{ overflowX: "auto", padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th style={cell}>{pick(lang, "키", "Key")}</th>
              <th style={cell}>{pick(lang, "쓰이는 곳", "Used at")}</th>
              <th style={cell}>{pick(lang, "비밀?", "Secret?")}</th>
            </tr>
          </thead>
          <tbody>
            {KEYS.map((k) => (
              <tr key={k.key}>
                {/* Long key names may break anywhere, or the Secret? column is pushed off a phone screen. */}
                <td style={cell}>
                  <code style={{ overflowWrap: "anywhere" }}>{k.key}</code>
                </td>
                <td style={cell}>
                  <Rich text={t(k.at)} />
                </td>
                <td style={{ ...cell, whiteSpace: "nowrap" }}>
                  {k.secret ? (
                    <strong>{pick(lang, "예", "Yes")}</strong>
                  ) : (
                    pick(lang, "아니오", "No")
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>
        {pick(
          lang,
          "안전하게 만드는 규칙 세 가지",
          "Three rules that make it safe",
        )}
      </h3>
      <div style={{ display: "grid", gap: 12 }}>
        {RULES.map((r, i) => (
          <div className="panel" key={i} style={{ marginBottom: 0 }}>
            <strong>
              {i + 1}. {t(r.title)}
            </strong>
            <p
              className="sub"
              style={{ marginTop: 4, marginBottom: 0, fontSize: 13 }}
            >
              {t(r.body)}
            </p>
          </div>
        ))}
      </div>

      <h3>{pick(lang, "더 단순한 변형", "Simpler variants")}</h3>
      <ul className="sub" style={{ fontSize: 14 }}>
        <li>
          <Rich
            text={pick(
              lang,
              "Discord 만: ①–⑦ 단계. 플랜의 T4 는 이 중 읽기 전용 부분(`/ask`, `/status`)만 만듭니다. `/pay` 는 계획에 없습니다.",
              "Discord only: steps ①–⑦. T4 in the plan builds only the read-only part of this (`/ask`, `/status`); `/pay` is not planned.",
            )}
          />
        </li>
        <li>
          {pick(
            lang,
            'X 만: 크론 작업으로 매일 "에이전트 상태" 트윗. 들어오는 경로가 없으니 주입할 틈도 없습니다.',
            'X only: a daily "agent status" tweet from a cron job. There is no inbound path, so nothing can be injected.',
          )}
        </li>
      </ul>
      <p className="sub" style={{ fontSize: 13 }}>
        {pick(
          lang,
          "이 페이지는 Discord 나 X 에 연결되지 않습니다. 위의 흐름은 설명이고, 실제 봇은 아직 없습니다. T4 는 읽기 전용 봇을 계획합니다. X 게시는 X API 요금을 먼저 확인해야 합니다.",
          "This page does not connect to Discord or X. The flow above is an explanation; no real bot exists yet, and T4 plans a read-only one. Posting to X waits on a check of X's API pricing.",
        )}
      </p>
    </section>
  );
}
