"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { CAP, PRICE, OVER, STD, type Txt } from "./std";

// 한 번의 실행 (jay, 2026-11-02 손그림: "show these in one page showing how they coordinate …
// shown with game like interface"). 여섯 개의 라이브 데모 — 7702 인스펙터 · AA 세션 키 ·
// 정산 에이전트 콘솔 · 자율 결제 에이전트 · AP2 · 토스 — 는 각자 한 조각만 보여 준다.
// 이 판은 그 조각들이 **한 번의 지출**에서 어느 순서로 맞물리는지를 보여 주는 것이 전부다.
//
// 그려지는 모양은 jay 의 손그림 그대로다: User —EIP-7702→ MetaMask, MetaMask → Delegator
// 컨트랙트, Delegator ↔ Agent, Agent → Service Provider, Agent ↔ AP2.
//
// **판 위의 칸이 곧 버튼이다** (jay, 2026-11-02 두 번째 요청): 차례가 된 칸이 깜빡이고, 누르면
// 말풍선이 뜨고, 답하면 다음 칸이 깜빡인다. 컨트랙트가 끼는 동작은 컨트랙트 칸이 번쩍이면서
// 상태 줄이 바뀐다 — 위임 없음 → caveat 저장 → 사용액 → 거절.
//
// **설명은 전부 말풍선의 "표준" 메뉴 안에** (jay, 2026-11-02 세 번째 손그림: "only display diagram …
// all the detailed description can be showed through a menu item of each popup"). 페이지에는 판만
// 있고, 표준 하나하나의 긴 설명과 "어느 데모가 그걸 도나"는 각 말풍선의 표준 버튼 뒤에 있다.
//
// **오른쪽의 Canton 구역**은 같은 손그림에서 왔다: "User · Operator · Canton network (from #5001 (T5))".
// T5 는 아직 계획(후보)이라 점선으로 그리고 "계획"이라 적는다 — 돌지 않는 것을 도는 것처럼 그리지 않는다.
//
// **각본이다.** 체인도, 서명도, 모델 호출도 없다 — 실제로 도는 것은 각 줄이 링크하는
// 데모 페이지 쪽이고, 여기서 틀리면 안 되는 것은 숫자가 아니라 **순서와 누가 무엇을 막는가**다.
//
// **지도 → 펼친 판** (jay, 2026-11-03 손그림: "A) Map: agentic payment scenario — user — Canton scenario ·
// if I click one square above, the screen goes like this · B) unfolded detail"). 맨 위에는 두 시나리오가
// 사용자 하나를 사이에 두고 이어진 지도만 있고, 네모를 누르면 그 시나리오의 판이 아래에 펼쳐진다.
// 같은 손그림의 나머지 둘: 판의 테두리는 없앤다("we don't need border no more"), 사용자 칸 두 개는
// 하나로 합친다("should be merged") — 사용자는 지도 가운데 한 번만 있고, 각 판은 그 사람에서 시작한다.

type Scenario = "agentic" | "canton";
type Phase = "user" | "wallet" | "agent" | "provider" | "ap2" | "done";
type StackNode = "user" | "wallet" | "delegator" | "agent" | "provider" | "ap2";
type CantonNode = "cuser" | "operator" | "sync" | "validator" | "daml";
type NodeId = StackNode | CantonNode;
type Rail = "stripe" | "toss";
type Tone = "info" | "good" | "bad" | "chain";
type Node = { x: number; y: number };

// jay 의 손그림 배치 그대로. 좌표를 바꾸면 그림의 뜻이 바뀌므로 한 곳에 모아 둔다.
// 두 시나리오는 각자 자기 판에 그려지므로 Canton 좌표도 왼쪽 끝에서 시작한다.
const N: Record<NodeId, Node> = {
  user: { x: 430, y: 48 },
  wallet: { x: 430, y: 168 },
  delegator: { x: 142, y: 304 },
  agent: { x: 430, y: 304 },
  provider: { x: 726, y: 304 },
  ap2: { x: 430, y: 446 },
  // Canton 구역 (T5)
  // 구역은 사용자보다 한 칸 내려 둔다 — 사용자에서 말풍선으로 가는 선이 구역 제목을 가로지르지 않게.
  cuser: { x: 180, y: 48 },
  operator: { x: 180, y: 270 },
  sync: { x: 440, y: 140 },
  validator: { x: 440, y: 270 },
  daml: { x: 440, y: 400 },
};
const CANTON_FRAME = { x: 343, y: 86, w: 194, h: 370 };

