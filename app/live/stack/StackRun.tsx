"use client";

import Link from "next/link";
import { useState } from "react";
import type { Lang } from "@/lib/i18n";

// 한 번의 실행 (jay, 2026-11-02 스케치: "show these in one page showing how they coordinate …
// shown with game like interface"). 여섯 개의 라이브 데모 — 7702 인스펙터 · AA 세션 키 ·
// 정산 에이전트 콘솔 · 자율 결제 에이전트 · AP2 · 토스 — 는 각자 한 조각만 보여 준다.
// 이 판은 그 조각들이 **한 번의 지출**에서 어느 순서로 맞물리는지를 보여 주는 것이 전부다.
//
// 그려지는 모양은 jay 의 손그림 그대로다: User —EIP-7702→ MetaMask, MetaMask → Delegator
// 컨트랙트, Delegator ↔ Agent, Agent → Service Provider, Agent ↔ AP2.
//
// **각본이다.** 체인도, 서명도, 모델 호출도 없다 — 실제로 도는 것은 각 단계가 링크하는
// 데모 페이지 쪽이고, 여기서 틀리면 안 되는 것은 숫자가 아니라 **순서와 누가 무엇을 막는가**다.

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type Rail = "stripe" | "toss";
type Tone = "info" | "good" | "bad" | "chain";
type Node = { x: number; y: number };

const CAP = 5; // 위임 한도 (jUSD)
const PRICE = 2.4; // 에이전트가 사는 데이터 피드 한 건
const OVER = 7; // 한도를 넘는 시도

// jay 의 손그림 배치 그대로. 좌표를 바꾸면 그림의 뜻이 바뀌므로 한 곳에 모아 둔다.
const N: Record<string, Node> = {
  user: { x: 430, y: 48 },
  wallet: { x: 430, y: 168 },
  delegator: { x: 142, y: 304 },
  agent: { x: 430, y: 304 },
  provider: { x: 726, y: 304 },
  ap2: { x: 430, y: 446 },
};

type Packet = { id: number; from: Node; to: Node; color: string };
type Line = { tone: Tone; text: string; chip?: string; href?: string; hrefLabel?: string };

