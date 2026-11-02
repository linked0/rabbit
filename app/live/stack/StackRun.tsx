"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

// 한 번의 실행 (jay, 2026-11-02 손그림: "show these in one page showing how they coordinate …
// shown with game like interface"). 여섯 개의 라이브 데모 — 7702 인스펙터 · AA 세션 키 ·
// 정산 에이전트 콘솔 · 자율 결제 에이전트 · AP2 · 토스 — 는 각자 한 조각만 보여 준다.
// 이 판은 그 조각들이 **한 번의 지출**에서 어느 순서로 맞물리는지를 보여 주는 것이 전부다.
//
// 그려지는 모양은 jay 의 손그림 그대로다: User —EIP-7702→ MetaMask, MetaMask → Delegator
// 컨트랙트, Delegator ↔ Agent, Agent → Service Provider, Agent ↔ AP2.
//
// **판 위의 칸이 곧 버튼이다** (jay, 2026-11-02 두 번째 요청): 차례가 된 칸이 깜빡이고, 누르면
// 팝업이 뜨고, 팝업에서 답하면 다음 칸이 깜빡인다. 컨트랙트가 끼는 동작은 컨트랙트 칸이
// 깜빡이면서 화면의 상태 줄이 바뀐다 — 위임 없음 → caveat 저장 → 사용액 → 거절.
//
// **각본이다.** 체인도, 서명도, 모델 호출도 없다 — 실제로 도는 것은 각 줄이 링크하는
// 데모 페이지 쪽이고, 여기서 틀리면 안 되는 것은 숫자가 아니라 **순서와 누가 무엇을 막는가**다.

type Phase = "user" | "wallet" | "agent" | "provider" | "ap2" | "done";
type NodeId = "user" | "wallet" | "delegator" | "agent" | "provider" | "ap2";
type Rail = "stripe" | "toss";
type Tone = "info" | "good" | "bad" | "chain";
type Node = { x: number; y: number };

const CAP = 5; // 위임 한도 (jUSD)
const PRICE = 2.4; // 에이전트가 사는 데이터 피드 한 건
const OVER = 7; // 한도를 넘는 시도

// jay 의 손그림 배치 그대로. 좌표를 바꾸면 그림의 뜻이 바뀌므로 한 곳에 모아 둔다.
const N: Record<NodeId, Node> = {
  user: { x: 430, y: 48 },
  wallet: { x: 430, y: 168 },
  delegator: { x: 142, y: 304 },
  agent: { x: 430, y: 304 },
  provider: { x: 726, y: 304 },
  ap2: { x: 430, y: 446 },
};

type Packet = { id: number; from: Node; to: Node; color: string };
type Line = { tone: Tone; text: string; chip?: string; href?: string; hrefLabel?: string };
type Flash = { node: NodeId; tone: "good" | "bad"; key: number };