type Packet = { id: number; from: Node; to: Node; color: string };
type Line = { tone: Tone; text: string; chip?: string; href?: string; hrefLabel?: string };
type Flash = { node: NodeId; tone: "good" | "bad"; key: number };

export default function StackRun({ lang }: { lang: Lang }) {
  const t = (ko: string, en: string) => (lang === "ko" ? ko : en);
  const tx = (x: Txt) => (lang === "ko" ? x.ko : x.en);
  const [view, setView] = useState<Scenario | null>(null); // 펼친 시나리오 — 없으면 지도만
  const [phase, setPhase] = useState<Phase>("user");
  const [popup, setPopup] = useState<NodeId | null>(null);
  const [detail, setDetail] = useState<string | null>(null); // 열린 "표준" 설명
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
  // **오래된 것이 위로.** 이 페이지가 답하려는 질문이 "무슨 순서로 맞물리나"라서 역순이면 읽는 방향이 거꾸로가 된다.
  const note = (l: Line) => setLog((prev) => [...prev, l]);
  const blink = (node: NodeId, tone: "good" | "bad") => setFlash({ node, tone, key: Date.now() });
  const open = (id: NodeId) => { setPopup(id); setDetail(null); };
  const close = () => { setPopup(null); setDetail(null); };

  // Esc 로 말풍선 닫기 — 지갑 창을 흉내 내는 만큼 닫는 길도 지갑처럼.
  useEffect(() => {
    if (!popup) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popup]);

  const remaining = CAP - spent;
  const ready: NodeId | null = phase === "done" ? null : phase; // 차례가 된 칸 = 깜빡이는 칸
  const railName = rail === "toss" ? t("토스페이먼츠", "Toss Payments") : "Stripe";
  const granted = phase !== "user" && phase !== "wallet";

  // ── 동작들: 말풍선의 버튼이 부른다. 긴 설명은 STD 에 있으니 저널은 한 줄씩이다 ───
  function userGive() {
    close(); setPhase("wallet");
    send([{ from: N.user, to: N.wallet, color: "var(--accent)" }]);
    note({ tone: "info", text: t(`주인: "에이전트에게 최대 ${CAP} jUSD, 1시간 위임." 아직 아무것도 서명되지 않았다 — 지갑이 물어볼 차례.`, `Owner: "give the agent up to ${CAP} jUSD for 1 hour." Nothing signed yet — the wallet's turn to ask.`) });
  }
  function walletAgree() {
    close(); setPhase("agent");
    send([{ from: N.wallet, to: N.delegator, color: "var(--accent)" }]);
    blink("delegator", "good");
    note({ tone: "chain", chip: "EIP-7702", href: "/live/7702", hrefLabel: t("7702 인스펙터", "7702 inspector"), text: t("계정에 코드가 붙었다 — 주소·키 그대로.", "Code attached to the account — same address, same key.") });
    note({ tone: "chain", chip: "ERC-7715 · EIP-712", href: "/live/agent/console", hrefLabel: t("정산 에이전트 콘솔", "Settlement console"), text: t(`위임 저장 — caveat ≤ ${CAP} jUSD · 1h. 이 뒤로 팝업 없음.`, `Delegation stored — caveat ≤ ${CAP} jUSD · 1 h. No popups after this.`) });
  }
  function walletReject() {
    close();
    note({ tone: "bad", text: t("거절 — 아무것도 쓰이지 않았고 에이전트는 계속 잠들어 있다. MetaMask 를 다시 눌러 보라.", "Rejected — nothing written, the agent stays asleep. Press MetaMask again.") });
  }
  function agentSpend(amount: number) {
    close();
    if (amount > remaining) {
      setRefused((n) => n + 1); setLastRefused(true);
      send([{ from: N.agent, to: N.delegator, color: "var(--red)" }]);
      blink("delegator", "bad");
      note({ tone: "bad", chip: "ERC-7710", text: t(`${amount} jUSD 시도 → caveat enforcer 가 되돌림 (남은 한도 ${remaining.toFixed(2)}). 서명은 멀쩡했다 — 막은 것은 컨트랙트.`, `Tried ${amount} jUSD → the caveat enforcer reverted it (${remaining.toFixed(2)} left). The signature was fine — a contract stopped it.`) });
      return;
    }
    setLastRefused(false); setSpent((s) => s + amount); setPhase("provider");
    send([{ from: N.agent, to: N.delegator, color: "var(--accent)" }, { from: N.delegator, to: N.agent, color: "var(--green)" }]);
    blink("delegator", "good");
    note({ tone: "info", href: "/live/agent", hrefLabel: t("자율 결제 에이전트", "Autonomous agent"), text: t("에이전트가 깨어나 스스로 결정 — 뉴스 → 확률 → 호가 → 산다. 전부 오프체인.", "The agent woke and decided on its own — news → probability → order book → buy. All off-chain.") });
    note({ tone: "chain", chip: "ERC-7710 · ERC-4337", href: "/live/aa", hrefLabel: t("AA 데모", "AA demo"), text: t(`redeemDelegations 통과 (${amount} ≤ ${CAP}). UserOperation, 가스는 paymaster.`, `redeemDelegations passed (${amount} ≤ ${CAP}). A UserOperation; paymaster paid the gas.`) });
  }
  function providerPay() {
    close(); setPhase("ap2");
    send([{ from: N.agent, to: N.provider, color: "var(--accent)" }]);
    blink("provider", "good");
    note({ tone: "info", chip: "x402", text: t(`402 → ${PRICE} jUSD 지불 → 같은 요청 재전송 → 데이터 전달.`, `402 → paid ${PRICE} jUSD → same request resent → data delivered.`) });
  }
  function ap2Settle(r: Rail) {
    close(); setRail(r); setPhase("done");
    send([{ from: N.agent, to: N.ap2, color: "var(--accent)" }, { from: N.ap2, to: N.agent, color: "var(--green)" }]);
    blink("ap2", "good");
    const name = r === "toss" ? t("토스페이먼츠", "Toss Payments") : "Stripe";
    note({ tone: "good", chip: "AP2 Payment Mandate", href: r === "stripe" ? "/live/ap2" : "/live/toss", hrefLabel: r === "stripe" ? "AP2 — Stripe" : "Toss Payments", text: t(`${name} 테스트 결제 → 영수증 → 저널 한 줄.`, `${name} test payment → receipt → one journal line.`) });
  }
  function reset() {
    setPhase("user"); close(); setRail(null); setSpent(0); setRefused(0); setLastRefused(false); setPackets([]); setLog([]); setFlash(null);
  }

  // ── 화면의 상태 줄: 컨트랙트가 끼는 동작마다 여기 글자가 바뀐다 ──────────
  const status: Record<NodeId, string> = {
    user: phase === "user" ? t("차례 — 눌러 보세요", "your move — press") : t("주인 · EOA", "owner · EOA"),
    wallet: phase === "wallet" ? t("요청 대기 중 — 눌러 보세요", "request pending — press") : granted ? t("코드 붙음 · 주소 그대로", "code attached · same address") : t("보통 EOA", "plain EOA"),
    delegator: !granted ? t("위임 없음", "no delegation")
      : lastRefused ? t(`거절 · revert (${OVER} > ${remaining.toFixed(1)})`, `refused · revert (${OVER} > ${remaining.toFixed(1)})`)
      : spent > 0 ? t(`사용 ${spent.toFixed(2)} / ${CAP} jUSD`, `used ${spent.toFixed(2)} / ${CAP} jUSD`)
      : t(`caveat 저장: ≤ ${CAP} jUSD · 1h`, `caveat stored: ≤ ${CAP} jUSD · 1h`),
    agent: phase === "agent" ? t("깨어남 — 눌러 보세요", "awake — press") : granted ? t("지출함", "spent") : t("잠듦", "asleep"),
    provider: phase === "provider" ? t("HTTP 402 — 눌러 보세요", "HTTP 402 — press") : phase === "ap2" || phase === "done" ? t("결제됨 · 데이터 전달", "paid · data delivered") : "HTTP 402",
    ap2: phase === "ap2" ? t("정산 대기 — 눌러 보세요", "awaiting settlement — press") : phase === "done" ? t("영수증 · 저널 한 줄", "receipt · one journal line") : t("법정화폐 레일", "fiat rail"),
    cuser: t("계약의 당사자", "a party to the contract"),
    operator: t("Jayverse · validator 노드", "Jayverse · validator node"),
    sync: t("순서만 정함", "orders only"),
    validator: t("private ledger", "private ledger"),
    daml: t("Number 읽기 · DvP", "Number reading · DvP"),
  };
  const lit: Record<NodeId, boolean> = {
    user: phase !== "user", wallet: phase !== "user", delegator: granted, agent: granted,
    provider: phase === "ap2" || phase === "done", ap2: phase === "done",
    cuser: false, operator: false, sync: false, validator: false, daml: false,
  };
  const CANTON: CantonNode[] = ["cuser", "operator", "sync", "validator", "daml"];
  const boxProps = (id: NodeId) => ({
    n: N[id], live: lit[id], ready: ready === id, flash: flash?.node === id ? flash : null,
    plan: CANTON.includes(id as CantonNode),
    onClick: ready === id || CANTON.includes(id as CantonNode) ? () => open(id) : undefined,
  });

  // 진행 표시줄 — 버튼이 아니라 지나온 칸의 기록이다. 누르는 곳은 판 위다.
  const steps = [
    { n: "①", label: "EIP-7702", done: granted }, { n: "②", label: "ERC-7715", done: granted },
    { n: "③", label: t("깨어남", "wake"), done: spent > 0 }, { n: "④", label: "ERC-7710", done: spent > 0 },
    { n: "⑤", label: "x402", done: phase === "ap2" || phase === "done" }, { n: "⑥", label: "AP2", done: phase === "done" },
  ];

  // ── 말풍선: 판 안에서, 말하는 칸 옆에 (모달은 "이질적") ─────────────────────
  // 고정 슬롯 하나(스택 구역 오른쪽 위, 모든 국면에서 비어 있는 자리)에 두고, 말하는 칸까지 선을 긋는다.
  // 아래 한계는 서비스 제공자 칸 윗변(277)이다. 표준 설명을 읽는 동안만은 그 아래로 자란다 —
  // 읽는 중에는 판을 누를 일이 없고, 스크롤되는 말풍선보다 긴 말풍선이 낫다.
  const B = { x: view === "canton" ? 580 : 548, y: 18, w: 300, h: detail ? 420 : 252 };
  const leader = popup && (
    <line
      x1={Math.min(Math.max(N[popup].x, B.x), B.x + B.w)} y1={Math.min(Math.max(N[popup].y, B.y), B.y + B.h)}
      x2={N[popup].x} y2={N[popup].y} stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="3 3"
    />
  );

  // 각 말풍선의 "표준" 메뉴 — 긴 설명은 전부 여기 뒤에 있다.
  const MENU: Record<NodeId, string[]> = {
    user: ["EIP-7702"], wallet: ["EIP-7702", "ERC-7715", "EIP-712"], delegator: ["ERC-7710"],
    agent: ["ERC-7710", "ERC-4337", "ERC-5792"], provider: ["x402", "ERC-8004", "ERC-1271"], ap2: ["AP2", "EIP-712"],
    cuser: ["Validator", "Guardrail"], operator: ["Validator", "Synchronizer", "Guardrail"],
    sync: ["Synchronizer"], validator: ["Validator", "Daml"], daml: ["Daml", "Guardrail"],
  };
  const StdMenu = ({ id }: { id: NodeId }) => (
    <div className="stack-std">
      <span className="stack-std-k">{t("표준", "standards")}</span>
      {MENU[id].map((k) => (
        <button key={k} className={`stack-std-b${STD[k].runs === "live" ? "" : " dim"}`} onClick={() => setDetail(k)}>{STD[k].id}</button>
      ))}
    </div>
  );
  const Detail = ({ k }: { k: string }) => {
    const s = STD[k];
    return (
      <>
        <div className="stack-bubble-h">
          <span className="stack-chip">{s.id}</span>
          <span className="sub" style={{ fontSize: 11, fontWeight: 400 }}>
            {s.runs === "live" ? t("여기서 돈다", "runs here") : s.runs === "plan" ? t("계획", "planned") : t("이름만", "named only")}
          </span>
        </div>
        <p><strong>{tx(s.role)}</strong></p>
        <p>{tx(s.detail)}</p>
        <div className="stack-bubble-actions">
          <button className="ghost" onClick={() => setDetail(null)}>{t("← 뒤로", "← Back")}</button>
          {s.href && s.label && <Link href={`${s.href}?from=live`} className="stack-link">{tx(s.label)} →</Link>}
        </div>
      </>
    );
  };
  const bubble = popup && (
    <foreignObject x={B.x} y={B.y} width={B.w} height={B.h} style={{ overflow: "visible" }}>
      <div className={`stack-bubble${popup === "wallet" ? " wallet" : ""}`} role="dialog" aria-modal="false">
        <button className="stack-bubble-x" aria-label={t("닫기", "Close")} onClick={close}>×</button>
        {detail ? <Detail k={detail} /> : (
          <>
            {popup === "user" && (<>
              <div className="stack-bubble-h">{t("사용자 — 주인", "User — owner")}</div>
              <p>{t(`뉴스를 보고 데이터를 사는 에이전트를 돌리고 싶다. 매번 서명하기는 싫고, 지갑을 통째로 맡길 수도 없다. 에이전트에게 "최대 ${CAP} jUSD, 1시간" 위임을 준다.`, `You want an agent that reads news and buys data. You do not want to sign every time, and you cannot hand it the whole wallet. You give it a mandate: "up to ${CAP} jUSD, 1 hour".`)}</p>
              <div className="stack-bubble-actions"><button onClick={userGive}>{t("위임 주기", "Give mandate")}</button></div>
            </>)}
            {popup === "wallet" && (<>
              <div className="stack-bubble-h"><span className="stack-fox" aria-hidden>🦊</span> MetaMask</div>
              <div className="stack-req">
                <div className="stack-req-site">jaylabs.xyz {t("가 요청합니다", "requests")}</div>
                <div className="stack-req-row"><span className="stack-chip">EIP-7702</span>{t("계정에 코드 붙이기 — 주소·키 그대로", "Attach code — address and key unchanged")}</div>
                <div className="stack-req-row"><span className="stack-chip">ERC-7715</span>{t(`권한: ≤ ${CAP} jUSD · 1시간 · 에이전트에게`, `Permission: ≤ ${CAP} jUSD · 1 hour · to the agent`)}</div>
                <div className="stack-req-note">{t("서명 1회 · 이후 팝업 없음 · 한도는 컨트랙트가 집행", "One signature · no popups after · the cap is enforced by a contract")}</div>
              </div>
              <div className="stack-bubble-actions"><button onClick={walletAgree}>{t("동의", "Confirm")}</button><button className="ghost" onClick={walletReject}>{t("거절", "Reject")}</button></div>
            </>)}
            {popup === "delegator" && (<>
              <div className="stack-bubble-h">{t("Delegator 컨트랙트", "Delegator contract")}</div>
              <p>{status.delegator}</p>
            </>)}
            {popup === "agent" && (<>
              <div className="stack-bubble-h">{t("에이전트 — 틱", "Agent — tick")}</div>
              <p>{t(`타이머가 울렸다. 뉴스 3건 → 모델 확률 0.62 → 호가 0.55 → 데이터 피드를 사기로 결정 (${PRICE} jUSD). 남은 한도 ${remaining.toFixed(2)} jUSD.`, `The timer fired. 3 news items → model probability 0.62 → order book 0.55 → decision: buy the data feed (${PRICE} jUSD). ${remaining.toFixed(2)} jUSD left.`)}</p>
              <div className="stack-bubble-actions">
                <button onClick={() => agentSpend(PRICE)}>{t(`제공자에게서 구매 (${PRICE} jUSD)`, `Buy from provider (${PRICE} jUSD)`)}</button>
                <button onClick={() => agentSpend(OVER)} style={{ background: "var(--red)", borderColor: "var(--red)", color: "#fff" }}>{t(`${OVER} jUSD 로 사 보기 (한도 초과)`, `Try ${OVER} jUSD (over the cap)`)}</button>
              </div>
            </>)}
            {popup === "provider" && (<>
              <div className="stack-bubble-h">{t("서비스 제공자", "Service provider")}</div>
              <pre className="stack-402">{`HTTP/1.1 402 Payment Required\nX-Price: ${PRICE} jUSD\nX-Pay-To: 0xFEED…CAFE`}</pre>
              <div className="stack-bubble-actions"><button onClick={providerPay}>{t("x402 로 결제하고 다시 요청", "Pay via x402 and retry")}</button></div>
            </>)}
            {popup === "ap2" && (<>
              <div className="stack-bubble-h">AP2 — Payment Mandate</div>
              <p>{t(`Cart Mandate 가 고정한 것: 데이터 피드 1건, ${PRICE} jUSD. 어느 법정화폐 레일로 정산할까?`, `Pinned by the Cart Mandate: one data feed, ${PRICE} jUSD. Which fiat rail settles it?`)}</p>
              <div className="stack-bubble-actions"><button onClick={() => ap2Settle("stripe")}>Stripe (USD)</button><button onClick={() => ap2Settle("toss")}>{t("토스페이먼츠 (KRW)", "Toss Payments (KRW)")}</button></div>
            </>)}
            {popup === "cuser" && (<>
              <div className="stack-bubble-h">{t("사용자 — Canton 쪽", "User — on Canton")}</div>
              <p>{t("지출 시나리오의 주인과 같은 사람이다. 여기서는 Daml 계약의 당사자(party) — 자기가 당사자인 sub-transaction 만 본다.", "The same person who owns the agent in the spend scenario. Here a party to a Daml contract — sees only the sub-transactions it is party to.")}</p>
            </>)}
            {popup === "operator" && (<>
              <div className="stack-bubble-h">{t("운영자 — Jayverse", "Operator — Jayverse")}</div>
              <p>{t("validator 노드 하나를 돌린다. 로컬 Splice LocalNet 에서 시작해 Global Synchronizer DevNet 으로 — super validator 의 sponsorship 이 필요한 첫 실제 접점.", "Runs one validator node. Starts on Splice LocalNet, then the Global Synchronizer DevNet — the first real touchpoint, which needs a super validator's sponsorship.")}</p>
            </>)}
            {popup === "sync" && (<><div className="stack-bubble-h">Global Synchronizer</div><p>{tx(STD.Synchronizer.role)}</p></>)}
            {popup === "validator" && (<><div className="stack-bubble-h">Validator</div><p>{tx(STD.Validator.role)}</p></>)}
            {popup === "daml" && (<><div className="stack-bubble-h">{t("Daml 계약", "Daml contract")}</div><p>{tx(STD.Daml.role)}</p></>)}
            <StdMenu id={popup} />
          </>
        )}
      </div>
    </foreignObject>
  );

  // 지도의 네모를 누르면 그 시나리오가 펼쳐진다. 열린 것을 다시 누르면 접힌다.
  const pick = (v: Scenario) => { close(); setView((cur) => (cur === v ? null : v)); };
  const svgStyle = { width: "100%", maxWidth: 1100, minWidth: 700, height: "auto", display: "block" } as const;

  return (
    <div className="stack-board" style={{ marginTop: 16 }}>
      {/* ── 지도: 두 시나리오가 사용자 하나를 사이에 두고 이어진다 ─────────── */}
      <div className="stack-map">
        <button className={`stack-map-box${view === "agentic" ? " on" : ""}`} aria-expanded={view === "agentic"} onClick={() => pick("agentic")}>
          <b>{t("에이전트 결제 시나리오", "Agentic payment scenario")}</b>
          <span>{t("여섯 데모 · EIP-7702 → AP2", "six demos · EIP-7702 → AP2")}</span>
        </button>
        <span className="stack-map-wire" aria-hidden />
        <span className="stack-map-user">{t("사용자", "User")}</span>
        <span className="stack-map-wire dashed" aria-hidden />
        <button className={`stack-map-box plan${view === "canton" ? " on" : ""}`} aria-expanded={view === "canton"} onClick={() => pick("canton")}>
          <b>{t("Canton 시나리오", "Canton scenario")}</b>
          <span>{t("계획 · T5 · 테스트넷만", "planned · T5 · test networks only")}</span>
        </button>
      </div>
      {!view && <p className="sub" style={{ fontSize: 13, marginTop: 10 }}>{t("네모를 누르면 그 시나리오의 판이 아래에 펼쳐집니다.", "Press a box to unfold that scenario's board below.")}</p>}

      {view === "agentic" && (<>
        {/* ── 진행 + 초기화 ───────────────────────────────────────── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 18 }}>
          {steps.map((s) => <span key={s.n} className={`stack-step${s.done ? " done" : ""}`}>{s.n} {s.label}</span>)}
          <button className="ghost" onClick={reset} style={{ marginLeft: "auto" }}>{t("초기화", "Reset")}</button>
        </div>
        <p className="sub" style={{ fontSize: 13, marginTop: 8 }}>
          {phase === "done"
            ? t(`끝 — ${PRICE} jUSD 가 ${railName} 로 정산됐고 ${refused ? `${refused}번의 초과 시도가 컨트랙트에서 막혔습니다. 초기화하고 이번엔 거절 없이 돌려 보세요.` : "한 번도 거절되지 않았습니다. 초기화하고 이번엔 한도를 넘겨 보세요."}`,
                `Done — ${PRICE} jUSD settled via ${railName}, ${refused ? `${refused} overspend attempt${refused > 1 ? "s" : ""} stopped by the contract. Reset and run it clean this time.` : "nothing refused. Reset and try breaking the cap this time."}`)
            : t("깜빡이는 칸을 누르세요. 말풍선의 '표준' 버튼이 그 칸에 걸린 표준의 설명을 엽니다.",
                "Press the blinking box. A bubble's 'standards' buttons open the explanation of each standard on that box.")}
        </p>

        {/* ── HUD: 위임 한도가 이 게임의 체력 바다 ───────────────── */}
        <div className="stack-hud">
          <div><div className="stack-hud-k">{t("위임 한도", "Mandate")}</div><div className="stack-hud-v">{spent.toFixed(2)} / {CAP.toFixed(2)} jUSD</div><div className="stack-bar" aria-hidden><span style={{ width: `${(spent / CAP) * 100}%` }} /></div></div>
          <div><div className="stack-hud-k">{t("차례", "Turn")}</div><div className="stack-hud-v">{phase === "done" ? t("완료", "done") : { user: t("사용자", "User"), wallet: "MetaMask", agent: t("에이전트", "Agent"), provider: t("서비스 제공자", "Provider"), ap2: "AP2" }[phase]}</div></div>
          <div><div className="stack-hud-k">{t("거절된 시도", "Refused")}</div><div className="stack-hud-v" style={refused ? { color: "var(--red)" } : undefined}>{refused}</div></div>
          <div><div className="stack-hud-k">{t("에이전트의 ETH", "Agent's ETH")}</div><div className="stack-hud-v">0 <span className="sub" style={{ fontSize: 12, fontWeight: 400 }}>({t("가스는 paymaster", "paymaster pays gas")})</span></div></div>
        </div>

        {/* ── 판 ───────────────────────────────────────────────── */}
        {/* 폰에서 줄이면 글자가 5px 이 되므로, 읽을 수 있는 크기를 지키고 가로 스크롤을 준다. */}
        <div style={{ overflowX: "auto", marginTop: 14 }}>
          <svg viewBox="0 14 880 470" style={svgStyle} role="img"
            aria-label={t("사용자, MetaMask, Delegator 컨트랙트, 에이전트, 서비스 제공자, AP2 사이의 흐름", "Flow between the user, MetaMask, the delegator contract, the agent, the service provider and AP2")}>
            {/* 말풍선 연결선은 칸 아래에 깔리게 먼저 그린다 — 끝이 칸에 가려져 모서리 계산이 필요 없다. */}
            {leader}
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

            {/* 끝난 패킷은 투명한 채로 도착 칸 위에 남는다 — 포인터를 꺼 두지 않으면 그 칸의 클릭을 가로챈다. */}
            {packets.map((p) => (
              <circle key={p.id} r={7} fill={p.color} style={{ pointerEvents: "none" }}>
                <animate attributeName="cx" from={p.from.x} to={p.to.x} dur="0.9s" fill="freeze" />
                <animate attributeName="cy" from={p.from.y} to={p.to.y} dur="0.9s" fill="freeze" />
                <animate attributeName="opacity" values="1;1;0" dur="1.2s" fill="freeze" />
              </circle>
            ))}
            {bubble}
          </svg>
        </div>

        {/* ── 저널: 한 줄씩. 긴 설명은 말풍선의 표준 메뉴에 ──────────── */}
        <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
          {log.length === 0 && <p className="sub" style={{ fontSize: 13 }}>{t("각 줄은 그 단계를 실제로 돌리는 데모 페이지로 이어집니다 — 이 판은 각본이고, 돌아가는 것은 그쪽입니다.", "Every line links to the demo that actually runs that step — this board is scripted; those pages are not.")}</p>}
          {log.map((l, i) => (
            <div key={i} style={{ fontSize: 13, paddingLeft: 10, borderLeft: `3px solid ${l.tone === "bad" ? "var(--red)" : l.tone === "good" ? "var(--green)" : l.tone === "chain" ? "var(--accent)" : "var(--border)"}` }}>
              {l.chip && <span className="stack-chip">{l.chip}</span>}
              {l.text}
              {l.href && <> <Link href={`${l.href}?from=live`} className="stack-link">{l.hrefLabel} →</Link></>}
            </div>
          ))}
        </div>
      </>)}

      {view === "canton" && (<>
        <p className="sub" style={{ fontSize: 13, marginTop: 18 }}>
          {t("T5 는 아직 계획(후보)이라 전부 점선입니다 — 칸을 눌러 무엇을 하게 될지 읽을 수 있습니다.", "T5 is still a plan (a candidate), so everything is dashed — press a box to read what it will do.")}
        </p>
        <div style={{ overflowX: "auto", marginTop: 14 }}>
          <svg viewBox="0 14 900 470" style={svgStyle} role="img"
            aria-label={t("사용자, 운영자, synchronizer, validator, Daml 계약 사이의 흐름 (계획)", "Flow between the user, the operator, the synchronizer, the validator and the Daml contract (planned)")}>
            {leader}
            {/* Canton 구역 (T5) — 계획이라 전부 점선·흐림 */}
            <rect x={CANTON_FRAME.x} y={CANTON_FRAME.y} width={CANTON_FRAME.w} height={CANTON_FRAME.h} rx={14} fill="none" stroke="var(--border)" strokeWidth={1.5} strokeDasharray="8 5" />
            <text x={CANTON_FRAME.x + CANTON_FRAME.w / 2} y={CANTON_FRAME.y - 10} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--muted)">Canton Network · T5</text>
            <text x={CANTON_FRAME.x + CANTON_FRAME.w / 2} y={CANTON_FRAME.y + CANTON_FRAME.h + 16} textAnchor="middle" fontSize={11} fill="var(--muted)">{t("계획 · #5001 (T5) · 테스트넷만", "planned · #5001 (T5) · test networks only")}</text>
            <Wire a={N.cuser} b={N.operator} live={false} label={t("당사자", "party")} plan />
            <Wire a={N.operator} b={N.validator} live={false} label="" plan />
            <Wire a={N.sync} b={N.validator} live={false} label="" plan />
            <Wire a={N.validator} b={N.daml} live={false} label="" plan />

            <Box {...boxProps("cuser")} w={150} title={t("사용자", "User")} sub={status.cuser} />
            <Box {...boxProps("operator")} w={170} title={t("운영자", "Operator")} sub={status.operator} />
            <Box {...boxProps("sync")} w={170} title="Global Synchronizer" sub={status.sync} />
            <Box {...boxProps("validator")} w={170} title="Validator" sub={status.validator} contract />
            <Box {...boxProps("daml")} w={170} title={t("Daml 계약", "Daml contract")} sub={status.daml} contract />
            {bubble}
          </svg>
        </div>
      </>)}
    </div>
  );
}