export default function StackRun({ lang }: { lang: Lang }) {
  const t = (ko: string, en: string) => (lang === "ko" ? ko : en);
  const [step, setStep] = useState<Step>(0);
  const [rail, setRail] = useState<Rail>("stripe");
  const [spent, setSpent] = useState(0);
  const [refused, setRefused] = useState(0);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [log, setLog] = useState<Line[]>([]);

  let seq = 0;
  const send = (list: Array<{ from: Node; to: Node; color: string }>) =>
    setPackets(list.map((p) => ({ ...p, id: Date.now() + seq++ })));
  // **오래된 것이 위로.** 가짜 편지 데모(MemoryPoisonSim)는 최신 줄을 맨 위에 쌓지만,
  // 이 페이지가 답하려는 질문이 "무슨 순서로 맞물리나"라서 역순이면 읽는 방향이 거꾸로가 된다.
  const note = (l: Line) => setLog((prev) => [...prev, l]);

  const remaining = CAP - spent;
  const railName = rail === "stripe" ? "Stripe" : t("토스페이먼츠", "Toss Payments");

  function upgrade() {
    setStep(1);
    send([{ from: N.user, to: N.wallet, color: "var(--accent)" }]);
    note({
      tone: "chain",
      chip: "EIP-7702",
      href: "/live/7702",
      hrefLabel: t("7702 인스펙터", "7702 inspector"),
      text: t(
        "지갑이 권한서명 하나를 붙여 보냅니다. 계정의 코드 자리에 0xef0100‖구현주소 가 쓰이고 — 주소도 키도 그대로인데 이제 계정이 코드를 실행합니다. 화면에는 아무 흔적이 남지 않는 단계라, 따로 들여다볼 페이지를 만들어 둔 것이 7702 인스펙터입니다.",
        "The wallet attaches one authorization. 0xef0100‖implementation lands in the account's code slot — same address, same key, but the account now runs code. Nothing on screen shows it happened, which is exactly why the 7702 inspector exists.",
      ),
    });
  }

  function grant() {
    setStep(2);
    send([{ from: N.wallet, to: N.delegator, color: "var(--accent)" }]);
    note({
      tone: "chain",
      chip: "ERC-7715 · EIP-712",
      href: "/live/agent/console",
      hrefLabel: t("정산 에이전트 콘솔", "Settlement Agent console"),
      text: t(
        `주인이 MetaMask 팝업에 **한 번** 답합니다: "최대 ${CAP} jUSD, 1시간". 그 EIP-712 서명이 Delegator 컨트랙트에 위임으로 저장되고, 한도 자체는 caveat enforcer 라는 별개의 컨트랙트가 들고 있습니다. 이 뒤로 팝업은 없습니다 — 권한이 곧 인가이기 때문입니다.`,
        `The owner answers **one** MetaMask popup: "up to ${CAP} jUSD, 1 hour". That EIP-712 signature is stored in the delegator contract as a delegation, and the cap itself lives in a separate caveat-enforcer contract. No popup after this — the permission *is* the authorization.`,
      ),
    });
  }

  function wake() {
    setStep(3);
    send([{ from: N.agent, to: N.agent, color: "var(--muted)" }]);
    note({
      tone: "info",
      href: "/live/agent",
      hrefLabel: t("자율 결제 에이전트", "Autonomous payment agent"),
      text: t(
        "타이머가 에이전트를 깨웁니다. 체인은 아직 한 번도 쓰이지 않습니다 — 뉴스를 읽고, 모델에게 확률을 묻고, 호가와 비교해 살지 말지를 스스로 정합니다. 전부 오프체인이고, 이 한 단계가 '에이전트'와 '능력 모음'을 가릅니다. 나머지 다섯 단계는 사람이 버튼을 눌러도 똑같이 돕니다.",
        "A timer wakes the agent. The chain has not been touched yet — it reads the news, asks the model for a probability, compares that with the order book, and decides for itself whether to buy. All off-chain, and this single step is what separates an agent from a pile of capabilities: the other five run the same whether a human or a loop pressed the button.",
      ),
    });
  }

  function redeem() {
    setStep(4);
    setSpent(PRICE);
    send([
      { from: N.agent, to: N.delegator, color: "var(--accent)" },
      { from: N.delegator, to: N.agent, color: "var(--green)" },
    ]);
    note({
      tone: "chain",
      chip: "ERC-7710 · ERC-4337",
      href: "/live/aa",
      hrefLabel: t("AA — 위임형 계정 & 세션 키", "AA — delegatable accounts"),
      text: t(
        `에이전트가 Delegator 컨트랙트에 redeemDelegations 를 부르고, caveat enforcer 가 한도를 확인한 뒤 통과시킵니다 (${PRICE} jUSD ≤ ${CAP}). 호출은 ERC-4337 UserOperation 으로 나가고 가스는 paymaster 가 대신 냅니다 — 에이전트는 ETH 를 한 푼도 들고 있지 않습니다. 여기서 7702·7715·7710 의 역할이 갈립니다: **7702 가 능력을 주고, 7715 가 권한을 요청하고, 7710 이 그것을 집행합니다.**`,
        `The agent calls redeemDelegations on the delegator contract; the caveat enforcer checks the cap and lets it through (${PRICE} ≤ ${CAP} jUSD). The call goes out as an ERC-4337 UserOperation and a paymaster covers the gas — the agent holds no ETH at all. This is where the three standards separate: **7702 grants the capability, 7715 requests the permission, 7710 enforces it.**`,
      ),
    });
  }

  function overspend() {
    setRefused((n) => n + 1);
    send([{ from: N.agent, to: N.delegator, color: "var(--red)" }]);
    note({
      tone: "bad",
      chip: "ERC-7710",
      text: t(
        `에이전트가 ${OVER} jUSD 를 시도했습니다. caveat enforcer 가 트랜잭션을 되돌립니다 — 남은 한도는 ${remaining.toFixed(2)} jUSD 입니다. 에이전트의 서명은 멀쩡하고 의도도 진짜입니다. 막은 것은 사람의 승인도, 에이전트의 자제력도 아니고 컨트랙트입니다. 한도와 약속의 차이가 여기에 있습니다.`,
        `The agent tried ${OVER} jUSD. The caveat enforcer reverts the transaction — ${remaining.toFixed(2)} jUSD left. The agent's signature is valid and its intent is genuine. What stopped it was neither a human approval nor the agent's restraint, but a contract. That is the whole difference between a cap and a promise.`,
      ),
    });
  }

  function buy() {
    setStep(5);
    send([{ from: N.agent, to: N.provider, color: "var(--accent)" }]);
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

  function settle() {
    setStep(6);
    send([
      { from: N.agent, to: N.ap2, color: "var(--accent)" },
      { from: N.ap2, to: N.agent, color: "var(--green)" },
    ]);
    note({
      tone: "good",
      chip: "AP2 Payment Mandate",
      href: rail === "stripe" ? "/live/ap2" : "/live/toss",
      hrefLabel: rail === "stripe" ? t("AP2 — Stripe 정산", "AP2 — Stripe settlement") : "Toss Payments",
      text: t(
        `AP2 의 Payment Mandate 가 법정화폐 레일로 넘어갑니다 — ${railName} 테스트 결제. 영수증이 돌아오고 저널에 한 줄이 남습니다. 체인이 아는 것은 "얼마가 움직였나"까지이고, "왜 샀나"는 저널에만 있습니다 — 그래서 콘솔에 저널이 따로 있습니다.`,
        `AP2's Payment Mandate crosses to the fiat rail — a ${railName} test payment. A receipt comes back and one line lands in the journal. The chain knows how much moved; why it was bought exists only in the journal, which is why the console keeps one.`,
      ),
    });
  }

  function reset() {
    setStep(0);
    setSpent(0);
    setRefused(0);
    setPackets([]);
    setLog([]);
  }

  const steps: Array<{ n: string; label: string; onClick: () => void; enabled: boolean }> = [
    { n: "①", label: t("계정 업그레이드", "Upgrade account"), onClick: upgrade, enabled: step === 0 },
    { n: "②", label: t("위임 부여", "Grant mandate"), onClick: grant, enabled: step === 1 },
    { n: "③", label: t("에이전트 깨우기", "Wake the agent"), onClick: wake, enabled: step === 2 },
    { n: "④", label: t("위임 행사", "Redeem"), onClick: redeem, enabled: step === 3 },
    { n: "⑤", label: t("서비스 구매", "Buy the service"), onClick: buy, enabled: step === 4 },
    { n: "⑥", label: t("정산", "Settle"), onClick: settle, enabled: step === 5 },
  ];

  // 노드의 상태 — 아직 안 지난 단계는 중립, 지나간 단계는 켜짐.
  const on = {
    user: step >= 1,
    wallet: step >= 1,
    delegator: step >= 2,
    agent: step >= 3,
    provider: step >= 5,
    ap2: step >= 6,
  };

  return (
    <div className="panel" style={{ marginTop: 16, maxWidth: 900 }}>
      {/* ── 조작판 ───────────────────────────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {steps.map((s) => (
          <button key={s.n} onClick={s.onClick} disabled={!s.enabled}>
            {s.n} {s.label}
          </button>
        ))}
        <button className="ghost" onClick={reset}>
          {t("초기화", "Reset")}
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 10 }}>
        <button
          onClick={overspend}
          disabled={step < 2 || step > 5}
          style={
            step >= 2 && step <= 5
              ? { background: "var(--red)", borderColor: "var(--red)", color: "#fff" }
              : undefined
          }
        >
          {t(`한도 넘겨 보기 (${OVER} jUSD)`, `Try to overspend (${OVER} jUSD)`)}
        </button>
        <span className="sub" style={{ fontSize: 13 }}>
          {t(
            "언제든 눌러 보세요 — 막는 것이 사람이 아니라 컨트랙트라는 점이 이 판의 요점입니다.",
            "Press it at any point — the point of this board is that a contract refuses, not a person.",
          )}
        </span>
      </div>

      {/* 정산 레일 선택: 같은 ⑥ 단계가 두 개의 라이브 데모로 갈린다. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 10, fontSize: 13 }}>
        <span className="sub">{t("정산 레일", "Settlement rail")}</span>
        {(["stripe", "toss"] as Rail[]).map((r) => (
          <button
            key={r}
            className={rail === r ? undefined : "ghost"}
            aria-pressed={rail === r}
            disabled={step >= 6}
            onClick={() => setRail(r)}
          >
            {r === "stripe" ? "Stripe (USD)" : t("토스페이먼츠 (KRW)", "Toss Payments (KRW)")}
          </button>
        ))}
      </div>

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
          <div className="stack-hud-k">{t("단계", "Step")}</div>
          <div className="stack-hud-v">{step} / 6</div>
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
          <Wire a={N.user} b={N.wallet} live={on.wallet} label="EIP-7702" />
          <Wire a={N.wallet} b={N.delegator} live={on.delegator} label="ERC-7715" />
          <Wire a={N.delegator} b={N.agent} live={step >= 4} label="ERC-7710" both />
          <Wire a={N.agent} b={N.provider} live={on.provider} label="x402" />
          <Wire a={N.agent} b={N.ap2} live={on.ap2} label="AP2" both at={0.66} />

          <Box n={N.user} w={150} title={t("사용자", "User")} sub={t("주인 · EOA", "owner · EOA")} live={on.user} />
          <Box
            n={N.wallet}
            w={180}
            title="MetaMask"
            sub={on.wallet ? t("코드 붙음 · 주소 그대로", "code attached · same address") : t("보통 EOA", "plain EOA")}
            live={on.wallet}
          />
          <Box
            n={N.delegator}
            w={196}
            title={t("Delegator 컨트랙트", "Delegator contract")}
            sub={on.delegator ? t(`caveat: ≤ ${CAP} jUSD · 1h`, `caveat: ≤ ${CAP} jUSD · 1h`) : t("위임 없음", "no delegation")}
            live={on.delegator}
          />
          <Box
            n={N.agent}
            w={170}
            title={t("에이전트", "Agent")}
            sub={step === 0 ? t("잠듦", "asleep") : step < 3 ? t("대기", "idle") : step < 5 ? t("결정함", "decided") : t("지출함", "spent")}
            live={on.agent}
          />
          <Box
            n={N.provider}
            w={180}
            title={t("서비스 제공자", "Service provider")}
            sub={on.provider ? t(`데이터 피드 · ${PRICE} jUSD`, `data feed · ${PRICE} jUSD`) : "HTTP 402"}
            live={on.provider}
          />
          <Box
            n={N.ap2}
            w={210}
            title={`AP2 — ${railName}`}
            sub={on.ap2 ? t("영수증 · 저널 한 줄", "receipt · one journal line") : t("법정화폐 레일", "fiat rail")}
            live={on.ap2}
          />

          {/* ERC-4337 은 간선이 아니라 에이전트가 트랜잭션을 내보내는 방식이라, 노드에 붙인 칩으로 둔다. */}
          <Chip x={N.agent.x} y={N.agent.y + 44} text="ERC-4337 · UserOp · paymaster" live={step >= 4} />
          {/* ERC-8004 은 이 판에서 유일하게 **안 도는** 조각이다 — 자리를 비워 두는 대신 흐릿하게 그려 둔다. */}
          <Chip x={N.provider.x} y={N.provider.y + 44} text={t("ERC-8004 · 에이전트 신원 (설명만)", "ERC-8004 · agent identity (explainer)")} live={false} />

          {packets.map((p) => (
            <circle key={p.id} r={7} fill={p.color}>
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
              "① 부터 ⑥ 까지 눌러 보세요. 각 줄은 그 단계를 실제로 돌리는 데모 페이지로 이어집니다 — 이 판은 각본이고, 돌아가는 것은 그쪽입니다.",
              "Press ① through ⑥. Every line links to the demo that actually runs that step — this board is scripted; those pages are not.",
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

function Box({ n, w, title, sub, live }: { n: Node; w: number; title: string; sub: string; live: boolean }) {
  const h = 54;
  return (
    <g>
      <rect
        x={n.x - w / 2}
        y={n.y - h / 2}
        width={w}
        height={h}
        rx={9}
        fill="var(--panel)"
        stroke={live ? "var(--accent)" : "var(--border)"}
        strokeWidth={live ? 2.4 : 1.4}
        style={{ transition: "stroke 300ms" }}
      />
      <text x={n.x} y={n.y - 4} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--text)">
        {title}
      </text>
      <text x={n.x} y={n.y + 14} textAnchor="middle" fontSize={11} fill="var(--muted)">
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
