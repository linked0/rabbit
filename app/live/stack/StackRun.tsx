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

// **세 번째 시나리오: AiTM 중계 피싱** (jay, 2026-11-09: 모닝 리포트 11/8 Tech Note "진짜 사이트를 빌려 쓰는
// 피싱"을 "Bird view, Metaverse View, Game View 에 모두 추가"). 같은 사용자가 이번에는 공격당하는 쪽이다.
// 링크 → 프록시 → 진짜 서버 → (진짜 화면이 돌아옴) → 승인. 승인을 OTP 로 하면 프록시가 그것을 다른 거래의
// 3-D Secure 로 중계하고, 패스키로 하면 origin 이 달라 서명이 쓸모없어진다 — 이 판이 보여 주려는 것은
// "사용자가 가짜를 알아보기"가 아니라 "서버와 구조가 중계를 알아채기"다. 도메인 이름은 지어낸 예시다.
// **x402 의 뒤편: 퍼실리테이터** (jay, 2026-11-11: x402 흐름에서 퍼실리테이터가 하는 일 — "결국 DSRV가 하는 일" —
// 과 Kora, pay.sh 를 Bird View 에). 402 를 받은 에이전트가 서명해 다시 부르면 판매자는 퍼실리테이터에 verify(약속)를
// 묻고, 데이터를 주고, settle(체인 제출 · 가스 대납)한다. 솔라나라면 그 뒤에 Kora 가 fee payer 로 공동 서명한다.
// pay.sh 는 판매자 자리에 서는 게이트웨이라 서비스 제공자 칸 위의 칩으로 둔다. 셋 다 아직 돌지 않으니 표준 설명의
// runs 가 plan/named 다. 같은 날 1차 자료로 다시 맞췄다(출처는 std.ts 의 퍼실리테이터 위 주석): 헤더 이름을 v2 스펙대로
// (PAYMENT-REQUIRED · PAYMENT-SIGNATURE · PAYMENT-RESPONSE), settle 실패 갈림길 버튼, pay.sh 는 "먼저 정산하는 자기
// 퍼실리테이터", DSRV 는 퍼실리테이터라는 출처를 못 찾아 칸에서 빼고 표준 설명으로만 둔다.
type Scenario = "agentic" | "canton" | "relay";
// **①과 ②는 따로 서는 두 단계** (jay, 2026-11-13: "the step 1 and step 2 is different, independent step"). 예전에는 MetaMask
// 팝업 하나가 EIP-7702(계정에 코드 붙이기)와 ERC-7715(권한 부여)를 한꺼번에 끝냈다. 실제로는 7702 는 계정을 한 번 바꾸는
// 서명이고 아무 권한도 주지 않으며, 7715 는 사이트가 따로 보내는 요청이라 서명도 따로다. 그래서 "wallet"(① 전환)과
// "grant"(② 권한) 두 차례로 나눴다. ①을 마친 뒤 ②를 거절하면 코드는 붙은 채로 권한은 없다.
type Phase = "user" | "wallet" | "grant" | "agent" | "provider" | "facilitator" | "ap2" | "card" | "done";
type RPhase = "lure" | "relay" | "page" | "pay" | "done";
type Method = "otp" | "passkey";
type StackNode = "user" | "wallet" | "delegator" | "manager" | "agent" | "provider" | "facilitator" | "ap2" | "pg" | "network" | "issuer" | "usbank" | "corr" | "krbank" | "onramp" | "chain" | "offramp";
type CantonNode = "cuser" | "operator" | "sync" | "validator" | "daml";
type RelayNode = "ruser" | "proxy" | "site" | "other" | "guard";
type NodeId = StackNode | CantonNode | RelayNode;
type Rail = "stripe" | "swift" | "stable";
type Tone = "info" | "good" | "bad" | "chain";
type Node = { x: number; y: number };