export default function StackRun({ lang }: { lang: Lang }) {
  const t = (ko: string, en: string) => (lang === "ko" ? ko : en);
  const [phase, setPhase] = useState<Phase>("user");
  const [popup, setPopup] = useState<NodeId | null>(null);
  const [rail, setRail] = useState<Rail | null>(null);
  const [spent, setSpent] = useState(0);
  const [refused, setRefused] = useState(0);
  const [lastRefused, setLastRefused] = useState(false);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [log, setLog] = useState<Line[]>([]);
  const [flash, setFlash] = useState<Flash | null>(null);

  let seq = 0;
  const send = (list: Array<{ from: Node; to: Node; color: string }>) =>
    setPackets(list.map((p) => ({ ...p, id: Date.now() + seq++ })));
  // **오래된 것이 위로.** 가짜 편지 데모(MemoryPoisonSim)는 최신 줄을 맨 위에 쌓지만,
  // 이 페이지가 답하려는 질문이 "무슨 순서로 맞물리나"라서 역순이면 읽는 방향이 거꾸로가 된다.
  const note = (l: Line) => setLog((prev) => [...prev, l]);
  const blink = (node: NodeId, tone: "good" | "bad") => setFlash({ node, tone, key: Date.now() });

  // Esc 로 팝업 닫기 — 지갑 팝업을 흉내 내는 만큼 닫는 길도 지갑처럼.
  useEffect(() => {
    if (!popup) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPopup(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popup]);

  const remaining = CAP - spent;
  const ready: NodeId | null = phase === "done" ? null : phase; // 차례가 된 칸 = 깜빡이는 칸
  const railName = rail === "toss" ? t("토스페이먼츠", "Toss Payments") : "Stripe";

  // ── 동작들: 팝업의 버튼이 부른다 ───────────────────────────────────────
  function userGive() {
    setPopup(null);
    setPhase("wallet");
    send([{ from: N.user, to: N.wallet, color: "var(--accent)" }]);
    note({
      tone: "info",
      text: t(
        `주인이 결정합니다: "에이전트에게 최대 ${CAP} jUSD, 1시간짜리 위임을 주겠다." 아직 아무것도 서명되지 않았습니다 — 지갑이 요청을 받아서 물어볼 차례입니다.`,
        `The owner decides: "give the agent a mandate of up to ${CAP} jUSD for 1 hour." Nothing is signed yet — the wallet receives the request and it is its turn to ask.`,
      ),
    });
  }

  function walletAgree() {
    setPopup(null);
    setPhase("agent");
    send([{ from: N.wallet, to: N.delegator, color: "var(--accent)" }]);
    blink("delegator", "good");
    note({
      tone: "chain",
      chip: "EIP-7702",
      href: "/live/7702",
      hrefLabel: t("7702 인스펙터", "7702 inspector"),
      text: t(
        "지갑이 권한서명 하나를 먼저 붙입니다. 계정의 코드 자리에 0xef0100‖구현주소 가 쓰이고 — 주소도 키도 그대로인데 이제 계정이 코드를 실행합니다. 화면에 흔적이 남지 않는 단계라, 따로 들여다볼 페이지를 만들어 둔 것이 7702 인스펙터입니다.",
        "The wallet first attaches one authorization. 0xef0100‖implementation lands in the account's code slot — same address, same key, but the account now runs code. Nothing on screen shows it happened, which is exactly why the 7702 inspector exists.",
      ),
    });
    note({
      tone: "chain",
      chip: "ERC-7715 · EIP-712",
      href: "/live/agent/console",
      hrefLabel: t("정산 에이전트 콘솔", "Settlement Agent console"),
      text: t(
        `같은 팝업에서 권한도 부여됩니다: "최대 ${CAP} jUSD, 1시간". 그 EIP-712 서명이 Delegator 컨트랙트에 위임으로 저장되고, 한도 자체는 caveat enforcer 라는 별개의 컨트랙트가 들고 있습니다. 이 뒤로 팝업은 없습니다 — 권한이 곧 인가이기 때문입니다.`,
        `The same popup grants the permission: "up to ${CAP} jUSD, 1 hour". That EIP-712 signature is stored in the delegator contract as a delegation, and the cap itself lives in a separate caveat-enforcer contract. No popup after this — the permission *is* the authorization.`,
      ),
    });
  }

  function walletReject() {
    setPopup(null);
    note({
      tone: "bad",
      text: t(
        "거절했습니다. 아무것도 체인에 쓰이지 않았고 에이전트는 계속 잠들어 있습니다 — 위임이 없으면 에이전트는 한 푼도 움직일 수 없습니다. MetaMask 를 다시 눌러 보세요.",
        "Rejected. Nothing was written to the chain and the agent stays asleep — without a delegation the agent cannot move a cent. Press MetaMask again.",
      ),
    });
  }

  function agentSpend(amount: number) {
    setPopup(null);
    if (amount > remaining) {
      setRefused((n) => n + 1);
      setLastRefused(true);
      send([{ from: N.agent, to: N.delegator, color: "var(--red)" }]);
      blink("delegator", "bad");
      note({
        tone: "bad",
        chip: "ERC-7710",
        text: t(
          `에이전트가 ${amount} jUSD 를 시도했습니다. caveat enforcer 가 트랜잭션을 되돌립니다 — 남은 한도는 ${remaining.toFixed(2)} jUSD 입니다. 에이전트의 서명은 멀쩡하고 의도도 진짜입니다. 막은 것은 사람의 승인도, 에이전트의 자제력도 아니고 컨트랙트입니다. 한도와 약속의 차이가 여기에 있습니다.`,
          `The agent tried ${amount} jUSD. The caveat enforcer reverts the transaction — ${remaining.toFixed(2)} jUSD left. The agent's signature is valid and its intent is genuine. What stopped it was neither a human approval nor the agent's restraint, but a contract. That is the whole difference between a cap and a promise.`,
        ),
      });
      return;
    }
    setLastRefused(false);
    setSpent((s) => s + amount);
    setPhase("provider");
    send([
      { from: N.agent, to: N.delegator, color: "var(--accent)" },
      { from: N.delegator, to: N.agent, color: "var(--green)" },
    ]);
    blink("delegator", "good");
    note({
      tone: "info",
      href: "/live/agent",
      hrefLabel: t("자율 결제 에이전트", "Autonomous payment agent"),
      text: t(
        "타이머가 에이전트를 깨웠고, 체인은 아직 한 번도 쓰이지 않은 채로 — 뉴스를 읽고, 모델에게 확률을 묻고, 호가와 비교해 — 살지 말지를 스스로 정했습니다. 이 한 단계가 '에이전트'와 '능력 모음'을 가릅니다. 나머지는 사람이 버튼을 눌러도 똑같이 돕니다.",
        "A timer woke the agent and, with the chain still untouched, it read the news, asked the model for a probability, compared that with the order book and decided for itself. This single step is what separates an agent from a pile of capabilities; the rest runs the same whether a human or a loop pressed the button.",
      ),
    });
    note({
      tone: "chain",
      chip: "ERC-7710 · ERC-4337",
      href: "/live/aa",
      hrefLabel: t("AA — 위임형 계정 & 세션 키", "AA — delegatable accounts"),
      text: t(
        `에이전트가 Delegator 컨트랙트에 redeemDelegations 를 부르고, caveat enforcer 가 한도를 확인한 뒤 통과시킵니다 (${amount} jUSD ≤ ${CAP}). 호출은 ERC-4337 UserOperation 으로 나가고 가스는 paymaster 가 대신 냅니다 — 에이전트는 ETH 를 한 푼도 들고 있지 않습니다. 여기서 세 표준의 역할이 갈립니다: **7702 가 능력을 주고, 7715 가 권한을 요청하고, 7710 이 그것을 집행합니다.**`,
        `The agent calls redeemDelegations on the delegator contract; the caveat enforcer checks the cap and lets it through (${amount} ≤ ${CAP} jUSD). The call goes out as an ERC-4337 UserOperation and a paymaster covers the gas — the agent holds no ETH at all. This is where the three standards separate: **7702 grants the capability, 7715 requests the permission, 7710 enforces it.**`,
      ),
    });
  }

  function providerPay() {
    setPopup(null);
    setPhase("ap2");
    send([{ from: N.agent, to: N.provider, color: "var(--accent)" }]);
    blink("provider", "good");
    note({
      tone: "info",
      chip: "x402 · AP2 · ERC-8004",
      href: "/live/ap2",
      hrefLabel: "AP2",
      text: t(
        "에이전트가 서비스에 값을 치릅니다. 기계 대 기계라면 HTTP 402(x402)로 요금표가 그 자리에서 돌아오고, 사람이 끼는 결제라면 AP2 의 Cart Mandate 가 '무엇을 얼마에' 를 서명된 문서로 고정합니다. 상대가 정말 그 에이전트인지는 ERC-8004 이 맡으려는 자리인데, 아직 이곳에서는 설명만 있고 돌아가지는 않습니다.",
        "The agent pays the service. Machine-to-machine, HTTP 402 (x402) returns the price inline; with a human in the loop, AP2's Cart Mandate pins \"what, at what price\" into a signed document. Whether the counterparty really is that agent is the slot ERC-8004 wants to fill — here it is still an explainer, not something that runs.",
      ),
    });
  }

  function ap2Settle(r: Rail) {
    setPopup(null);
    setRail(r);
    setPhase("done");
    send([
      { from: N.agent, to: N.ap2, color: "var(--accent)" },
      { from: N.ap2, to: N.agent, color: "var(--green)" },
    ]);
    blink("ap2", "good");
    const name = r === "toss" ? t("토스페이먼츠", "Toss Payments") : "Stripe";
    note({
      tone: "good",
      chip: "AP2 Payment Mandate",
      href: r === "stripe" ? "/live/ap2" : "/live/toss",
      hrefLabel: r === "stripe" ? t("AP2 — Stripe 정산", "AP2 — Stripe settlement") : "Toss Payments",
      text: t(
        `AP2 의 Payment Mandate 가 법정화폐 레일로 넘어갑니다 — ${name} 테스트 결제. 영수증이 돌아오고 저널에 한 줄이 남습니다. 체인이 아는 것은 "얼마가 움직였나"까지이고, "왜 샀나"는 저널에만 있습니다 — 그래서 콘솔에 저널이 따로 있습니다.`,
        `AP2's Payment Mandate crosses to the fiat rail — a ${name} test payment. A receipt comes back and one line lands in the journal. The chain knows how much moved; why it was bought exists only in the journal, which is why the console keeps one.`,
      ),
    });
  }

  function reset() {
    setPhase("user");
    setPopup(null);
    setRail(null);
    setSpent(0);
    setRefused(0);
    setLastRefused(false);
    setPackets([]);
    setLog([]);
    setFlash(null);
  }

  // ── 화면의 상태 줄: 컨트랙트가 끼는 동작마다 여기 글자가 바뀐다 ──────────
  const granted = phase !== "user" && phase !== "wallet";
  const status: Record<NodeId, string> = {
    user: phase === "user" ? t("차례 — 눌러 보세요", "your move — press") : t("주인 · EOA", "owner · EOA"),
    wallet:
      phase === "wallet"
        ? t("요청 대기 중 — 눌러 보세요", "request pending — press")
        : granted
          ? t("코드 붙음 · 주소 그대로", "code attached · same address")
          : t("보통 EOA", "plain EOA"),
    delegator: !granted
      ? t("위임 없음", "no delegation")
      : lastRefused
        ? t(`거절 · revert (${OVER} > ${remaining.toFixed(1)})`, `refused · revert (${OVER} > ${remaining.toFixed(1)})`)
        : spent > 0
          ? t(`사용 ${spent.toFixed(2)} / ${CAP} jUSD`, `used ${spent.toFixed(2)} / ${CAP} jUSD`)
          : t(`caveat 저장: ≤ ${CAP} jUSD · 1h`, `caveat stored: ≤ ${CAP} jUSD · 1h`),
    agent:
      phase === "agent"
        ? t("깨어남 — 눌러 보세요", "awake — press")
        : granted
          ? t("지출함", "spent")
          : t("잠듦", "asleep"),
    provider:
      phase === "provider"
        ? t("HTTP 402 — 눌러 보세요", "HTTP 402 — press")
        : phase === "ap2" || phase === "done"
          ? t(`결제됨 · 데이터 전달`, `paid · data delivered`)
          : "HTTP 402",
    ap2:
      phase === "ap2"
        ? t("정산 대기 — 눌러 보세요", "awaiting settlement — press")
        : phase === "done"
          ? t("영수증 · 저널 한 줄", "receipt · one journal line")
          : t("법정화폐 레일", "fiat rail"),
  };

  // 진행 표시줄 — 버튼이 아니라 지나온 칸의 기록이다. 누르는 곳은 판 위다.
  const steps = [
    { n: "①", label: "EIP-7702", done: granted },
    { n: "②", label: "ERC-7715", done: granted },
    { n: "③", label: t("깨어남", "wake"), done: spent > 0 },
    { n: "④", label: "ERC-7710", done: spent > 0 },
    { n: "⑤", label: "x402", done: phase === "ap2" || phase === "done" },
    { n: "⑥", label: "AP2", done: phase === "done" },
  ];

  const lit: Record<NodeId, boolean> = {
    user: phase !== "user",
    wallet: phase !== "user",
    delegator: granted,
    agent: granted,
    provider: phase === "ap2" || phase === "done",
    ap2: phase === "done",
  };
  const boxProps = (id: NodeId) => ({
    n: N[id],
    live: lit[id],
    ready: ready === id,
    flash: flash?.node === id ? flash : null,
    onClick: ready === id ? () => setPopup(id) : undefined,
  });

  return (
    <div className="panel" style={{ marginTop: 16, maxWidth: 900 }}>
      {/* ── 진행 + 초기화 ───────────────────────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {steps.map((s) => (
          <span key={s.n} className={`stack-step${s.done ? " done" : ""}`}>
            {s.n} {s.label}
          </span>
        ))}
        <button className="ghost" onClick={reset} style={{ marginLeft: "auto" }}>
          {t("초기화", "Reset")}
        </button>
      </div>
      <p className="sub" style={{ fontSize: 13, marginTop: 8 }}>
        {phase === "done"
          ? t(
              `끝 — ${PRICE} jUSD 가 ${railName} 로 정산됐고 ${refused ? `${refused}번의 초과 시도가 컨트랙트에서 막혔습니다. 초기화하고 이번엔 거절 없이 돌려 보세요.` : "한 번도 거절되지 않았습니다. 초기화하고 이번엔 한도를 넘겨 보세요."}`,
              `Done — ${PRICE} jUSD settled via ${railName}, ${refused ? `${refused} overspend attempt${refused > 1 ? "s" : ""} stopped by the contract. Reset and run it clean this time.` : "nothing refused. Reset and try breaking the cap this time."}`,
            )
          : t(
              "깜빡이는 칸을 누르세요. 팝업에서 답하면 다음 칸이 깜빡입니다. 컨트랙트가 끼는 동작은 컨트랙트 칸이 깜빡이면서 상태 줄이 바뀝니다.",
              "Press the blinking box. Answer its popup and the next box blinks. Whenever a contract is involved, the contract box blinks and its status line changes.",
            )}
      </p>

      {/* ── HUD: 위임 한도가 이 게임의 체력 바다 ───────────────── */}
      <div className="stack-hud">
        <div>
          <div className="stack-hud-k">{t("위임 한도", "Mandate")}</div>
          <div className="stack-hud-v">
            {spent.toFixed(2)} / {CAP.toFixed(2)} jUSD
          </div>
          <div className="stack-bar" aria-hidden>
            <span style={{ width: `${(spent / CAP) * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="stack-hud-k">{t("차례", "Turn")}</div>
          <div className="stack-hud-v">
            {phase === "done"
              ? t("완료", "done")
              : { user: t("사용자", "User"), wallet: "MetaMask", agent: t("에이전트", "Agent"), provider: t("서비스 제공자", "Provider"), ap2: "AP2" }[phase]}
          </div>
        </div>
        <div>
          <div className="stack-hud-k">{t("거절된 시도", "Refused")}</div>
          <div className="stack-hud-v" style={refused ? { color: "var(--red)" } : undefined}>
            {refused}
          </div>
        </div>
        <div>
          <div className="stack-hud-k">{t("에이전트의 ETH", "Agent's ETH")}</div>
          <div className="stack-hud-v">
            0 <span className="sub" style={{ fontSize: 12, fontWeight: 400 }}>({t("가스는 paymaster", "paymaster pays gas")})</span>
          </div>
        </div>
      </div>

      {/* ── 판 ───────────────────────────────────────────────── */}
      {/* 폰에서 줄이면 글자가 5px 이 되므로, 읽을 수 있는 크기를 지키고 가로 스크롤을 준다. */}
      <div style={{ overflowX: "auto", marginTop: 14 }}>
        <svg
          viewBox="0 14 860 470"
          style={{ width: "100%", minWidth: 640, height: "auto", display: "block" }}
          role="img"
          aria-label={t(
            "사용자, MetaMask, Delegator 컨트랙트, 에이전트, 서비스 제공자, AP2 사이의 흐름",
            "Flow between the user, MetaMask, the delegator contract, the agent, the service provider and AP2",
          )}
        >
          <Wire a={N.user} b={N.wallet} live={phase !== "user"} label="EIP-7702" />
          <Wire a={N.wallet} b={N.delegator} live={granted} label="ERC-7715" />
          <Wire a={N.delegator} b={N.agent} live={spent > 0} label="ERC-7710" both />
          <Wire a={N.agent} b={N.provider} live={phase === "ap2" || phase === "done"} label="x402" />
          <Wire a={N.agent} b={N.ap2} live={phase === "done"} label="AP2" both at={0.66} />

          <Box {...boxProps("user")} w={150} title={t("사용자", "User")} sub={status.user} />
          <Box {...boxProps("wallet")} w={180} title="MetaMask" sub={status.wallet} />
          <Box {...boxProps("delegator")} w={196} title={t("Delegator 컨트랙트", "Delegator contract")} sub={status.delegator} contract />
          <Box {...boxProps("agent")} w={170} title={t("에이전트", "Agent")} sub={status.agent} />
          <Box {...boxProps("provider")} w={180} title={t("서비스 제공자", "Service provider")} sub={status.provider} />
          <Box {...boxProps("ap2")} w={210} title={rail ? `AP2 — ${railName}` : "AP2"} sub={status.ap2} />

          {/* ERC-4337 은 간선이 아니라 에이전트가 트랜잭션을 내보내는 방식이라, 노드에 붙인 칩으로 둔다. */}
          <Chip x={N.agent.x} y={N.agent.y + 44} text="ERC-4337 · UserOp · paymaster" live={spent > 0} />
          {/* ERC-8004 은 이 판에서 유일하게 **안 도는** 조각이다 — 자리를 비워 두는 대신 흐릿하게 그려 둔다. */}
          <Chip x={N.provider.x} y={N.provider.y + 44} text={t("ERC-8004 · 에이전트 신원 (설명만)", "ERC-8004 · agent identity (explainer)")} live={false} />

          {/* 끝난 패킷은 투명한 채로 도착 칸 위에 남는다 — 포인터를 꺼 두지 않으면 그 칸의 클릭을 가로챈다 (2026-11-02 발견). */}
          {packets.map((p) => (
            <circle key={p.id} r={7} fill={p.color} style={{ pointerEvents: "none" }}>
              <animate attributeName="cx" from={p.from.x} to={p.to.x} dur="0.9s" fill="freeze" />
              <animate attributeName="cy" from={p.from.y} to={p.to.y} dur="0.9s" fill="freeze" />
              <animate attributeName="opacity" values="1;1;0" dur="1.2s" fill="freeze" />
            </circle>
          ))}
        </svg>
      </div>

      {/* ── 저널 ─────────────────────────────────────────────── */}
      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
        {log.length === 0 && (
          <p className="sub" style={{ fontSize: 13 }}>
            {t(
              "각 줄은 그 단계를 실제로 돌리는 데모 페이지로 이어집니다 — 이 판은 각본이고, 돌아가는 것은 그쪽입니다.",
              "Every line links to the demo that actually runs that step — this board is scripted; those pages are not.",
            )}
          </p>
        )}
        {log.map((l, i) => (
          <div
            key={i}
            style={{
              fontSize: 13,
              paddingLeft: 10,
              borderLeft: `3px solid ${
                l.tone === "bad" ? "var(--red)" : l.tone === "good" ? "var(--green)" : l.tone === "chain" ? "var(--accent)" : "var(--border)"
              }`,
            }}
          >
            {l.chip && <span className="stack-chip">{l.chip}</span>}
            <span dangerouslySetInnerHTML={{ __html: bold(l.text) }} />
            {l.href && (
              <>
                {" "}
                <Link href={`${l.href}?from=live`} className="stack-link">
                  {l.hrefLabel} →
                </Link>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── 팝업 ─────────────────────────────────────────────── */}
      {popup && (
        <div className="stack-backdrop" onClick={() => setPopup(null)}>
          <div className={`stack-modal${popup === "wallet" ? " wallet" : ""}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            {popup === "user" && (
              <>
                <div className="stack-modal-h">{t("사용자 — 주인", "User — owner")}</div>
                <p>
                  {t(
                    `뉴스를 보고 데이터를 사는 에이전트를 돌리고 싶습니다. 매번 서명하고 싶지는 않고, 그렇다고 지갑을 통째로 맡길 수도 없습니다. 에이전트에게 "최대 ${CAP} jUSD, 1시간" 위임을 줍니다.`,
                    `You want an agent that reads news and buys data. You do not want to sign every time, and you cannot hand it the whole wallet. You give it a mandate: "up to ${CAP} jUSD, 1 hour".`,
                  )}
                </p>
                <div className="stack-modal-actions">
                  <button onClick={userGive}>{t("위임 주기", "Give mandate")}</button>
                  <button className="ghost" onClick={() => setPopup(null)}>{t("닫기", "Close")}</button>
                </div>
              </>
            )}
            {popup === "wallet" && (
              <>
                <div className="stack-modal-h">
                  <span className="stack-fox" aria-hidden>🦊</span> MetaMask
                </div>
                <div className="stack-req">
                  <div className="stack-req-site">jaylabs.xyz {t("가 요청합니다", "requests")}</div>
                  <div className="stack-req-row">
                    <span className="stack-chip">EIP-7702</span>
                    {t("이 계정에 코드를 붙입니다 (주소·키는 그대로)", "Attach code to this account (address and key unchanged)")}
                  </div>
                  <div className="stack-req-row">
                    <span className="stack-chip">ERC-7715</span>
                    {t(`권한 부여: 최대 ${CAP} jUSD · 1시간 · 대상: 에이전트`, `Grant permission: up to ${CAP} jUSD · 1 hour · to: the agent`)}
                  </div>
                  <div className="stack-req-row sub">
                    {t("서명 1회 · 이후 팝업 없음 · 한도는 caveat enforcer 컨트랙트가 집행", "One signature · no popups after · the cap is enforced by the caveat-enforcer contract")}
                  </div>
                </div>
                <div className="stack-modal-actions">
                  <button onClick={walletAgree}>{t("동의", "Confirm")}</button>
                  <button className="ghost" onClick={walletReject}>{t("거절", "Reject")}</button>
                </div>
              </>
            )}
            {popup === "agent" && (
              <>
                <div className="stack-modal-h">{t("에이전트 — 틱", "Agent — tick")}</div>
                <p>
                  {t(
                    `타이머가 울렸습니다. 뉴스 3건 → 모델 확률 0.62 → 호가 0.55 → 데이터 피드를 사기로 결정 (${PRICE} jUSD). 남은 한도 ${remaining.toFixed(2)} jUSD.`,
                    `The timer fired. 3 news items → model probability 0.62 → order book 0.55 → decision: buy the data feed (${PRICE} jUSD). ${remaining.toFixed(2)} jUSD left on the mandate.`,
                  )}
                </p>
                <div className="stack-modal-actions">
                  <button onClick={() => agentSpend(PRICE)}>{t(`제공자에게서 구매 (${PRICE} jUSD)`, `Buy from provider (${PRICE} jUSD)`)}</button>
                  <button onClick={() => agentSpend(OVER)} style={{ background: "var(--red)", borderColor: "var(--red)", color: "#fff" }}>
                    {t(`${OVER} jUSD 로 사 보기 (한도 초과)`, `Try buying for ${OVER} jUSD (over the cap)`)}
                  </button>
                  <button className="ghost" onClick={() => setPopup(null)}>{t("닫기", "Close")}</button>
                </div>
              </>
            )}
            {popup === "provider" && (
              <>
                <div className="stack-modal-h">{t("서비스 제공자", "Service provider")}</div>
                <pre className="stack-402">{`HTTP/1.1 402 Payment Required\nX-Price: ${PRICE} jUSD\nX-Pay-To: 0xFEED…CAFE`}</pre>
                <p>{t("x402 — 요금표가 응답 그 자체로 돌아옵니다. 에이전트가 값을 치르고 같은 요청을 다시 보냅니다.", "x402 — the price comes back as the response itself. The agent pays and resends the same request.")}</p>
                <div className="stack-modal-actions">
                  <button onClick={providerPay}>{t("x402 로 결제하고 다시 요청", "Pay via x402 and retry")}</button>
                  <button className="ghost" onClick={() => setPopup(null)}>{t("닫기", "Close")}</button>
                </div>
              </>
            )}
            {popup === "ap2" && (
              <>
                <div className="stack-modal-h">AP2 — Payment Mandate</div>
                <p>
                  {t(
                    `Cart Mandate 가 고정한 내용: 데이터 피드 1건, ${PRICE} jUSD. 어느 법정화폐 레일로 정산할까요? 같은 ⑥ 단계가 두 개의 라이브 데모로 갈립니다.`,
                    `Pinned by the Cart Mandate: one data feed, ${PRICE} jUSD. Which fiat rail settles it? The same step ⑥ forks into two live demos.`,
                  )}
                </p>
                <div className="stack-modal-actions">
                  <button onClick={() => ap2Settle("stripe")}>Stripe (USD)</button>
                  <button onClick={() => ap2Settle("toss")}>{t("토스페이먼츠 (KRW)", "Toss Payments (KRW)")}</button>
                  <button className="ghost" onClick={() => setPopup(null)}>{t("닫기", "Close")}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 본문의 **강조** 만 굵게. 로그 문구는 전부 이 파일 안의 상수라 외부 입력이 섞일 자리가 없다.
function bold(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function Wire({ a, b, live, label, both, at = 0.5 }:
  { a: Node; b: Node; live: boolean; label: string; both?: boolean; at?: number }) {
  // 라벨을 선 위 임의 지점에 둘 수 있다 — AP2 간선은 중점에 두면 에이전트의 ERC-4337 칩과 겹친다.
  const mx = a.x + (b.x - a.x) * at;
  const my = a.y + (b.y - a.y) * at;
  const color = live ? "var(--accent)" : "var(--border)";
  return (
    <g>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={live ? 2.4 : 1.5} style={{ transition: "stroke 300ms" }} />
      <rect x={mx - label.length * 3.6 - 7} y={my - 10} width={label.length * 7.2 + 14} height={20} rx={10} fill="var(--bg)" />
      <text x={mx} y={my + 4} textAnchor="middle" fontSize={12} fontWeight={600} fill={live ? "var(--accent)" : "var(--muted)"}>
        {both ? `${label} ↔` : label}
      </text>
    </g>
  );
}

function Box({
  n, w, title, sub, live, ready, flash, onClick, contract,
}: {
  n: Node; w: number; title: string; sub: string; live: boolean; ready: boolean;
  flash: Flash | null; onClick?: () => void; contract?: boolean;
}) {
  const h = 54;
  const cls = ["stack-box", ready && "ready", flash && `flash-${flash.tone}`].filter(Boolean).join(" ");
  return (
    // flash.key 로 <g> 를 새로 그려 같은 애니메이션이 매번 다시 돈다.
    <g key={flash?.key ?? 0} className={cls} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}>
      <rect
        x={n.x - w / 2}
        y={n.y - h / 2}
        width={w}
        height={h}
        rx={9}
        fill="var(--panel)"
        stroke={live ? "var(--accent)" : "var(--border)"}
        strokeWidth={live ? 2.4 : 1.4}
        strokeDasharray={contract ? "6 3" : undefined}
        style={{ transition: "stroke 300ms" }}
      />
      <text x={n.x} y={n.y - 4} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--text)">
        {title}
      </text>
      <text x={n.x} y={n.y + 14} textAnchor="middle" fontSize={11} fill={flash?.tone === "bad" ? "var(--red)" : ready ? "var(--accent)" : "var(--muted)"} fontWeight={ready ? 600 : 400}>
        {sub}
      </text>
    </g>
  );
}

function Chip({ x, y, text, live }: { x: number; y: number; text: string; live: boolean }) {
  const w = text.length * 6.4 + 16;
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height={20} rx={10} fill="var(--muted-surface)" stroke={live ? "var(--accent)" : "var(--border)"} />
      <text x={x} y={y + 14} textAnchor="middle" fontSize={11} fontWeight={600} fill={live ? "var(--accent)" : "var(--muted)"}>
        {text}
      </text>
    </g>
  );
}