function Wire({ a, b, live, label, both, at = 0.5, plan }:
  { a: Node; b: Node; live: boolean; label: string; both?: boolean; at?: number; plan?: boolean }) {
  // 라벨을 선 위 임의 지점에 둘 수 있다 — AP2 간선은 중점에 두면 에이전트의 ERC-4337 칩과 겹친다.
  const mx = a.x + (b.x - a.x) * at;
  const my = a.y + (b.y - a.y) * at;
  const color = live ? "var(--accent)" : "var(--border)";
  return (
    <g>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={live ? 2.4 : 1.5} strokeDasharray={plan ? "5 4" : undefined} style={{ transition: "stroke 300ms" }} />
      {label && <>
        <rect x={mx - label.length * 3.6 - 7} y={my - 10} width={label.length * 7.2 + 14} height={20} rx={10} fill="var(--bg)" />
        <text x={mx} y={my + 4} textAnchor="middle" fontSize={12} fontWeight={600} fill={live ? "var(--accent)" : "var(--muted)"}>{both ? `${label} ↔` : label}</text>
      </>}
    </g>
  );
}

function Box({ n, w, title, sub, live, ready, flash, onClick, contract, plan }: {
  n: Node; w: number; title: string; sub: string; live: boolean; ready: boolean;
  flash: Flash | null; onClick?: () => void; contract?: boolean; plan?: boolean;
}) {
  const h = 54;
  const cls = ["stack-box", ready && "ready", plan && "plan", flash && `flash-${flash.tone}`].filter(Boolean).join(" ");
  return (
    // flash.key 로 <g> 를 새로 그려 같은 애니메이션이 매번 다시 돈다.
    <g key={flash?.key ?? 0} className={cls} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}>
      <rect x={n.x - w / 2} y={n.y - h / 2} width={w} height={h} rx={9} fill="var(--panel)"
        stroke={live ? "var(--accent)" : "var(--border)"} strokeWidth={live ? 2.4 : 1.4}
        strokeDasharray={contract || plan ? "6 3" : undefined} style={{ transition: "stroke 300ms" }} />
      <text x={n.x} y={n.y - 4} textAnchor="middle" fontSize={13} fontWeight={600} fill={plan ? "var(--muted)" : "var(--text)"}>{title}</text>
      <text x={n.x} y={n.y + 14} textAnchor="middle" fontSize={11} fill={flash?.tone === "bad" ? "var(--red)" : ready ? "var(--accent)" : "var(--muted)"} fontWeight={ready ? 600 : 400}>{sub}</text>
    </g>
  );
}

function Chip({ x, y, text, live }: { x: number; y: number; text: string; live: boolean }) {
  const w = text.length * 6.4 + 16;
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height={20} rx={10} fill="var(--muted-surface)" stroke={live ? "var(--accent)" : "var(--border)"} />
      <text x={x} y={y + 14} textAnchor="middle" fontSize={11} fontWeight={600} fill={live ? "var(--accent)" : "var(--muted)"}>{text}</text>
    </g>
  );
}