// jay 의 손그림 배치 그대로. 좌표를 바꾸면 그림의 뜻이 바뀌므로 한 곳에 모아 둔다.
// 두 시나리오는 각자 자기 판에 그려지므로 Canton 좌표도 왼쪽 끝에서 시작한다.
const N: Record<NodeId, Node> = {
  user: { x: 430, y: 48 },
  wallet: { x: 430, y: 168 },
  delegator: { x: 142, y: 304 },
  // DelegationManager — Delegator 바로 아래 (jay, 2026-11-11: "DelegationManager도 그림에 넣어줘"). 에이전트가 부르는
  // 곳은 Delegator 가 아니라 여기다: redeemDelegations → caveat enforcer 훅 → Delegator 의 executeFromExecutor.
  manager: { x: 142, y: 446 },
  agent: { x: 430, y: 304 },
  provider: { x: 726, y: 304 },
  ap2: { x: 430, y: 446 },
  facilitator: { x: 726, y: 446 }, // 서비스 제공자 바로 아래 — 판매자가 묻는 곳 (2026-11-11)
  // **x402 대신 쓰는 다른 레일** (jay, 2026-11-13: "basic settlement steps … like with stripe" · "it starts from Service
  // provider" · "we need other entities like Stripe, Mastercard" · "international rail with Swift"). 서비스 제공자 오른쪽에
  // 세로 한 줄. 위 = 판매자 쪽(매입 PG · 수취 은행), 가운데 = 망(Mastercard · VAN · SWIFT 중계), 아래 = 내는 쪽(발급 은행 ·
  // 카드사 · 송금 은행). 고른 레일에 따라 칸 이름이 바뀐다.
  pg: { x: 970, y: 304 },
  network: { x: 970, y: 446 },
  issuer: { x: 970, y: 588 },
  // **국경을 넘는 은행 줄** (jay, 2026-11-13: "the service provider take its settlement money from other countries's banks …
  // with some international bank rails" · "My scenario is the Service provider is US company and user is a Korean" · "the Issuer
  // bank should connect the rails you created"). 미국 판매자 · 한국 사용자라 돈은 한국 → 미국으로 간다. 맨 아래 줄은
  // 한국 은행(발급 카드사 바로 아래) → 미국 정산 · 중계 은행 → 판매자의 미국 은행. 카드 레일에서는 한국 카드사가 하루치
  // 달러 정산을 이 줄로 보내고, SWIFT 레일에서는 사용자의 송금이 같은 줄을 지난다.
  krbank: { x: 970, y: 720 },
  corr: { x: 690, y: 720 },
  usbank: { x: 410, y: 720 },
  // **스테이블코인 줄** (jay, 2026-11-13: "the stable coin used in X402 should also connected banks with some bridge and block
  // chain" · "even though the bird view could be complex, you can do it"). 은행 줄 바로 아래에 나란히: 한국 은행 → 온램프 →
  // 블록체인(브리지) → 오프램프 → 미국 은행. x402 의 USDC 가 어디서 와서 어디로 내려가는지, 국경을 어디서 넘는지 보여 준다.
  onramp: { x: 970, y: 860 },
  chain: { x: 690, y: 860 },
  offramp: { x: 410, y: 860 },
  // Canton 구역 (T5)
  // 구역은 사용자보다 한 칸 내려 둔다 — 사용자에서 말풍선으로 가는 선이 구역 제목을 가로지르지 않게.
  cuser: { x: 180, y: 48 },
  operator: { x: 180, y: 270 },
  sync: { x: 440, y: 140 },
  validator: { x: 440, y: 270 },
  daml: { x: 440, y: 400 },
  // AiTM 중계 피싱 — 위 줄: 사용자 → 공격자 프록시 → 진짜 사이트. 아래 줄: 공격자의 다른 거래 · 서버의 네 신호.
  // 말풍선은 왼쪽 아래 빈자리에 뜬다.
  ruser: { x: 110, y: 90 },
  proxy: { x: 430, y: 90 },
  site: { x: 760, y: 90 },
  other: { x: 520, y: 280 },
  guard: { x: 760, y: 280 },
};
const CANTON_FRAME = { x: 343, y: 86, w: 194, h: 370 };
const FAKE = "verex-settle.example"; // 지어낸 가짜 도메인
const REAL = "verex"; // 진짜 사이트 (rpId)

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
  const [cstep, setCstep] = useState(0); // 다른 레일의 몇 번째 단계인가
  const [spent, setSpent] = useState(0);
  const [refused, setRefused] = useState(0);
  const [lastRefused, setLastRefused] = useState(false);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [log, setLog] = useState<Line[]>([]);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [rphase, setRphase] = useState<RPhase>("lure"); // 중계 피싱 판의 차례
  const [method, setMethod] = useState<Method | null>(null);
  const [rlog, setRlog] = useState<Line[]>([]); // 중계 피싱 판의 저널 — 에이전트 결제 판과 섞이지 않게 따로

  let seq = 0;
  const send = (list: Array<{ from: Node; to: Node; color: string }>) =>
    setPackets(list.map((p) => ({ ...p, id: Date.now() + seq++ })));
  // **오래된 것이 위로.** 이 페이지가 답하려는 질문이 "무슨 순서로 맞물리나"라서 역순이면 읽는 방향이 거꾸로가 된다.
  const note = (l: Line) => setLog((prev) => [...prev, l]);
  const rnote = (l: Line) => setRlog((prev) => [...prev, l]);
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
  const railName = rail === "swift" ? "SWIFT" : rail === "stable" ? t("x402 → 은행", "x402 → banks") : "Stripe";
  // 오른쪽 세로줄 = 카드망(미국 판매자의 Stripe · Mastercard · 한국 카드사). SWIFT 레일에서는 흐리게 남는다.
  const P = "Stripe";
  const M = "Mastercard";
  const I = t("한국 카드사", "Korean card issuer");
  // 한국어 조사: 받침이 있으면 이/을/으로, 없으면 가/를/로 (ㄹ 받침은 "로"). 라틴 이름은 이 판의 다른 곳처럼 띄우고 모음형.
  const josa = (w: string, withB: string, noB: string) => {
    const c = w.charCodeAt(w.length - 1);
    if (c < 0xac00 || c > 0xd7a3) return `${w} ${noB}`;
    const b = (c - 0xac00) % 28;
    if (noB === "로") return w + (b === 0 || b === 8 ? "로" : "으로");
    return w + (b ? withB : noB);
  };
  // 아래 줄 세 칸 — 레일에 따라 같은 은행 자리가 다른 역할을 한다.
  const KB = rail === "swift" || rail === "stable" ? t("사용자의 한국 은행", "User's Korean bank") : rail === "stripe" ? t("카드사의 한국 은행", "Issuer's Korean bank") : t("한국 은행", "Korean bank");
  const CB = rail === "swift" ? t("뉴욕 중계 은행", "NY correspondent bank") : rail === "stripe" ? t("미국 정산 은행", "US settlement bank") : t("뉴욕 중계 · 정산 은행", "NY correspondent / settlement");
  const UB = t("판매자의 미국 은행", "Seller's US bank");
  const nodeName = (id: NodeId) => id === "provider" ? t("서비스 제공자 (미국)", "Service provider (US)") : id === "pg" ? P : id === "network" ? M : id === "issuer" ? I
    : id === "usbank" ? UB : id === "corr" ? CB : id === "krbank" ? KB
    : id === "onramp" ? t("온램프 · 한국 거래소", "On-ramp · Korean exchange") : id === "chain" ? t("블록체인 · USDC", "Blockchain · USDC") : id === "offramp" ? t("오프램프 · Circle · Bridge", "Off-ramp · Circle · Bridge") : id;
  const cardFinal = () => note({ tone: "good", chip: t("비교", "compare"), text: t(
    "x402 는 settle 한 번에 판매자 지갑으로 들어왔고 되돌릴 수 없다. 카드는 승인은 몇 초지만 돈은 며칠 뒤에 들어오고, 몇 달 뒤에도 차지백으로 되돌려질 수 있다 — 그때 꺼내는 증거가 AP2 mandate 다.",
    "x402 landed in the seller's wallet in one settle and cannot be reversed. A card authorizes in seconds, but the money arrives days later and can be clawed back by a chargeback months on — and the AP2 mandates are the evidence pulled out then.") });
  type CStep = { node: StackNode; btn: string; say: string; run: () => void };
  // 카드 레일 — 미국 판매자, 한국 카드사가 발급한 Mastercard.
  const CARD: CStep[] = [
    { node: "provider", btn: t("Stripe 로 청구", "Charge via Stripe"),
      say: t(`미국 판매자가 Stripe 로 ${PRICE} 달러를 청구한다. 카드는 한국 카드사가 발급한 Mastercard — 에이전트가 넘긴 카드 토큰(과 AP2 Payment Mandate)으로. 판매자가 당겨 가는 결제다.`, `The US seller charges $${PRICE} through Stripe. The card is a Mastercard issued by a Korean card company — via the token the agent handed over (and the AP2 Payment Mandate). The seller pulls the money.`),
      run: () => { send([{ from: N.provider, to: N.pg, color: "var(--accent)" }]); note({ tone: "info", chip: t("카드 ① 청구", "card ① charge"), text: t(`미국 판매자 → Stripe: ${PRICE} 달러 청구 (한국 발급 카드).`, `US seller → Stripe: a $${PRICE} charge (Korean-issued card).`) }); } },
    { node: "pg", btn: t("승인 요청", "Request authorization"),
      say: t("Stripe 가 매입 쪽에서 승인 요청을 Mastercard 망에 보내고, Mastercard 가 국경을 넘어 한국 카드사로 넘긴다. 메시지만 간다.", "Stripe, on the acquiring side, sends the authorization request into the Mastercard network, which carries it across the border to the Korean issuer. Only a message moves."),
      run: () => { send([{ from: N.pg, to: N.network, color: "var(--accent)" }, { from: N.network, to: N.issuer, color: "var(--accent)" }]); note({ tone: "info", chip: t("카드 ② 승인 요청", "card ② auth request"), text: t(`Stripe → Mastercard → ${I}. 메시지만 국경을 넘었다.`, `Stripe → Mastercard → the ${I}. Only a message crossed the border.`) }); } },
    { node: "issuer", btn: t("승인", "Approve"),
      say: t(`${josa(I, "이", "가")} 한도와 사기 여부를 보고 달러로 승인한다. 카드에 hold 만 걸리고 돈은 아직 안 움직인다 — x402 의 /verify 처럼 약속이다. 사용자에게는 나중에 환율과 해외 이용 수수료를 붙여 원화로 청구한다.`, `The ${I} checks the limit and fraud and approves in dollars. Only a hold — no money moves yet, a promise like x402's /verify. The user is billed later in KRW, with the exchange rate and an overseas-use fee added.`),
      run: () => { send([{ from: N.issuer, to: N.network, color: "var(--green)" }, { from: N.network, to: N.pg, color: "var(--green)" }, { from: N.pg, to: N.provider, color: "var(--green)" }]); blink("issuer", "good"); note({ tone: "chain", chip: t("카드 ③ 승인", "card ③ approved"), text: t(`${I} 승인 · USD hold. 몇 초. 판매자는 승인만 보고 데이터를 내준다 — 돈은 아직 오지 않았다.`, `${I} approved · USD hold. Seconds. The seller delivers the data on the approval alone — the money has not arrived.`) }); } },
    { node: "network", btn: t("청산 (하루 끝)", "Clear (end of day)"),
      say: t("하루 끝, Mastercard 가 나라를 넘나든 건들을 모아 상계하고 환율과 수수료(interchange · 해외 결제 수수료)를 확정한다. 누가 누구에게 달러로 얼마를 보낼지 여기서 정해진다.", "At day's end Mastercard batches the cross-border transactions, nets them, and fixes the exchange rate and fees (interchange, cross-border fees). Who sends how many dollars to whom is decided here."),
      run: () => { blink("network", "good"); note({ tone: "info", chip: t("카드 ④ 청산", "card ④ clearing"), text: t("Mastercard 가 하루치를 모아 상계 — 환율 · 수수료 확정.", "Mastercard nets the day's batch — FX rate and fees fixed.") }); } },
    { node: "issuer", btn: t("달러 정산 송금", "Send USD settlement"),
      say: t(`${josa(I, "이", "가")} 원화로 달러를 사서 자기 한국 은행을 통해 Mastercard 의 미국 정산 은행으로 보낸다 — 은행 사이 해외 송금(SWIFT 메시지 + 뉴욕의 달러 계좌). 건별이 아니라 하루치를 한 번에 보낸다.`, `The ${I} buys dollars with KRW and sends them through its Korean bank to Mastercard's US settlement bank — a bank-to-bank cross-border transfer (a SWIFT message plus a dollar account in New York). Not per purchase: one transfer for the whole day.`),
      run: () => { send([{ from: N.issuer, to: N.krbank, color: "var(--green)" }, { from: N.krbank, to: N.corr, color: "var(--green)" }]); blink("krbank", "good"); note({ tone: "chain", chip: t("카드 ⑤ 정산 · 국경", "card ⑤ settlement · border"), text: t(`돈이 처음으로 움직였다: ${I} → 한국 은행(원화 → 달러) → 미국 정산 은행. 국경을 넘는 건 이 하루치 묶음 한 번이다.`, `Money moves for the first time: ${I} → Korean bank (KRW → USD) → US settlement bank. The border is crossed once, by this daily batch.`) }); } },
    { node: "corr", btn: t("Stripe 쪽으로 정산", "Settle to Stripe"),
      say: t("미국 정산 은행이 Mastercard 의 지시대로 매입 쪽(Stripe 의 은행)에 달러를 넣는다. 여기서부터는 미국 안이다.", "The US settlement bank credits the acquiring side (Stripe's bank) on Mastercard's instruction. From here on it is all inside the US."),
      run: () => { send([{ from: N.corr, to: N.pg, color: "var(--green)" }]); blink("corr", "good"); note({ tone: "chain", chip: t("카드 ⑥ 매입 쪽 입금", "card ⑥ acquirer credited"), text: t("미국 정산 은행 → Stripe 쪽. 수수료가 빠진 달러.", "US settlement bank → Stripe's side. Dollars, less fees.") }); } },
    { node: "pg", btn: t("판매자에게 지급", "Pay out to the seller"),
      say: t("Stripe 가 수수료(해외 카드면 더 붙는다)를 떼고 ACH 로 판매자의 미국 은행에 넣는다 — 보통 영업일 이틀 안팎.", "Stripe takes its fee (more for a foreign card) and pays the seller's US bank over ACH — typically about two business days."),
      run: () => { send([{ from: N.pg, to: N.usbank, color: "var(--green)" }, { from: N.usbank, to: N.provider, color: "var(--green)" }]); blink("provider", "good"); note({ tone: "good", chip: t("카드 ⑦ 지급", "card ⑦ payout"), text: t("Stripe → (ACH) → 판매자의 미국 은행. 며칠 뒤에야 판매자 손에 달러가 들어왔다.", "Stripe → (ACH) → the seller's US bank. Only now, days later, does the seller hold the dollars.") });
        cardFinal();
        note({ tone: "good", chip: t("비교 · 국경", "compare · border"), text: t("미국 판매자는 달러를 미국 안에서 받았다 — 국경을 넘는 일은 한국 카드사와 Mastercard 가 하루치 묶음으로 처리했다. 비용은 사용자 쪽(환율 · 해외 이용 수수료)과 판매자 쪽(해외 카드 수수료)에 나뉘어 붙는다. x402 는 한국 사용자의 지갑에서 미국 판매자의 지갑으로 한 번에 갔다 — 체인에는 국경이 없다.", "The US seller got dollars inside the US — the border crossing was done by the Korean issuer and Mastercard in a daily batch. The cost is split between the user (FX, overseas-use fee) and the seller (foreign-card fee). x402 went from the Korean user's wallet to the US seller's wallet in one step — the chain has no border.") }); } },
  ];
  // SWIFT 레일 — 한국 사용자가 미국 판매자에게 직접 해외 송금. 아래 줄을 그대로 지난다.
  const WIRE: CStep[] = [
    { node: "provider", btn: t("청구서 보내기", "Send the invoice"),
      say: t(`미국 판매자가 청구서를 보낸다 — 은행의 SWIFT 코드(BIC), 계좌번호, ${PRICE} 달러. 미국은 IBAN 을 쓰지 않는다. 계좌이체는 판매자가 당겨 가지 않고 내는 쪽이 밀어 보낸다.`, `The US seller sends an invoice — its bank's SWIFT code (BIC), the account number, $${PRICE}. The US does not use IBAN. A bank transfer is not pulled by the seller; the payer pushes it.`),
      run: () => { send([{ from: N.provider, to: N.user, color: "var(--accent)" }]); note({ tone: "info", chip: "SWIFT ①", text: t("미국 판매자 → 한국 사용자: 청구서 (BIC · 계좌번호 · 금액).", "US seller → Korean user: an invoice (BIC · account number · amount).") }); } },
    { node: "krbank", btn: t("해외 송금 신청", "Request the wire"),
      say: t("사용자가 한국 은행에 해외 송금을 신청한다. 은행은 원화를 달러로 바꾸고(환전 스프레드), 송금 사유를 확인하고, SWIFT 로 지급 메시지(MT103, 지금은 ISO 20022 pacs.008)를 보낸다. 달러는 이 은행이 뉴욕에 둔 달러 계좌(노스트로)에서 나간다. 수수료를 누가 낼지(OUR · SHA · BEN)도 메시지에 적는다.", "The user asks the Korean bank for an overseas transfer. The bank converts KRW to USD (an FX spread), checks the purpose, and sends a payment message over SWIFT (MT103, now ISO 20022 pacs.008). The dollars leave from the bank's dollar account in New York (its nostro). Who pays the fees (OUR · SHA · BEN) is in the message."),
      run: () => { send([{ from: N.user, to: N.krbank, color: "var(--accent)" }, { from: N.krbank, to: N.corr, color: "var(--accent)" }]); blink("krbank", "good"); note({ tone: "chain", chip: "SWIFT ② MT103 · pacs.008", text: t("한국 은행: 원화 → 달러 · 송금 사유 확인 → SWIFT 메시지. 메시지와 돈은 따로 간다.", "Korean bank: KRW → USD · purpose checked → SWIFT message. Message and money travel separately.") }); } },
    { node: "corr", btn: t("중계", "Relay"),
      say: t("뉴욕 중계 은행이 한국 은행의 달러 계좌에서 빼서 Fedwire · CHIPS 로 판매자의 미국 은행에 넣고, 수수료를 뗀다. 중계가 하나 더 끼면 수수료도 한 번 더. 어디쯤인지는 SWIFT gpi 의 UETR 로 본다.", "The NY correspondent debits the Korean bank's dollar account, pays the seller's US bank over Fedwire / CHIPS, and takes a fee. One more hop, one more fee. SWIFT gpi shows where it is by its UETR."),
      run: () => { send([{ from: N.corr, to: N.usbank, color: "var(--green)" }]); blink("corr", "good"); note({ tone: "chain", chip: "SWIFT ③ gpi", text: t("뉴욕 중계 은행 → (Fedwire · CHIPS) → 판매자의 미국 은행 · 중계 수수료.", "NY correspondent → (Fedwire / CHIPS) → the seller's US bank · relay fee.") }); } },
    { node: "usbank", btn: t("입금", "Credit the seller"),
      say: t("판매자의 미국 은행이 메시지와 돈을 맞춰 보고 제재(OFAC) 검사를 한 뒤 입금한다. gpi 로 같은 날 닿는 일이 많지만 검사 때문에 늦어지기도 한다.", "The seller's US bank matches the message to the funds, runs sanctions (OFAC) checks, and credits the seller. With gpi it often arrives the same day, but checks can delay it."),
      run: () => { send([{ from: N.usbank, to: N.provider, color: "var(--green)" }]); blink("provider", "good"); note({ tone: "good", chip: "SWIFT ④", text: t("판매자의 미국 은행 → 판매자 계좌 (USD).", "Seller's US bank → the seller's account (USD).") });
        note({ tone: "good", chip: t("비교", "compare"), text: t("x402 는 몇 초에 가스 몇 센트, SWIFT 는 영업일 단위에 환전 스프레드와 중계마다 수수료. 둘 다 내는 쪽이 밀어 보내는 결제라 차지백이 없고, 되돌리려면 받은 쪽의 동의가 필요하다 — 스테이블코인이 해외 송금의 대안으로 거론되는 이유다.", "x402 takes seconds and a few cents of gas; SWIFT takes business days, an FX spread and a fee per hop. Both are pushed by the payer, so there is no chargeback; reversing needs the receiver's consent — which is why stablecoins come up as a cross-border alternative.") }); } },
  ];
  // x402 를 은행까지 — 같은 2.4 달러가 원화 은행에서 출발해 체인을 지나 달러 은행에 내려앉는 길.
  const STABLE: CStep[] = [
    { node: "krbank", btn: t("원화 보내기", "Send KRW"),
      say: t("한국 사용자가 자기 은행에서 원화를 온램프(거래소 계정)로 보낸다. 국내 이체라 국경은 아직 넘지 않았다.", "The Korean user sends KRW from their bank to the on-ramp (an exchange account). A domestic transfer — no border crossed yet."),
      run: () => { send([{ from: N.user, to: N.krbank, color: "var(--accent)" }, { from: N.krbank, to: N.onramp, color: "var(--accent)" }]); blink("krbank", "good"); note({ tone: "info", chip: t("스테이블 ① 원화", "stable ① KRW"), text: t("사용자의 한국 은행 → 온램프. 국내 이체.", "User's Korean bank → on-ramp. A domestic transfer.") }); } },
    { node: "onramp", btn: t("USDC 사서 지갑으로", "Buy USDC to the wallet"),
      say: t("온램프가 원화로 USDC 를 사 주고 사용자의 지갑(이 판에서는 Delegator 계정)으로 출금한다. 여기서 처음 블록체인에 올라탄다. 원화로 어떤 스테이블코인을 살 수 있는지, 외부 지갑 출금 규칙(트래블 룰)은 거래소와 규제마다 다르다.", "The on-ramp buys USDC with the KRW and withdraws it to the user's wallet (on this board, the Delegator account). This is where the money first gets on-chain. Which stablecoins KRW can buy, and the rules for withdrawing to an outside wallet (travel rule), vary by exchange and regulation."),
      run: () => { send([{ from: N.onramp, to: N.chain, color: "var(--accent)" }, { from: N.chain, to: N.delegator, color: "var(--green)" }]); blink("onramp", "good"); note({ tone: "chain", chip: t("스테이블 ② 온램프", "stable ② on-ramp"), text: t("원화 → USDC → 사용자 지갑(Delegator 계정). 위임 한도가 쓰는 돈이 바로 이것이다.", "KRW → USDC → the user's wallet (Delegator account). This is the money the delegation's cap spends.") }); } },
    { node: "chain", btn: t("x402 정산 · 브리지", "x402 settle · bridge"),
      say: t("⑥ 에서 퍼실리테이터가 보낸 transferWithAuthorization 이 이 체인 위의 한 줄이다 — 한국 사용자의 지갑 → 미국 판매자의 지갑, 몇 초, 국경 없음. 판매자가 다른 체인에서 받고 싶으면 브리지가 잇는다: Circle 의 CCTP 는 원래 체인에서 USDC 를 태우고(burn) 저쪽 체인에서 새로 찍는다(mint).", "The transferWithAuthorization the facilitator sent at ⑥ is one line on this chain — the Korean user's wallet → the US seller's wallet, seconds, no border. If the seller wants it on another chain, a bridge connects them: Circle's CCTP burns the USDC on the source chain and mints it on the other."),
      run: () => { send([{ from: N.facilitator, to: N.chain, color: "var(--accent)" }, { from: N.chain, to: N.provider, color: "var(--green)" }]); blink("chain", "good"); note({ tone: "chain", chip: t("스테이블 ③ 체인 · 브리지", "stable ③ chain · bridge"), text: t("체인 위: 사용자 지갑 → 판매자 지갑 (x402 settle). 국경을 넘는 건 이 한 줄이다. 체인이 다르면 CCTP burn → mint.", "On-chain: user's wallet → seller's wallet (the x402 settle). This one line is the border crossing. Different chain? CCTP burn → mint.") }); } },
    { node: "offramp", btn: t("USDC → 달러", "USDC → USD"),
      say: t("판매자가 받은 USDC 를 오프램프로 보낸다 — Circle 같은 발행사에 상환(redeem)하거나, Stripe 가 인수한 Bridge 같은 곳이 받아 달러로 바꾼다. 1 USDC = 1 달러. 여기서 다시 은행 세계로 내려온다.", "The seller sends the USDC it received to an off-ramp — redeemed with an issuer like Circle, or taken by a service like Bridge (bought by Stripe) and turned into dollars. 1 USDC = 1 USD. This is where it comes back down to the banking world."),
      run: () => { send([{ from: N.provider, to: N.chain, color: "var(--accent)" }, { from: N.chain, to: N.offramp, color: "var(--accent)" }]); blink("offramp", "good"); note({ tone: "chain", chip: t("스테이블 ④ 오프램프", "stable ④ off-ramp"), text: t("판매자 지갑 → 오프램프: USDC 상환 → 달러.", "Seller's wallet → off-ramp: USDC redeemed → USD.") }); } },
    { node: "usbank", btn: t("입금", "Credit the seller"),
      say: t("오프램프가 ACH 나 Fedwire 로 판매자의 미국 은행에 달러를 넣는다. 국내 이체다 — 은행은 양쪽 끝에서 국내 이체만 했고, 국경은 체인 위에서 한 번 넘었다.", "The off-ramp pays dollars into the seller's US bank over ACH or Fedwire. A domestic transfer — the banks only did domestic transfers at each end, and the border was crossed once, on-chain."),
      run: () => { send([{ from: N.offramp, to: N.usbank, color: "var(--green)" }, { from: N.usbank, to: N.provider, color: "var(--green)" }]); blink("provider", "good"); note({ tone: "good", chip: t("스테이블 ⑤ 입금", "stable ⑤ credit"), text: t("오프램프 → (ACH · Fedwire) → 판매자의 미국 은행.", "Off-ramp → (ACH / Fedwire) → the seller's US bank.") });
        note({ tone: "good", chip: t("비교 · 국경", "compare · border"), text: t("은행 줄(SWIFT)은 노스트로 계좌로 국경을 넘고, 카드는 Mastercard 의 하루치 정산으로 넘고, 스테이블코인은 체인 위 한 줄로 넘는다. 비용은 양쪽 끝(환전 스프레드 · 온램프 · 오프램프 수수료)과 가스로 옮겨 간다. 판매자가 USDC 를 그대로 쓰면 오프램프조차 필요 없다.", "The bank rail (SWIFT) crosses the border through nostro accounts, the card crosses it in Mastercard's daily settlement, and the stablecoin crosses it in one on-chain line. The cost moves to the two ends (FX spread, on- and off-ramp fees) and gas. If the seller keeps spending USDC, it does not even need the off-ramp.") }); } },
  ];
  const CSTEPS = rail === "swift" ? WIRE : rail === "stable" ? STABLE : CARD;
  const cur = phase === "card" ? CSTEPS[cstep] : null;
  const ready: NodeId | null = phase === "done" ? null : phase === "grant" ? "wallet" : cur ? cur.node : phase === "card" ? null : (phase as NodeId); // 차례가 된 칸 = 깜빡이는 칸
  const settled = phase === "ap2" || phase === "card" || phase === "done"; // x402 정산이 끝난 뒤
  const upgraded = phase !== "user" && phase !== "wallet"; // ① 7702 로 코드가 붙음
  const granted = upgraded && phase !== "grant"; // ② 7715 권한까지 받음

  // ── 동작들: 말풍선의 버튼이 부른다. 긴 설명은 STD 에 있으니 저널은 한 줄씩이다 ───
  function userGive() {
    close(); setPhase("wallet");
    send([{ from: N.user, to: N.wallet, color: "var(--accent)" }]);
    note({ tone: "info", text: t(`주인: "에이전트에게 최대 ${CAP} jUSD, 1시간 위임." 아직 아무것도 서명되지 않았다. 지갑이 두 번, 따로 물어본다 — ① 계정 전환, ② 권한.`, `Owner: "give the agent up to ${CAP} jUSD for 1 hour." Nothing signed yet. The wallet asks twice, separately — ① account upgrade, ② permission.`) });
  }
  // ① EIP-7702 — 계정을 한 번 바꾸는 서명. 권한은 하나도 주지 않는다.
  function walletUpgrade() {
    close(); setPhase("grant");
    send([{ from: N.user, to: N.wallet, color: "var(--accent)" }]);
    blink("delegator", "good");
    note({ tone: "chain", chip: "① EIP-7702", href: "/live/7702", hrefLabel: t("7702 인스펙터", "7702 inspector"), text: t("계정에 Delegator 코드가 붙었다 — 주소·키 그대로. 아직 누구에게도 권한은 없다. 이 전환은 한 번이면 남고, 이미 전환된 계정이면 이 단계는 없다.", "The Delegator code is attached to the account — same address, same key. Nobody has any permission yet. The upgrade happens once and stays; an already-upgraded account skips this step.") });
  }
  function walletUpgradeReject() {
    close();
    note({ tone: "bad", text: t("① 거절 — 계정은 그대로 보통 EOA 다. 코드가 없으니 ②의 권한도 받을 수 없다. MetaMask 를 다시 눌러 보라.", "① Rejected — the account stays a plain EOA. Without code it cannot take ②'s permission either. Press MetaMask again.") });
  }
  // ② ERC-7715 — 사이트가 따로 보내는 권한 요청. 서명도 따로다.
  function walletGrant() {
    close(); setPhase("agent");
    send([{ from: N.wallet, to: N.delegator, color: "var(--accent)" }]);
    blink("delegator", "good");
    note({ tone: "chain", chip: "② ERC-7715 · EIP-712", href: "/live/agent/console", hrefLabel: t("정산 에이전트 콘솔", "Settlement console"), text: t(`권한 부여 — 위임 서명, caveat ≤ ${CAP} jUSD · 1h. ①과는 다른 서명이다. 이 뒤로 팝업 없음.`, `Permission granted — a delegation signature, caveat ≤ ${CAP} jUSD · 1 h. A different signature from ①. No popups after this.`) });
  }
  function walletGrantReject() {
    close();
    note({ tone: "bad", text: t("② 거절 — 코드는 붙은 채로 남고, 권한은 없다. 에이전트는 계속 잠들어 있다. ①과 ②가 따로라는 뜻이다. MetaMask 를 다시 눌러 보라.", "② Rejected — the code stays attached, with no permission. The agent stays asleep. That is what ① and ② being separate means. Press MetaMask again.") });
  }
  function agentSpend(amount: number) {
    close();
    if (amount > remaining) {
      setRefused((n) => n + 1); setLastRefused(true);
      send([{ from: N.agent, to: N.manager, color: "var(--red)" }]);
      blink("manager", "bad");
      note({ tone: "bad", chip: "ERC-7710", text: t(`${amount} jUSD 시도 → caveat enforcer 가 되돌림 (남은 한도 ${remaining.toFixed(2)}). 서명은 멀쩡했다 — 막은 것은 컨트랙트.`, `Tried ${amount} jUSD → the caveat enforcer reverted it (${remaining.toFixed(2)} left). The signature was fine — a contract stopped it.`) });
      return;
    }
    setLastRefused(false); setSpent((s) => s + amount); setPhase("provider");
    send([{ from: N.agent, to: N.manager, color: "var(--accent)" }, { from: N.manager, to: N.delegator, color: "var(--green)" }]);
    blink("manager", "good");
    note({ tone: "info", href: "/live/agent", hrefLabel: t("자율 결제 에이전트", "Autonomous agent"), text: t("에이전트가 깨어나 스스로 결정 — 뉴스 → 확률 → 호가 → 산다. 전부 오프체인.", "The agent woke and decided on its own — news → probability → order book → buy. All off-chain.") });
    note({ tone: "chain", chip: "ERC-7710 · ERC-4337", href: "/live/aa", hrefLabel: t("AA 데모", "AA demo"), text: t(`DelegationManager.redeemDelegations 통과 — 위임 서명 확인 → enforcer 가 ${amount} ≤ ${CAP} 확인 → Delegator 의 executeFromExecutor 로 jUSD 가 나감. UserOperation, 가스는 paymaster.`, `DelegationManager.redeemDelegations passed — delegation signature checked → the enforcer checked ${amount} ≤ ${CAP} → jUSD left through the Delegator's executeFromExecutor. A UserOperation; paymaster paid the gas.`) });
  }
  function providerPay() {
    close(); setPhase("facilitator");
    send([{ from: N.agent, to: N.provider, color: "var(--accent)" }]);
    blink("provider", "good");
    note({ tone: "info", chip: "x402", text: t(`402 + PAYMENT-REQUIRED → 에이전트가 ${PRICE} 짜리 transferWithAuthorization 에 EIP-712 서명(오프체인) → PAYMENT-SIGNATURE 헤더를 붙여 같은 요청 재전송. 돈은 아직 에이전트 지갑에 있다 — 판매자가 퍼실리테이터에 물을 차례.`, `402 + PAYMENT-REQUIRED → the agent signs an EIP-712 authorization for a ${PRICE} transferWithAuthorization (off-chain) → resends the same request with a PAYMENT-SIGNATURE header. The money is still in the agent's wallet — the seller asks the facilitator next.`) });
  }
  // 판매자 → 퍼실리테이터: verify(약속) → 데이터 전달 → settle(체인). 이 순서가 이 칸이 보여 주려는 것이다 —
  // 판매자는 돈이 확정되기 전에 일을 한다.
  function facilitatorSettle() {
    close(); setPhase("ap2");
    send([{ from: N.provider, to: N.facilitator, color: "var(--accent)" }, { from: N.facilitator, to: N.provider, color: "var(--green)" }]);
    blink("facilitator", "good");
    note({ tone: "chain", chip: "POST /verify", text: t("퍼실리테이터가 서명·잔액·금액·유효기간·토큰을 확인하고 시뮬레이션만 했다 → isValid: true. 체인에는 아무것도 안 썼다 — 약속일 뿐, 돈은 아직 에이전트 지갑에.", "The facilitator checked the signature, balance, amount, validity window and token, and only simulated → isValid: true. Nothing was written on-chain — a promise; the money is still in the agent's wallet.") });
    note({ tone: "info", text: t("판매자가 데이터를 만들었다 — 스펙의 기본 순서에서 정산 전에 일을 하는 쪽은 판매자다.", "The seller produced the data — in the spec's default order, the seller works before the money is settled.") });
    note({ tone: "good", chip: "POST /settle", text: t("퍼실리테이터가 transferWithAuthorization 을 체인에 보내고 가스를 냈다. 돈은 에이전트 → 제공자로 바로 갔고 퍼실리테이터는 쥐지 않았다. 판매자는 200 + PAYMENT-RESPONSE(tx 해시)로 데이터를 돌려준다.", "The facilitator sent transferWithAuthorization on-chain and paid the gas. The money went agent → provider directly; the facilitator never held it. The seller returns the data with 200 + PAYMENT-RESPONSE (the tx hash).") });
    note({ tone: "info", chip: "Solana · Kora", text: t("솔라나라면: 에이전트는 TransferChecked 에 자기 몫만 서명해 두었고, settle 때 Kora 가 fee payer 자리에 서명하면 퍼실리테이터가 RPC 로 보낸다.", "On Solana: the agent signed only its part of a TransferChecked; at settle Kora signs the fee-payer slot and the facilitator sends it through RPC.") });
  }
  // 갈림길: verify 는 통과했는데 settle 이 실패하면. 차례는 그대로 두어 다시 정상 정산을 누를 수 있다.
  function facilitatorFail() {
    close();
    send([{ from: N.provider, to: N.facilitator, color: "var(--accent)" }, { from: N.facilitator, to: N.provider, color: "var(--red)" }]);
    blink("facilitator", "bad");
    note({ tone: "bad", chip: "settle 실패", text: t("verify 는 통과했고 판매자는 이미 일을 했는데, settle 이 success: false · transaction \"\" 로 돌아왔다(그 사이 잔액이 빠졌거나 유효기간이 지남). 돈은 에이전트 지갑에 그대로다 — 일한 값을 못 받는 쪽은 판매자다. 그래서 maxTimeoutSeconds 를 짧게 두고, 정산을 먼저 하는 방식(pay.sh 처럼)도 있다.", "Verify passed and the seller already did the work, but settle came back success: false · transaction \"\" (the balance moved or the window expired meanwhile). The money is still in the agent's wallet — the seller is the one left unpaid. Hence a short maxTimeoutSeconds, and some settle first instead (as pay.sh does).") });
  }
  // **AP2 는 레일이 아니라 mandate 층이다** (jay, 2026-11-13: "fix it as you recommended"). 예전 ⑦은 x402 로 이미 낸
  // 데이터 피드를 Stripe/토스로 한 번 더 "정산"해서, 같은 구매를 두 번 내는 것처럼 보였다. 이제 ⑦은 이번 구매의
  // mandate 세 장이 판 위 어디에 있었는지 짚기만 하고 돈은 옮기지 않는다. Stripe/토스는 x402 **대신** 쓸 수 있는
  // 다른 레일로만 보여 준다 — mandate 는 같고 레일만 다르다.
  const mandateNote = () => note({ tone: "info", chip: "AP2 · mandate", text: t(
    `이번 구매의 mandate 세 장 — Intent = ② 위임(≤ ${CAP} jUSD · 1h, 집행은 enforcer), Cart = ⑤ 402 의 PAYMENT-REQUIRED(무엇을 · 얼마에 · payTo — AP2 에서는 가맹점이 서명), Payment = ⑥ 퍼실리테이터에 넘긴 서명. AP2 는 돈을 옮기지 않는다 — 분쟁 · 차지백 때 꺼내는 증거다. 이번 레일은 x402.`,
    `This purchase's three mandates — Intent = ② the delegation (≤ ${CAP} jUSD · 1 h, enforced by the enforcer), Cart = ⑤ the 402's PAYMENT-REQUIRED (what · how much · payTo — in AP2 the merchant signs it), Payment = ⑥ the signature handed to the facilitator. AP2 moves no money — it is the evidence you pull out in a dispute or chargeback. This time the rail was x402.`) });
  function ap2Record() {
    close(); setPhase("done");
    send([{ from: N.agent, to: N.ap2, color: "var(--accent)" }]);
    blink("ap2", "good");
    mandateNote();
  }
  function ap2Alt(r: Rail) {
    close(); setRail(r); setCstep(0); setPhase("card");
    send([{ from: N.agent, to: N.ap2, color: "var(--accent)" }]);
    blink("ap2", "good");
    mandateNote();
    const name = r === "swift" ? t("SWIFT 해외 송금", "a SWIFT wire") : t("Stripe 카드 결제", "a Stripe card payment");
    if (r === "stable") { note({ tone: "info", chip: t("x402 → 은행", "x402 → banks"), text: t("이번엔 대신이 아니라 x402 그 자체를 따라간다 — USDC 가 한국 은행의 원화에서 와서 미국 은행의 달러로 내려가는 길. 맨 아래 줄에서 한 칸씩.", "This time not instead of x402 but x402 itself — where the USDC comes from (KRW in a Korean bank) and where it lands (USD in a US bank). Step along the bottom row.") }); return; }
    const demo = r === "stripe" ? { href: "/live/ap2", hrefLabel: "AP2 — Stripe" } : {};
    note({ tone: "info", chip: t("다른 레일 (가정)", "another rail (suppose)"), ...demo, text: t(`가정 — 같은 구매를 x402 대신 ${name}으로 했다면 — 한국 사용자, 미국 판매자. x402 에 더해서가 아니라 대신이다. 판 오른쪽과 아래 줄에서 한 칸씩, 서비스 제공자부터.`, `Suppose the same purchase had gone over ${name} instead of x402 — instead of it, not on top of it. Korean user, US seller. Step through the right-hand column and the bottom row, starting at the service provider.`) });
  }
  // 다른 레일의 한 단계를 돌리고 다음 칸으로. 마지막 단계 뒤에 끝.
  function cardRun() {
    if (!cur) return;
    close(); cur.run();
    if (cstep + 1 >= CSTEPS.length) setPhase("done"); else setCstep(cstep + 1);
  }
  function reset() {
    setPhase("user"); close(); setRail(null); setCstep(0); setSpent(0); setRefused(0); setLastRefused(false); setPackets([]); setLog([]); setFlash(null);
    setRphase("lure"); setMethod(null); setRlog([]);
  }

  // ── 중계 피싱 판의 동작 ───────────────────────────────────────────────
  function lureOpen() {
    close(); setRphase("relay");
    send([{ from: N.ruser, to: N.proxy, color: "var(--accent)" }]);
    rnote({ tone: "info", text: t(`문자의 링크를 열었다 — ${FAKE}. 주소만 다르고, 아직 아무 일도 없다.`, `Opened the link in the text message — ${FAKE}. Only the address differs; nothing has happened yet.`) });
  }
  function proxyForward() {
    close(); setRphase("page");
    send([{ from: N.proxy, to: N.site, color: "var(--red)" }]);
    blink("proxy", "bad");
    rnote({ tone: "bad", chip: "AiTM", text: t("프록시가 요청을 그대로 진짜 서버로 넘겼다. 사용자와 TLS 하나, 진짜 서버와 TLS 하나 — 두 연결의 가운데에 앉았다.", "The proxy passed the request straight to the real server: one TLS session with the user, another with the server — sitting in the middle of both.") });
  }
  function siteRespond() {
    close(); setRphase("pay");
    send([{ from: N.site, to: N.proxy, color: "var(--green)" }, { from: N.proxy, to: N.ruser, color: "var(--green)" }]);
    blink("site", "good");
    rnote({ tone: "info", text: t("진짜 서버가 평소처럼 답했다 — 화면·금액·세션 쿠키. 사용자 화면은 100% 진짜이고, 서버 로그에는 '정상 사용자 + 낯선 IP' 뿐이다.", "The real server answered as usual — page, amount, session cookie. The user's screen is 100% real; the server log shows only 'a normal user + an unfamiliar IP'.") });
  }
  function approve(m: Method) {
    close(); setMethod(m); setRphase("done");
    if (m === "otp") {
      send([{ from: N.ruser, to: N.proxy, color: "var(--accent)" }, { from: N.proxy, to: N.other, color: "var(--red)" }]);
      blink("other", "bad");
      rnote({ tone: "bad", chip: "3-D Secure", text: t("OTP 6자리를 입력했다. 프록시가 결제 양식을 바꿔치고 그 OTP 를 같은 시각 공격자의 다른 거래에 넣었다 — 2차 인증은 '누가'만 확인했고 '어느 거래'는 묶지 않았다.", "Typed the 6-digit OTP. The proxy swapped the payment form and pushed that OTP into the attacker's other transaction at the same moment — the second factor checked who, not which transaction.") });
      rnote({ tone: "chain", chip: t("신호 ②③④", "signals ②③④"), text: t("서버가 켜 두었다면 볼 수 있던 것: TLS·세션 불일치, 같은 쿠키가 두 IP 에서, 결제 스크립트 해시 불일치. 신호일 뿐 — 막는 것은 구조다.", "What the server could have seen, had it looked: a TLS/session mismatch, one cookie from two IPs, a payment-script hash mismatch. Signals only — what blocks it is structure.") });
    } else {
      send([{ from: N.ruser, to: N.proxy, color: "var(--accent)" }, { from: N.proxy, to: N.site, color: "var(--red)" }]);
      blink("guard", "good");
      rnote({ tone: "good", chip: "WebAuthn", text: t(`패스키 서명에 지금 페이지의 origin(${FAKE})이 들어갔다. 서버가 기대한 것은 ${REAL} — 검증 실패. 프록시가 그대로 넘겨도 쓸모없는 서명이고, 사용자는 속았는데도 막혔다.`, `The passkey signature carried the current page's origin (${FAKE}). The server expected ${REAL} — verification failed. Relayed as-is, the signature is useless; the user was fooled and it still held.`) });
    }
  }

  // ── 화면의 상태 줄: 컨트랙트가 끼는 동작마다 여기 글자가 바뀐다 ──────────
  const status: Record<NodeId, string> = {
    user: phase === "user" ? t("차례 — 눌러 보세요", "your move — press") : t("주인 · EOA", "owner · EOA"),
    wallet: phase === "wallet" ? t("① 계정 전환 요청 — 눌러 보세요", "① upgrade request — press")
      : phase === "grant" ? t("② 권한 요청 — 눌러 보세요", "② permission request — press")
      : granted ? t("코드 붙음 · 권한 부여됨", "code attached · permission granted") : t("보통 EOA", "plain EOA"),
    delegator: !upgraded ? t("코드 없음", "no code") : !granted ? t("코드 붙음 · 위임 없음", "code attached · no delegation")
      : spent > 0 ? t(`사용 ${spent.toFixed(2)} / ${CAP} jUSD`, `used ${spent.toFixed(2)} / ${CAP} jUSD`)
      : t(`caveat 저장: ≤ ${CAP} jUSD · 1h`, `caveat stored: ≤ ${CAP} jUSD · 1h`),
    manager: !granted ? t("redeem 할 위임 없음", "nothing to redeem")
      : lastRefused ? t(`enforcer 가 revert (${OVER} > ${remaining.toFixed(1)})`, `enforcer reverted (${OVER} > ${remaining.toFixed(1)})`)
      : spent > 0 ? t("redeem 통과 · 상한 · 만료 확인", "redeemed · cap and expiry checked")
      : t("redeemDelegations 대기", "awaiting redeemDelegations"),
    agent: phase === "agent" ? t("깨어남 — 눌러 보세요", "awake — press") : granted ? t("지출함", "spent") : t("잠듦", "asleep"),
    provider: ready === "provider" && cur ? `${cur.btn} — ${t("눌러 보세요", "press")}` : phase === "provider" ? t("HTTP 402 — 눌러 보세요", "HTTP 402 — press") : phase === "facilitator" ? t("결제 헤더 받음 · 검증 대기", "payment header in · awaiting verify") : settled ? t("결제됨 · 데이터 전달", "paid · data delivered") : "HTTP 402",
    facilitator: phase === "facilitator" ? t("검증 요청 — 눌러 보세요", "verify request — press") : settled ? t("정산됨 · tx 해시", "settled · tx hash") : t("verify · settle (x402.org · CDP 등)", "verify · settle (e.g. x402.org, CDP)"),
    ap2: phase === "ap2" ? t("mandate 짚기 — 눌러 보세요", "check the mandates — press")
      : phase === "card" || phase === "done" ? (rail ? t(`mandate 세 장 · 비교 레일 ${railName}`, `three mandates · compared with ${railName}`) : t("mandate 세 장 · 저널 한 줄", "three mandates · one journal line"))
      : t("의도 · 장바구니 · 결제의 증거", "evidence: intent · cart · payment"),
    pg: cur?.node === "pg" ? `${cur.btn} — ${t("눌러 보세요", "press")}` : rail !== "stripe" ? t("매입 · PG (미국)", "acquirer · PG (US)")
      : phase === "done" ? t("수수료 떼고 ACH 지급", "paid out over ACH, minus fees") : cstep >= 6 ? t("정산금 도착", "settlement in") : cstep >= 2 ? t("승인 요청 보냄", "auth request sent") : cstep >= 1 ? t("청구 받음", "charge received") : t("대기", "waiting"),
    network: cur?.node === "network" ? `${cur.btn} — ${t("눌러 보세요", "press")}` : rail !== "stripe" ? t("카드 네트워크 · 국경을 넘음", "card network · crosses borders")
      : cstep >= 4 || phase === "done" ? t("청산 · 환율 · 수수료 확정", "cleared · FX and fees fixed") : cstep >= 2 ? t("승인 요청 중계", "auth relayed") : t("대기", "waiting"),
    issuer: cur?.node === "issuer" ? `${cur.btn} — ${t("눌러 보세요", "press")}` : rail !== "stripe" ? t("발급 · 사용자의 카드", "issuer · the user's card")
      : cstep >= 5 || phase === "done" ? t("달러 정산 송금함", "USD settlement sent") : cstep >= 3 ? t("승인 · USD hold", "approved · USD hold") : t("대기", "waiting"),
    krbank: cur?.node === "krbank" ? `${cur.btn} — ${t("눌러 보세요", "press")}` : !rail ? t("원화 → 달러", "KRW → USD")
      : rail === "stable" ? (cstep >= 1 || phase === "done" ? t("원화 → 온램프 (국내)", "KRW → on-ramp (domestic)") : t("대기", "waiting"))
      : (rail === "swift" ? cstep >= 2 : cstep >= 5) || phase === "done" ? t("원화 → 달러 · 송금함", "KRW → USD · sent") : t("대기", "waiting"),
    corr: cur?.node === "corr" ? `${cur.btn} — ${t("눌러 보세요", "press")}` : !rail || rail === "stable" ? t("SWIFT · 노스트로", "SWIFT · nostro")
      : (rail === "swift" ? cstep >= 3 : cstep >= 6) || phase === "done" ? (rail === "swift" ? t("Fedwire · CHIPS 로 넘김", "passed on over Fedwire / CHIPS") : t("Stripe 쪽으로 정산함", "settled to Stripe's side")) : t("대기", "waiting"),
    usbank: cur?.node === "usbank" ? `${cur.btn} — ${t("눌러 보세요", "press")}` : !rail ? t("판매자의 USD 계좌", "the seller's USD account")
      : phase === "done" ? (rail === "swift" ? t("검사 · 입금", "checked · credited") : rail === "stable" ? t("오프램프에서 입금 (국내)", "credited from the off-ramp (domestic)") : t("ACH 입금", "ACH credit")) : t("대기", "waiting"),
    onramp: cur?.node === "onramp" ? `${cur.btn} — ${t("눌러 보세요", "press")}` : rail !== "stable" ? t("원화 → USDC", "KRW → USDC")
      : cstep >= 2 || phase === "done" ? t("USDC 출금함", "USDC withdrawn") : cstep >= 1 ? t("원화 받음", "KRW in") : t("대기", "waiting"),
    chain: cur?.node === "chain" ? `${cur.btn} — ${t("눌러 보세요", "press")}` : rail !== "stable" ? t("x402 settle 이 적히는 곳", "where the x402 settle lands")
      : cstep >= 3 || phase === "done" ? t("사용자 → 판매자 · 국경 없음", "user → seller · no border") : cstep >= 2 ? t("USDC 가 사용자 지갑에", "USDC in the user's wallet") : t("대기", "waiting"),
    offramp: cur?.node === "offramp" ? `${cur.btn} — ${t("눌러 보세요", "press")}` : rail !== "stable" ? t("USDC → 달러", "USDC → USD")
      : cstep >= 4 || phase === "done" ? t("상환 · 달러로", "redeemed · to USD") : t("대기", "waiting"),
    cuser: t("계약의 당사자", "a party to the contract"),
    operator: t("Jayverse · validator 노드", "Jayverse · validator node"),
    sync: t("순서만 정함", "orders only"),
    validator: t("private ledger", "private ledger"),
    daml: t("Number 읽기 · DvP", "Number reading · DvP"),
    ruser: rphase === "lure" ? t("문자 링크 — 눌러 보세요", "a text-message link — press")
      : rphase === "pay" ? t("승인 단계 — 눌러 보세요", "approval step — press")
      : method === "otp" ? t("OTP 를 넘겨줌", "handed over the OTP") : method === "passkey" ? t("속았지만 막힘", "fooled, still blocked") : t("가짜 주소에 있음", "on the fake address"),
    proxy: rphase === "relay" ? t("요청 받음 — 눌러 보세요", "request in — press") : rphase === "lure" ? FAKE : method === "passkey" ? t("서명 중계 — 쓸모없음", "relayed a useless signature") : t("가운데에 앉음", "sitting in the middle"),
    site: rphase === "page" ? t("요청 도착 — 눌러 보세요", "request arrived — press") : method === "passkey" ? t(`origin ≠ ${REAL} → 거절`, `origin ≠ ${REAL} → rejected`) : t("해킹당하지 않음", "not hacked"),
    other: method === "otp" ? t("3DS 통과 — 돈이 나감", "3DS passed — money out") : t("공격자의 결제 대기", "the attacker's payment, waiting"),
    guard: method === "passkey" ? t("구조로 막음 (패스키)", "blocked by structure (passkey)") : method === "otp" ? t("신호만 남음 ②③④", "signals only ②③④") : t("① Origin ② 세션 ③ IP ④ SRI", "① Origin ② session ③ IP ④ SRI"),
  };
  const lit: Record<NodeId, boolean> = {
    user: phase !== "user", wallet: phase !== "user", delegator: upgraded, manager: granted, agent: granted,
    provider: phase === "facilitator" || settled, facilitator: settled, ap2: phase === "card" || phase === "done",
    pg: rail === "stripe" && (cstep >= 1 || phase === "done"), network: rail === "stripe" && (cstep >= 2 || phase === "done"), issuer: rail === "stripe" && (cstep >= 2 || phase === "done"),
    krbank: !!rail && ((rail === "swift" ? cstep >= 2 : rail === "stable" ? cstep >= 1 : cstep >= 5) || phase === "done"),
    corr: (rail === "swift" || rail === "stripe") && ((rail === "swift" ? cstep >= 2 : cstep >= 5) || phase === "done"),
    usbank: !!rail && ((rail === "swift" && cstep >= 3) || phase === "done"),
    onramp: rail === "stable" && (cstep >= 1 || phase === "done"), chain: rail === "stable" && (cstep >= 2 || phase === "done"), offramp: rail === "stable" && (cstep >= 4 || phase === "done"),
    cuser: false, operator: false, sync: false, validator: false, daml: false,
    ruser: rphase !== "lure", proxy: rphase !== "lure" && rphase !== "relay", site: rphase === "pay" || rphase === "done",
    other: method === "otp", guard: method === "passkey",
  };
  const CANTON: CantonNode[] = ["cuser", "operator", "sync", "validator", "daml"];
  // 중계 피싱 판의 차례: 링크(사용자) → 프록시 → 진짜 사이트 → 다시 사용자(승인). 신호 칸은 언제든 읽을 수 있다.
  const rready: NodeId | null = rphase === "lure" || rphase === "pay" ? "ruser" : rphase === "relay" ? "proxy" : rphase === "page" ? "site" : null;
  const RELAY: RelayNode[] = ["ruser", "proxy", "site", "other", "guard"];
  const boxProps = (id: NodeId) => {
    const isRelay = RELAY.includes(id as RelayNode);
    const turn = isRelay ? rready === id : ready === id;
    // 두 컨트랙트 칸은 차례가 없다 — 위임이 생긴 뒤로는 언제든 눌러 표준 설명을 읽을 수 있다.
    const free = CANTON.includes(id as CantonNode) || id === "guard" || (isRelay && rphase === "done") || ((id === "delegator" || id === "manager") && granted) || (["pg", "network", "issuer", "usbank", "corr", "krbank", "onramp", "chain", "offramp"].includes(id) && phase === "done" && !!rail);
    return {
      n: N[id], live: lit[id], ready: turn, flash: flash?.node === id ? flash : null,
      plan: CANTON.includes(id as CantonNode),
      onClick: turn || free ? () => open(id) : undefined,
    };
  };

  // 진행 표시줄 — 버튼이 아니라 지나온 칸의 기록이다. 누르는 곳은 판 위다.
  const steps = [
    { n: "①", label: "EIP-7702", done: upgraded }, { n: "②", label: "ERC-7715", done: granted },
    { n: "③", label: t("깨어남", "wake"), done: spent > 0 }, { n: "④", label: "ERC-7710", done: spent > 0 },
    { n: "⑤", label: "x402", done: phase === "facilitator" || settled },
    { n: "⑥", label: t("퍼실리테이터", "facilitator"), done: settled }, { n: "⑦", label: "AP2 mandate", done: phase === "card" || phase === "done" },
    ...(rail ? [{ n: "⑧", label: t(`${railName} 레일 (가정)`, `${railName} rail (suppose)`), done: phase === "done" }] : []),
  ];

  // ── 말풍선: 판 안에서, 말하는 칸 옆에 (모달은 "이질적") ─────────────────────
  // 고정 슬롯 하나(스택 구역 오른쪽 위, 모든 국면에서 비어 있는 자리)에 두고, 말하는 칸까지 선을 긋는다.
  // 아래 한계는 서비스 제공자 칸 윗변(277)이다. 표준 설명을 읽는 동안만은 그 아래로 자란다 —
  // 읽는 중에는 판을 누를 일이 없고, 스크롤되는 말풍선보다 긴 말풍선이 낫다.
  const B = view === "relay" ? { x: 16, y: 140, w: 300, h: detail ? 345 : 250 } : { x: view === "canton" ? 580 : 548, y: 18, w: 300, h: detail ? 420 : 252 };
  const leader = popup && (
    <line
      x1={Math.min(Math.max(N[popup].x, B.x), B.x + B.w)} y1={Math.min(Math.max(N[popup].y, B.y), B.y + B.h)}
      x2={N[popup].x} y2={N[popup].y} stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="3 3"
    />
  );

  // 각 말풍선의 "표준" 메뉴 — 긴 설명은 전부 여기 뒤에 있다.
  const MENU: Record<NodeId, string[]> = {
    user: ["EIP-7702"], wallet: ["EIP-7702", "ERC-7715", "EIP-712"], delegator: ["ERC-7710", "DelegationManager"], manager: ["DelegationManager", "ERC-7710"],
    agent: ["ERC-7710", "ERC-4337", "ERC-5792"], provider: ["x402", "pay.sh", "DSRV", "ERC-8004", "ERC-1271"],
    facilitator: ["Facilitator", "Kora", "x402", "DSRV"], ap2: ["AP2", "EIP-712"],
    pg: ["Card rail", "AP2"], network: ["Card rail"], issuer: ["Card rail", "SWIFT"],
    krbank: ["SWIFT", "Card rail", "Ramp"], corr: ["SWIFT", "Card rail"], usbank: ["SWIFT", "Ramp"],
    onramp: ["Ramp"], chain: ["Ramp", "x402"], offramp: ["Ramp"],
    cuser: ["Validator", "Guardrail"], operator: ["Validator", "Synchronizer", "Guardrail"],
    sync: ["Synchronizer"], validator: ["Validator", "Daml"], daml: ["Daml", "Guardrail"],
    ruser: ["AiTM", "WebAuthn"], proxy: ["AiTM", "Session"], site: ["CSP", "SRI"], other: ["3DS", "AiTM"],
    guard: ["CSP", "Session", "SRI", "WebAuthn"],
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
            {popup === "wallet" && phase === "wallet" && (<>
              <div className="stack-bubble-h"><span className="stack-fox" aria-hidden>🦊</span> MetaMask — ① {t("계정 전환", "account upgrade")}</div>
              <div className="stack-req">
                <div className="stack-req-site">{t("스마트 계정으로 전환할까요?", "Switch to a smart account?")}</div>
                <div className="stack-req-row"><span className="stack-chip">EIP-7702</span>{t("계정에 Delegator 코드 붙이기 — 주소·키 그대로", "Attach the Delegator code — address and key unchanged")}</div>
                <div className="stack-req-note">{t("한 번만 하는 전환 · 이것만으로는 아무에게도 권한이 없음 · 이미 전환된 계정이면 뜨지 않음", "A one-time upgrade · grants nobody anything by itself · not shown if the account is already upgraded")}</div>
              </div>
              <div className="stack-bubble-actions"><button onClick={walletUpgrade}>{t("전환", "Upgrade")}</button><button className="ghost" onClick={walletUpgradeReject}>{t("거절", "Reject")}</button></div>
            </>)}
            {popup === "wallet" && phase === "grant" && (<>
              <div className="stack-bubble-h"><span className="stack-fox" aria-hidden>🦊</span> MetaMask — ② {t("권한 요청", "permission request")}</div>
              <div className="stack-req">
                <div className="stack-req-site">jaylabs.xyz {t("가 요청합니다", "requests")}</div>
                <div className="stack-req-row"><span className="stack-chip">ERC-7715</span>{t(`권한: ≤ ${CAP} jUSD · 1시간 · 에이전트에게`, `Permission: ≤ ${CAP} jUSD · 1 hour · to the agent`)}</div>
                <div className="stack-req-note">{t("①과 다른 서명 · 이후 팝업 없음 · 한도는 컨트랙트가 집행", "A separate signature from ① · no popups after · the cap is enforced by a contract")}</div>
              </div>
              <div className="stack-bubble-actions"><button onClick={walletGrant}>{t("동의", "Confirm")}</button><button className="ghost" onClick={walletGrantReject}>{t("거절", "Reject")}</button></div>
            </>)}
            {popup === "delegator" && (<>
              <div className="stack-bubble-h">{t("Delegator 컨트랙트", "Delegator contract")}</div>
              <p>{status.delegator}</p>
              <p>{t("돈이 실제로 나가는 계정이다. 에이전트가 직접 부르지 않는다 — DelegationManager 가 검사를 마친 뒤 executeFromExecutor 로 이 계정을 움직인다.", "The account the money actually leaves. The agent never calls it directly — the DelegationManager moves it through executeFromExecutor once its checks pass.")}</p>
            </>)}
            {popup === "manager" && (<>
              <div className="stack-bubble-h">DelegationManager</div>
              <p>{status.manager}</p>
              <p>{t("에이전트가 부르는 단 하나의 컨트랙트. redeemDelegations 가 위임 서명을 확인하고, caveat enforcer(상한 · 만료)의 훅을 부르고, 통과하면 Delegator 의 executeFromExecutor 로 전송을 실행한다. 한도를 넘으면 여기서 revert 된다.", "The one contract the agent calls. redeemDelegations checks the delegation signature, runs the caveat enforcers' hooks (cap, expiry) and, if they pass, executes the transfer through the Delegator's executeFromExecutor. Past the cap, it reverts here.")}</p>
            </>)}
            {popup === "agent" && (<>
              <div className="stack-bubble-h">{t("에이전트 — 틱", "Agent — tick")}</div>
              <p>{t(`타이머가 울렸다. 뉴스 3건 → 모델 확률 0.62 → 호가 0.55 → 데이터 피드를 사기로 결정 (${PRICE} jUSD). 남은 한도 ${remaining.toFixed(2)} jUSD.`, `The timer fired. 3 news items → model probability 0.62 → order book 0.55 → decision: buy the data feed (${PRICE} jUSD). ${remaining.toFixed(2)} jUSD left.`)}</p>
              <div className="stack-bubble-actions">
                <button onClick={() => agentSpend(PRICE)}>{t(`제공자에게서 구매 (${PRICE} jUSD)`, `Buy from provider (${PRICE} jUSD)`)}</button>
                <button onClick={() => agentSpend(OVER)} style={{ background: "var(--red)", borderColor: "var(--red)", color: "#fff" }}>{t(`${OVER} jUSD 로 사 보기 (한도 초과)`, `Try ${OVER} jUSD (over the cap)`)}</button>
              </div>
            </>)}
            {cur && popup === cur.node && (<>
              <div className="stack-bubble-h">{nodeName(popup)} · {t(`${railName} 레일`, `${railName} rail`)} {cstep + 1}/{CSTEPS.length}</div>
              <p>{cur.say}</p>
              <div className="stack-bubble-actions"><button onClick={cardRun}>{cur.btn}</button></div>
            </>)}
            {["pg", "network", "issuer", "usbank", "corr", "krbank", "onramp", "chain", "offramp"].includes(popup) && !cur && (<>
              <div className="stack-bubble-h">{nodeName(popup)}</div>
              <p>{status[popup]}</p>
            </>)}
            {popup === "provider" && !cur && (<>
              <div className="stack-bubble-h">{t("서비스 제공자", "Service provider")}</div>
              <pre className="stack-402">{`HTTP/1.1 402 Payment Required\nPAYMENT-REQUIRED: eyJ4NDAy… (base64)\n accepts[0]: "exact" · ${PRICE} jUSD\n  payTo 0xFEED…CAFE · 60s`}</pre>
              <div className="stack-bubble-actions"><button onClick={providerPay}>{t("서명하고 다시 요청 (PAYMENT-SIGNATURE)", "Sign and retry (PAYMENT-SIGNATURE)")}</button></div>
            </>)}
            {popup === "facilitator" && (<>
              <div className="stack-bubble-h">{t("퍼실리테이터 — x402.org · Coinbase CDP 같은 곳", "Facilitator — e.g. x402.org, Coinbase CDP")}</div>
              <p>{phase === "facilitator"
                ? t("판매자가 PAYMENT-SIGNATURE 를 들고 왔다. 순서는 POST /verify(체인에 안 씀 — 약속) → 판매자가 일함 → POST /settle(체인 제출, 가스는 여기서). 돈은 여기를 거치지 않는다.", "The seller brought the PAYMENT-SIGNATURE. The order: POST /verify (writes nothing on-chain — a promise) → the seller works → POST /settle (submit on-chain; the gas is paid here). The money never passes through here.")
                : t("x402 결제를 검증하고 체인에 정산하는 곳. 돈은 쥐지 않고 가스를 대신 낸다. 솔라나라면 뒤에서 Kora 가 fee payer 로 서명한다.", "Verifies an x402 payment and settles it on-chain. Holds no money, pays the gas. On Solana, Kora signs behind it as fee payer.")}</p>
              {phase === "facilitator" && <div className="stack-bubble-actions"><button onClick={facilitatorSettle}>{t("검증하고 정산", "Verify and settle")}</button><button onClick={facilitatorFail} style={{ background: "var(--red)", borderColor: "var(--red)", color: "#fff" }}>{t("settle 이 실패하면?", "What if settle fails?")}</button></div>}
            </>)}
            {popup === "ap2" && (<>
              <div className="stack-bubble-h">{t("AP2 — mandate 층", "AP2 — mandate layer")}</div>
              <p>{phase === "ap2"
                ? t("돈을 옮기는 칸이 아니다. 이번 구매에서 Intent = ② 위임, Cart = ⑤ 402, Payment = ⑥ 서명. 레일은 x402 였다. 다른 레일이었다면? 판 오른쪽과 아래 줄에서 따라가 본다.", "Not a box that moves money. In this purchase: Intent = ② the delegation, Cart = ⑤ the 402, Payment = ⑥ the signature. The rail was x402. What if it were another rail? Follow it on the right-hand column and the bottom row.")
                : status.ap2}</p>
              {phase === "ap2" && <div className="stack-bubble-actions">
                <button onClick={ap2Record}>{t("mandate 짚기", "Check mandates")}</button>
                <button className="ghost" onClick={() => ap2Alt("stripe")}>{t("Stripe 였다면", "If Stripe")}</button>
                <button className="ghost" onClick={() => ap2Alt("swift")}>{t("SWIFT 였다면", "If SWIFT")}</button>
                <button className="ghost" onClick={() => ap2Alt("stable")}>{t("x402 를 은행까지", "x402 to the banks")}</button>
              </div>}
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
            {popup === "ruser" && rphase === "lure" && (<>
              <div className="stack-bubble-h">{t("사용자 — 문자 한 통", "User — one text message")}</div>
              <div className="stack-req">
                <div className="stack-req-site">{t("[Verex] 정산 보류 — 24시간 안에 확인하세요", "[Verex] Settlement on hold — confirm within 24 hours")}</div>
                <div className="stack-req-row"><span className="stack-chip">{t("링크", "link")}</span>https://{FAKE}/settle</div>
                <div className="stack-req-note">{t("가짜 도메인은 지어낸 예시다.", "The fake domain is a made-up example.")}</div>
              </div>
              <div className="stack-bubble-actions"><button onClick={lureOpen}>{t("링크 열기", "Open the link")}</button></div>
            </>)}
            {popup === "ruser" && rphase === "pay" && (<>
              <div className="stack-bubble-h">{t("정산 승인", "Approve the settlement")}</div>
              <p>{t("화면은 진짜 Verex 그대로다 — 금액도, 내 이름도 맞다. 주소창만 다르다. 어떻게 승인할까?", "The screen is the real Verex — the amount and your name are right. Only the address bar differs. How do you approve?")}</p>
              <div className="stack-bubble-actions">
                <button onClick={() => approve("otp")} style={{ background: "var(--red)", borderColor: "var(--red)", color: "#fff" }}>{t("OTP 6자리 입력", "Type the 6-digit OTP")}</button>
                <button onClick={() => approve("passkey")}>{t("패스키로 승인", "Approve with a passkey")}</button>
              </div>
            </>)}
            {popup === "ruser" && rphase !== "lure" && rphase !== "pay" && (<>
              <div className="stack-bubble-h">{t("사용자", "User")}</div>
              <p>{t("에이전트 결제 판의 그 주인과 같은 사람이다. 이번 판에서는 공격당하는 쪽 — 그리고 이 판은 그가 가짜를 알아보리라고 기대하지 않는다.", "The same person who owns the agent on the agentic board. On this board, the target — and this board does not count on them spotting the fake.")}</p>
            </>)}
            {popup === "proxy" && (<>
              <div className="stack-bubble-h">{t("공격자 도메인 — 리버스 프록시", "Attacker's domain — reverse proxy")}</div>
              <p>{t(`${FAKE} 는 페이지를 만들지 않는다. 받은 요청을 진짜 서버로 넘기고, 돌아온 응답을 그대로 돌려준다. 결제 단계에서만 양식을 바꾸거나 스크립트를 넣는다.`, `${FAKE} builds no pages. It forwards each request to the real server and returns the response unchanged, swapping the form or injecting a script only at the payment step.`)}</p>
              {rphase === "relay" && <div className="stack-bubble-actions"><button onClick={proxyForward} style={{ background: "var(--red)", borderColor: "var(--red)", color: "#fff" }}>{t("진짜 서버로 넘기기", "Forward to the real server")}</button></div>}
            </>)}
            {popup === "site" && (<>
              <div className="stack-bubble-h">{t("진짜 사이트 — Verex 정산 페이지", "The real site — Verex settlement page")}</div>
              <p>{t("해킹당하지 않았다. 평소처럼 응답할 뿐이다 — 그래서 로그에는 '정상 사용자 + 낯선 IP(프록시)'만 남는다.", "It was never hacked. It just answers as usual — so its log shows only 'a normal user + an unfamiliar IP (the proxy)'.")}</p>
              {rphase === "page" && <div className="stack-bubble-actions"><button onClick={siteRespond}>{t("평소처럼 응답", "Answer as usual")}</button></div>}
            </>)}
            {popup === "other" && (<>
              <div className="stack-bubble-h">{t("공격자의 다른 거래 — 3-D Secure", "The attacker's other transaction — 3-D Secure")}</div>
              <p>{method === "otp"
                ? t("같은 시각에 공격자가 연 결제다. 사용자가 자기 거래에 넣었다고 믿은 OTP 가 여기서 쓰였다.", "A payment the attacker opened at the same moment. The OTP the user thought was for their own transaction was used here.")
                : t("공격자는 같은 시각에 다른 결제를 열어 두고, 사용자의 2차 인증이 중계되어 오기를 기다린다.", "The attacker keeps another payment open at the same moment and waits for the user's second factor to be relayed in.")}</p>
            </>)}
            {popup === "guard" && (<>
              <div className="stack-bubble-h">{t("서버가 중계를 알아채는 네 신호", "Four signals the server can use to catch the relay")}</div>
              <p>{t("① 내 도메인이 아닌 Origin 의 POST (CSP form-action) ② TLS 세션과 앱 세션의 불일치 ③ 같은 쿠키가 짧은 시간에 두 IP 에서 ④ 결제 스크립트 해시(SRI) 불일치. 앞의 넷은 신호이고, 패스키(WebAuthn)만 구조로 막는다.", "① A POST whose Origin is not my domain (CSP form-action) ② the TLS session and the app session do not match ③ one cookie from two IPs within minutes ④ the payment script's hash (SRI) does not match. These four are signals; only a passkey (WebAuthn) blocks it by structure.")}</p>
            </>)}
            <StdMenu id={popup} />
          </>
        )}
      </div>
    </foreignObject>
  );

  // 지도의 네모를 누르면 그 시나리오가 펼쳐진다. 열린 것을 다시 누르면 접힌다.
  const pick = (v: Scenario) => { close(); setPackets([]); setView((cur) => (cur === v ? null : v)); };
  const svgStyle = { width: "100%", maxWidth: 1100, minWidth: 700, height: "auto", display: "block" } as const;

  return (
    <div className="stack-board" style={{ marginTop: 16 }}>
      {/* ── 지도: 시나리오들이 사용자 하나를 사이에 두고 이어진다 ─────────── */}
      {/* 위 줄은 사용자가 쓰는 두 시나리오, 사용자 아래로 내려온 선 끝은 사용자가 공격당하는 시나리오다. */}
      <div className="stack-map-wrap">
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
      <span className="stack-map-vwire" aria-hidden />
      <button className={`stack-map-box threat${view === "relay" ? " on" : ""}`} aria-expanded={view === "relay"} onClick={() => pick("relay")}>
        <b>{t("AiTM 중계 피싱 시나리오", "AiTM relay-phishing scenario")}</b>
        <span>{t("진짜 화면 · OTP 중계 · 패스키가 막는다", "a real screen · a relayed OTP · a passkey blocks it")}</span>
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
            ? t(`끝 — ${PRICE} jUSD 가 x402 로 정산됐고${rail ? ` (${railName} 레일과 비교)` : ""} ${refused ? `${refused}번의 초과 시도가 컨트랙트에서 막혔습니다. 초기화하고 이번엔 거절 없이 돌려 보세요.` : "한 번도 거절되지 않았습니다. 초기화하고 이번엔 한도를 넘겨 보세요."}`,
                `Done — ${PRICE} jUSD settled via x402${rail ? ` (compared with ${railName})` : ""}, ${refused ? `${refused} overspend attempt${refused > 1 ? "s" : ""} stopped by the contract. Reset and run it clean this time.` : "nothing refused. Reset and try breaking the cap this time."}`)
            : t("깜빡이는 칸을 누르세요. 말풍선의 '표준' 버튼이 그 칸에 걸린 표준의 설명을 엽니다.",
                "Press the blinking box. A bubble's 'standards' buttons open the explanation of each standard on that box.")}
        </p>

        {/* ── HUD: 위임 한도가 이 게임의 체력 바다 ───────────────── */}
        <div className="stack-hud">
          <div><div className="stack-hud-k">{t("위임 한도", "Mandate")}</div><div className="stack-hud-v">{spent.toFixed(2)} / {CAP.toFixed(2)} jUSD</div><div className="stack-bar" aria-hidden><span style={{ width: `${(spent / CAP) * 100}%` }} /></div></div>
          <div><div className="stack-hud-k">{t("차례", "Turn")}</div><div className="stack-hud-v">{phase === "done" ? t("완료", "done") : { user: t("사용자", "User"), wallet: "MetaMask ①", grant: "MetaMask ②", agent: t("에이전트", "Agent"), provider: t("서비스 제공자", "Provider"), facilitator: t("퍼실리테이터", "Facilitator"), ap2: "AP2", card: cur ? nodeName(cur.node) : "" }[phase]}</div></div>
          <div><div className="stack-hud-k">{t("거절된 시도", "Refused")}</div><div className="stack-hud-v" style={refused ? { color: "var(--red)" } : undefined}>{refused}</div></div>
          <div><div className="stack-hud-k">{t("에이전트의 ETH", "Agent's ETH")}</div><div className="stack-hud-v">0 <span className="sub" style={{ fontSize: 12, fontWeight: 400 }}>({t("가스는 paymaster", "paymaster pays gas")})</span></div></div>
        </div>

        {/* ── 판 ───────────────────────────────────────────────── */}
        {/* 폰에서 줄이면 글자가 5px 이 되므로, 읽을 수 있는 크기를 지키고 가로 스크롤을 준다. */}
        <div style={{ overflowX: "auto", marginTop: 14 }}>
          <svg viewBox="0 14 1070 910" style={svgStyle} role="img"
            aria-label={t("사용자, MetaMask, Delegator 컨트랙트, DelegationManager, 에이전트, 서비스 제공자, 퍼실리테이터, AP2, 그리고 x402 대신 쓰는 카드 · SWIFT 레일 사이의 흐름", "Flow between the user, MetaMask, the delegator contract, the DelegationManager, the agent, the service provider, the facilitator, AP2, and the card and SWIFT rails used instead of x402")}>
            {/* 말풍선 연결선은 칸 아래에 깔리게 먼저 그린다 — 끝이 칸에 가려져 모서리 계산이 필요 없다. */}
            {leader}
            {/* ①과 ②는 따로 켜진다: ① 주인의 EOA 가 7702 권한서명으로 계정을 전환, ② 사이트의 7715 요청에 위임을 서명. */}
            {/* 사용자 ↔ 서비스 제공자 (jay, 2026-11-13: "User and Service Provider should also be connected"). 실제 손님은 사용자다 —
                x402 에서는 에이전트를 통해 사고, 카드 레일에서는 카드 주인, SWIFT 에서는 송금하는 쪽. 먼저 그려 칩이 위에 덮이게 한다. */}
            <Wire a={N.user} b={N.provider} live={phase === "facilitator" || settled} label={rail === "stripe" ? t("카드 주인", "cardholder") : rail === "swift" ? t("송금인", "remitter") : t("고객", "customer")} at={0.3} />
            <Wire a={N.user} b={N.wallet} live={upgraded} label="① EIP-7702" />
            <Wire a={N.wallet} b={N.delegator} live={granted} label="② ERC-7715" />
            {/* 에이전트 → DelegationManager(redeemDelegations) → Delegator(executeFromExecutor). 에이전트와 Delegator 사이에 직접 선은 없다. */}
            <Wire a={N.agent} b={N.manager} live={spent > 0 || lastRefused} label="ERC-7710" at={0.6} />
            <Wire a={N.manager} b={N.delegator} live={spent > 0} label="executeFromExecutor" />
            <Wire a={N.agent} b={N.provider} live={phase === "facilitator" || settled} label="x402" />
            <Wire a={N.provider} b={N.facilitator} live={settled} label="verify · settle" both at={0.62} />
            <Wire a={N.agent} b={N.ap2} live={phase === "card" || phase === "done"} label="mandate" both at={0.66} />
            {/* 카드망(오른쪽 세로줄) — Stripe 레일에서만 켜진다. 위에서 아래로 판매자 쪽 → 망 → 한국 카드사. */}
            <Wire a={N.provider} b={N.pg} live={lit.pg} label="" plan={rail !== "stripe"} />
            <Wire a={N.pg} b={N.network} live={lit.network} label="" plan={rail !== "stripe"} />
            <Wire a={N.network} b={N.issuer} live={lit.issuer} label="" plan={rail !== "stripe"} />
            {/* 국경을 넘는 은행 줄(맨 아래) — 한국 카드사가 바로 위에서 이어진다. */}
            <Wire a={N.issuer} b={N.krbank} live={rail === "stripe" && lit.krbank} label={t("달러 정산", "USD settlement")} plan={rail !== "stripe"} />
            <Wire a={N.krbank} b={N.corr} live={lit.corr} label={t("SWIFT · 노스트로", "SWIFT · nostro")} plan={!rail} />
            <Wire a={N.corr} b={N.usbank} live={rail === "swift" && lit.usbank} label="Fedwire · CHIPS" plan={rail !== "swift"} />
            {/* 스테이블코인 줄 — 은행 줄과 나란히. 양 끝은 은행(국내 이체), 국경은 가운데 체인에서 넘는다. */}
            <Wire a={N.krbank} b={N.onramp} live={lit.onramp} label={t("원화", "KRW")} plan={rail !== "stable"} />
            <Wire a={N.onramp} b={N.chain} live={lit.chain} label={t("USDC 출금", "USDC out")} plan={rail !== "stable"} />
            <Wire a={N.chain} b={N.offramp} live={lit.offramp} label={t("USDC 상환", "USDC redeem")} plan={rail !== "stable"} />
            <Wire a={N.offramp} b={N.usbank} live={rail === "stable" && phase === "done"} label="ACH · Fedwire" plan={rail !== "stable"} />

            <Box {...boxProps("user")} w={150} title={t("사용자", "User")} sub={status.user} />
            <Box {...boxProps("wallet")} w={180} title="MetaMask" sub={status.wallet} />
            <Box {...boxProps("delegator")} w={196} title={t("Delegator 컨트랙트", "Delegator contract")} sub={status.delegator} contract />
            <Box {...boxProps("manager")} w={196} title="DelegationManager" sub={status.manager} contract />
            <Box {...boxProps("agent")} w={170} title={t("에이전트", "Agent")} sub={status.agent} />
            <Box {...boxProps("provider")} w={180} title={t("서비스 제공자", "Service provider")} sub={status.provider} />
            <Box {...boxProps("ap2")} w={210} title={t("AP2 · mandate 층", "AP2 · mandate layer")} sub={status.ap2} />
            <Box {...boxProps("facilitator")} w={200} title={t("퍼실리테이터", "Facilitator")} sub={status.facilitator} />
            <Box {...boxProps("pg")} w={170} title={P} sub={status.pg} plan={rail !== "stripe"} />
            <Box {...boxProps("network")} w={170} title={M} sub={status.network} plan={rail !== "stripe"} />
            <Box {...boxProps("issuer")} w={170} title={I} sub={status.issuer} plan={rail !== "stripe"} />
            <Chip x={N.pg.x} y={N.pg.y - 66} text={t("카드 레일 — Stripe · Mastercard", "card rail — Stripe · Mastercard")} live={rail === "stripe"} />
            <Box {...boxProps("krbank")} w={180} title={KB} sub={status.krbank} plan={!rail} />
            <Box {...boxProps("corr")} w={180} title={CB} sub={status.corr} plan={!rail} />
            {/* 판매자의 미국 은행은 세 레일이 모두 끝나는 곳이라 점선 없이 늘 실선 (jay, 2026-11-13: "use line for that box not a dotted line"). */}
            <Box {...boxProps("usbank")} w={180} title={UB} sub={status.usbank} />
            <Chip x={N.corr.x} y={N.corr.y - 66} text={t("국경을 넘는 은행 줄 — 한국 → 미국 (USD)", "cross-border bank rail — Korea → US (USD)")} live={rail === "swift" || rail === "stripe"} />
            <Box {...boxProps("onramp")} w={180} title={nodeName("onramp")} sub={status.onramp} plan={rail !== "stable"} />
            <Box {...boxProps("chain")} w={180} title={nodeName("chain")} sub={status.chain} plan={rail !== "stable"} />
            <Box {...boxProps("offramp")} w={180} title={nodeName("offramp")} sub={status.offramp} plan={rail !== "stable"} />
            <Chip x={N.chain.x} y={N.chain.y + 34} text={t("브리지 — 체인이 다르면 CCTP burn → mint", "bridge — another chain? CCTP burn → mint")} live={rail === "stable" && (cstep >= 3 || phase === "done")} />

            {/* ERC-4337 은 간선이 아니라 에이전트가 트랜잭션을 내보내는 방식이라, 노드에 붙인 칩으로 둔다. */}
            <Chip x={N.agent.x} y={N.agent.y + 44} text="ERC-4337 · UserOp · paymaster" live={spent > 0} />
            {/* ERC-8004 은 이 판에서 유일하게 **안 도는** 조각이다 — 자리를 비워 두는 대신 흐릿하게 그려 둔다. */}
            <Chip x={N.provider.x} y={N.provider.y + 44} text={t("ERC-8004 · 에이전트 신원 (설명만)", "ERC-8004 · agent identity (explainer)")} live={false} />
            {/* pay.sh 는 판매자 자리에 서면서 스스로 정산하는 게이트웨이, Kora 는 솔라나 퍼실리테이터 뒤의 서명기 — 둘 다 여기서는 이름만이라 흐린 칩.
                DSRV 는 퍼실리테이터라는 출처를 못 찾아 칩으로 그리지 않는다 — 서비스 제공자 · 퍼실리테이터 말풍선의 표준 설명에만 둔다. */}
            <Chip x={N.provider.x} y={N.provider.y - 53} text={t("pay.sh · 먼저 정산하는 게이트웨이 (이름만)", "pay.sh · settle-first gateway (named only)")} live={false} />
            <Chip x={N.facilitator.x} y={N.facilitator.y + 44} text={t("Kora · 솔라나 fee payer 서명기 (이름만)", "Kora · Solana fee-payer signer (named only)")} live={false} />

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

      {view === "relay" && (<>
        {/* ── 진행 + 초기화 ───────────────────────────────────────── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 18 }}>
          {[
            { n: "①", label: t("링크", "link"), done: rphase !== "lure" },
            { n: "②", label: t("중계", "relay"), done: rphase === "pay" || rphase === "done" || rphase === "page" },
            { n: "③", label: t("진짜 화면", "real page"), done: rphase === "pay" || rphase === "done" },
            { n: "④", label: t("승인", "approve"), done: rphase === "done" },
            { n: "⑤", label: method === "passkey" ? t("막힘", "blocked") : method === "otp" ? t("털림", "stolen") : t("결과", "result"), done: rphase === "done" },
          ].map((s) => <span key={s.n} className={`stack-step${s.done ? " done" : ""}`}>{s.n} {s.label}</span>)}
          <button className="ghost" onClick={reset} style={{ marginLeft: "auto" }}>{t("초기화", "Reset")}</button>
        </div>
        <p className="sub" style={{ fontSize: 13, marginTop: 8 }}>
          {rphase === "done"
            ? method === "otp"
              ? t("털렸습니다 — 사용자는 아무것도 잘못 보지 않았습니다. 초기화하고 이번엔 패스키로 승인해 보세요.", "Stolen — and the user saw nothing wrong. Reset and approve with a passkey this time.")
              : t("막혔습니다 — 사용자는 속았는데도요. 초기화하고 OTP 로 하면 어떻게 되는지 보세요.", "Blocked — even though the user was fooled. Reset and see what an OTP does.")
            : t("깜빡이는 칸을 누르세요. 오른쪽 아래 '네 신호' 칸은 언제든 읽을 수 있습니다.", "Press the blinking box. The 'four signals' box at the bottom right can be read at any time.")}
        </p>

        {/* ── HUD ─────────────────────────────────────────────────── */}
        <div className="stack-hud">
          <div><div className="stack-hud-k">{t("주소창", "Address bar")}</div><div className="stack-hud-v" style={{ fontSize: 13 }}>{rphase === "lure" ? "—" : FAKE}</div></div>
          <div><div className="stack-hud-k">{t("승인 방식", "Approval")}</div><div className="stack-hud-v">{method === "otp" ? "OTP" : method === "passkey" ? t("패스키", "passkey") : "—"}</div></div>
          <div><div className="stack-hud-k">{t("결과", "Outcome")}</div><div className="stack-hud-v" style={method === "otp" ? { color: "var(--red)" } : method === "passkey" ? { color: "var(--green)" } : undefined}>{method === "otp" ? t("다른 거래로 돈이 나감", "money out via another transaction") : method === "passkey" ? t("서명 거절 · 돈 그대로", "signature rejected · money stays") : t("진행 중", "in progress")}</div></div>
        </div>

        <div style={{ overflowX: "auto", marginTop: 14 }}>
          <svg viewBox="0 14 880 476" style={svgStyle} role="img"
            aria-label={t("사용자, 공격자 프록시, 진짜 사이트, 공격자의 다른 거래, 서버의 네 신호 사이의 흐름", "Flow between the user, the attacker's proxy, the real site, the attacker's other transaction and the server's four signals")}>
            {leader}
            <Wire a={N.ruser} b={N.proxy} live={rphase !== "lure"} label={t("TLS ① 가짜 주소", "TLS ① fake address")} />
            <Wire a={N.proxy} b={N.site} live={rphase !== "lure" && rphase !== "relay"} label={t("TLS ② 진짜 서버", "TLS ② real server")} />
            <Wire a={N.proxy} b={N.other} live={method === "otp"} label={t("OTP 중계", "OTP relay")} />
            <Wire a={N.site} b={N.guard} live={method !== null} label={t("검사", "checks")} />

            <Box {...boxProps("ruser")} w={170} title={t("사용자", "User")} sub={status.ruser} />
            <Box {...boxProps("proxy")} w={210} title={t("공격자 프록시", "Attacker's proxy")} sub={status.proxy} />
            <Box {...boxProps("site")} w={190} title={t("진짜 사이트 · Verex", "Real site · Verex")} sub={status.site} />
            <Box {...boxProps("other")} w={200} title={t("공격자의 다른 거래", "Attacker's other payment")} sub={status.other} />
            <Box {...boxProps("guard")} w={200} title={t("서버의 네 신호", "Server's four signals")} sub={status.guard} contract />
            <Chip x={N.guard.x} y={N.guard.y + 44} text={t("패스키(WebAuthn)만 구조로 막는다", "only a passkey (WebAuthn) blocks by structure")} live={method === "passkey"} />

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

        <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
          {rlog.length === 0 && <p className="sub" style={{ fontSize: 13 }}>{t("각본입니다 — 네트워크도, 진짜 OTP 도 없습니다. 출처: 모닝 리포트 11/8 Tech Note (InfoHawk 보고서 원문 미열람, 도구·역사·네 신호는 일반 지식).", "Scripted — no network, no real OTP. Source: the 11/8 morning-report Tech Note (InfoHawk report not opened; tools, history and the four signals are general knowledge).")}</p>}
          {rlog.map((l, i) => (
            <div key={i} style={{ fontSize: 13, paddingLeft: 10, borderLeft: `3px solid ${l.tone === "bad" ? "var(--red)" : l.tone === "good" ? "var(--green)" : l.tone === "chain" ? "var(--accent)" : "var(--border)"}` }}>
              {l.chip && <span className="stack-chip">{l.chip}</span>}
              {l.text}
            </div>
          ))}
        </div>
      </>)}
    </div>
  );
}

// 글자 폭 어림: 한글은 글자 크기만큼, 라틴 문자는 그 0.6배쯤. 한글 라벨이 칩 밖으로 넘치지 않게 한다.
const textW = (s: string, size: number) => [...s].reduce((w, ch) => w + (/[\u3131-\uD79D]/.test(ch) ? size : size * 0.6), 0);

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
        <rect x={mx - textW(both ? `${label} ↔` : label, 12) / 2 - 7} y={my - 10} width={textW(both ? `${label} ↔` : label, 12) + 14} height={20} rx={10} fill="var(--bg)" />
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
  const w = textW(text, 11) + 16;
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height={20} rx={10} fill="var(--muted-surface)" stroke={live ? "var(--accent)" : "var(--border)"} />
      <text x={x} y={y + 14} textAnchor="middle" fontSize={11} fontWeight={600} fill={live ? "var(--accent)" : "var(--muted)"}>{text}</text>
    </g>
  );
}
