"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Lang } from "@/lib/i18n";
import { CAP, PRICE, STD, type Txt } from "../stack/std";

// Metaverse View (jay, 2026-11-03: "one more menu Metaverse View that is a game view … I click a one
// scenario box, it's bloated and pops up the related component … the Metaverse View is a game version
// of Bird View"). Bird View(/live/stack)의 지도와 같은 내용을 3D 섬으로 그린다.
//
// - 처음에는 섬 두 개(에이전트 결제 · Canton)와 그 사이에 선 **사용자 한 명**만 있다 — Bird View 지도의
//   "두 시나리오, 같은 사람"을 그대로 옮긴 것이다. (11/9부터 세 번째 섬 — 아래 참고)
// - 섬을 누르면 그 섬이 **부풀고**(스프링이라 한 번 출렁인다), 사용자가 그 섬으로 걸어가고, 부품이
//   하나씩 **솟아오른다**. 다른 섬은 작아져 옆으로 비켜난다 — 누르면 그쪽으로 건너간다.
// - 부품을 누르면 말풍선이 뜨고, 그 안의 표준 버튼은 Bird View 와 같은 설명(std.ts)을 연다.
// - 에이전트 결제 섬에서는 jUSD 구슬이 7702 → 7715 → 7710 → x402 → AP2 순서로 선을 따라 돈다.
//   Canton(T5)은 계획이라 반투명·점선이고 구슬도 돌지 않는다 — 돌지 않는 것을 도는 것처럼 그리지 않는다.
//
// 각본이다: 체인도, 서명도, 키도 없다. 실제로 도는 것은 말풍선이 링크하는 데모들이다.
//
// **세 번째 섬: AiTM 중계 피싱** (jay, 2026-11-09, Bird View 와 같은 날 같은 요청). 두 섬 앞쪽(카메라 쪽)에
// 붉은 섬으로 놓인다 — 같은 사용자가 공격당하는 시나리오다. 구슬도 붉다: 사용자 → 프록시 → 진짜 사이트 →
// (진짜 화면이 돌아옴) → 사용자 → 프록시 → 공격자의 다른 거래. 막는 길(패스키)은 Bird View 판에서 고른다.

type Scenario = "agentic" | "canton" | "relay";
type CompId = "user" | "wallet" | "delegator" | "agent" | "provider" | "ap2" | "operator" | "sync" | "validator" | "daml" | "proxy" | "site" | "other" | "guard";
type V2 = [number, number]; // 섬 위 좌표 (x, z) — z 가 작을수록 화면 위쪽(먼 쪽)
type Comp = { id: CompId; at: V2; title: Txt; tint: string; contract?: boolean; body: Txt; menu: string[] };
type BeamDef = { a: V2; b: V2; label: string | Txt; both?: boolean; off?: V2 }; // off: 이름표를 옆으로 비키는 거리

const TOP = 0.18; // 섬 윗면 높이
const RADIUS = 2.7;
const BLOAT = 1.55; // 펼친 섬의 크기
const BG = "#0a0f1c";

// Bird View 의 배치를 섬 위로 옮긴 것: 사용자(먼 쪽 가장자리) → MetaMask → Delegator ↔ 에이전트 → 제공자, 에이전트 ↔ AP2.
const COMPS: Record<Scenario, Comp[]> = {
  agentic: [
    {
      id: "wallet", at: [0, -1.2], title: { ko: "MetaMask", en: "MetaMask" }, tint: "#f6851b",
      body: {
        ko: `주인이 따로 두 번 답한다. ① EIP-7702 로 계정에 코드를 붙인다(주소·키 그대로, 한 번만, 이것만으로는 권한이 없다). ② 사이트의 ERC-7715 요청에 에이전트에게 "최대 ${CAP} jUSD, 1시간" 권한을 준다. 서명도 따로다. 이 뒤로 팝업은 없다.`,
        en: `The owner answers twice, separately. ① EIP-7702 attaches code to the account (same address and key, once, granting nothing by itself). ② The site's ERC-7715 request grants the agent "up to ${CAP} jUSD, 1 hour" — a separate signature. No popups after this.`,
      },
      menu: ["EIP-7702", "ERC-7715", "EIP-712"],
    },
    {
      id: "delegator", at: [-2.0, 0.1], title: { ko: "Delegator 컨트랙트", en: "Delegator contract" }, tint: "#a78bfa", contract: true,
      body: {
        ko: "위임과 한도(caveat)를 들고 있는 컨트랙트. 에이전트가 쓸 때마다 caveat enforcer 가 한도를 본다 — 서명이 멀쩡해도 한도를 넘으면 되돌린다. 막는 것은 사람도 에이전트의 자제력도 아니고 컨트랙트다.",
        en: "The contract holding the delegation and its cap (caveat). A caveat enforcer checks the cap on every spend — a perfectly valid signature still reverts past it. What stops it is neither a human nor the agent's restraint, but a contract.",
      },
      menu: ["ERC-7710"],
    },
    {
      id: "agent", at: [0, 0.1], title: { ko: "에이전트", en: "Agent" }, tint: "#34d399",
      body: {
        ko: `타이머에 깨어나 스스로 결정한다 — 뉴스 → 확률 → 호가 → 데이터 피드 구매(${PRICE} jUSD). ETH 는 한 푼도 없다: UserOperation 으로 움직이고 가스는 paymaster 가 낸다.`,
        en: `Wakes on a timer and decides on its own — news → probability → order book → buy a data feed (${PRICE} jUSD). It holds no ETH: it moves as a UserOperation and a paymaster pays the gas.`,
      },
      menu: ["ERC-7710", "ERC-4337", "ERC-5792"],
    },
    {
      id: "provider", at: [2.0, 0.1], title: { ko: "서비스 제공자", en: "Service provider" }, tint: "#60a5fa",
      body: {
        ko: "HTTP 402 로 값을 부르고, 에이전트가 그 자리에서 내고 같은 요청을 다시 보내면 데이터를 준다(x402). 상대가 정말 그 에이전트인지는 ERC-8004 의 몫인데, 아직 설명만 있다.",
        en: "Quotes a price with HTTP 402; the agent pays inline, resends the same request, and gets the data (x402). Whether the counterparty really is that agent is ERC-8004's job — still an explainer only.",
      },
      menu: ["x402", "ERC-8004", "ERC-1271"],
    },
    {
      id: "ap2", at: [0, 1.4], title: { ko: "AP2", en: "AP2" }, tint: "#fbbf24",
      body: {
        ko: "레일이 아니라 mandate 층이다. Intent(사용자의 한도) · Cart(무엇을 얼마에) · Payment(결제망에 알림) 세 장이 '누가 무엇을 허락했나'의 증거로 남고, 돈은 그 밑의 레일 — x402, 또는 x402 대신 Stripe · 토스 — 이 옮긴다.",
        en: "A mandate layer, not a rail. Intent (the user's limits), Cart (what at what price) and Payment (tells the network) stay as evidence of who authorized what; the money moves on the rail underneath — x402, or Stripe or Toss instead of it.",
      },
      menu: ["AP2", "EIP-712"],
    },
  ],
  canton: [
    {
      id: "operator", at: [-1.1, 0.25], title: { ko: "운영자", en: "Operator" }, tint: "#94a3b8",
      body: {
        ko: "Jayverse 가 validator 노드 하나를 돌린다. 로컬 Splice LocalNet 에서 시작해 Global Synchronizer DevNet 으로 — super validator 의 sponsorship 이 필요한 첫 실제 접점.",
        en: "Jayverse runs one validator node. Starts on Splice LocalNet, then the Global Synchronizer DevNet — the first real touchpoint, which needs a super validator's sponsorship.",
      },
      menu: ["Validator", "Synchronizer", "Guardrail"],
    },
    { id: "sync", at: [1.1, -1.05], title: { ko: "Global Synchronizer", en: "Global Synchronizer" }, tint: "#94a3b8", body: STD.Synchronizer.role, menu: ["Synchronizer"] },
    { id: "validator", at: [1.1, 0.25], title: { ko: "Validator", en: "Validator" }, tint: "#94a3b8", contract: true, body: STD.Validator.role, menu: ["Validator", "Daml"] },
    { id: "daml", at: [1.1, 1.55], title: { ko: "Daml 계약", en: "Daml contract" }, tint: "#94a3b8", contract: true, body: STD.Daml.role, menu: ["Daml", "Guardrail"] },
  ],
  relay: [
    {
      id: "proxy", at: [0, -0.9], title: { ko: "공격자 프록시", en: "Attacker's proxy" }, tint: "#ef4444",
      body: {
        ko: "가짜 도메인(지어낸 예시: verex-settle.example)이 진짜 사이트의 리버스 프록시로 동작한다. 요청을 그대로 넘기고 응답을 그대로 돌려줘서 화면은 100% 진짜다. 결제 단계에서만 양식을 바꾸고 OTP 를 복사한다.",
        en: "A fake domain (a made-up example: verex-settle.example) acts as a reverse proxy for the real site. It forwards requests and returns responses unchanged, so the screen is 100% real. Only at the payment step does it swap the form and copy the OTP.",
      },
      menu: ["AiTM", "Session"],
    },
    {
      id: "site", at: [1.9, -0.9], title: { ko: "진짜 사이트 · Verex", en: "Real site · Verex" }, tint: "#60a5fa",
      body: {
        ko: "해킹당하지 않았다. 평소처럼 응답할 뿐이라 로그에는 '정상 사용자 + 낯선 IP(프록시)'만 남는다. 패스키로 승인하면 서명의 origin 이 가짜 도메인이라 여기서 거절된다.",
        en: "Never hacked. It answers as usual, so its log shows only 'a normal user + an unfamiliar IP (the proxy)'. With a passkey approval, the signature's origin is the fake domain and it is rejected here.",
      },
      menu: ["CSP", "SRI", "WebAuthn"],
    },
    {
      id: "other", at: [0, 1.0], title: { ko: "공격자의 다른 거래", en: "Attacker's other payment" }, tint: "#f97316",
      body: {
        ko: "공격자가 같은 시각에 열어 둔 결제다. 사용자가 자기 거래에 넣는다고 믿은 OTP 가 이 거래의 3-D Secure 에 들어간다 — 2차 인증이 '어느 거래'를 묶지 않기 때문이다.",
        en: "A payment the attacker opened at the same moment. The OTP the user believes is for their own transaction goes into this one's 3-D Secure — because the second factor does not bind 'which transaction'.",
      },
      menu: ["3DS", "AiTM"],
    },
    {
      id: "guard", at: [1.9, 1.0], title: { ko: "서버의 네 신호", en: "Server's four signals" }, tint: "#a78bfa", contract: true,
      body: {
        ko: "① 내 도메인이 아닌 Origin 의 POST ② TLS 세션과 앱 세션의 불일치 ③ 같은 쿠키가 두 IP 에서 ④ 결제 스크립트 해시(SRI) 불일치. 넷은 신호이고, 패스키(WebAuthn)만 구조로 막는다.",
        en: "① A POST from an Origin that is not mine ② a TLS/app session mismatch ③ one cookie from two IPs ④ a payment-script hash (SRI) mismatch. The four are signals; only a passkey (WebAuthn) blocks it by structure.",
      },
      menu: ["CSP", "Session", "SRI", "WebAuthn"],
    },
  ],
};
// 사용자는 두 섬의 같은 사람이다 — 섬을 펼치면 그 섬의 이 자리로 걸어간다.
const USER: Comp = {
  id: "user", at: [0, 0], title: { ko: "사용자", en: "User" }, tint: "#ffffff",
  body: {
    ko: "세 시나리오의 같은 사람. 에이전트 결제 섬에서는 지갑의 주인(EOA)이고, Canton 섬에서는 Daml 계약의 당사자(party), 피싱 섬에서는 문자 링크를 누르는 사람 — 그리고 그 섬은 그가 가짜를 알아보리라고 기대하지 않는다.",
    en: "The same person in all three scenarios: on the agentic-payment island the wallet's owner (an EOA), on the Canton island a party to a Daml contract, on the phishing island the one who taps the text-message link — and that island does not count on them spotting the fake.",
  },
  menu: ["EIP-7702", "Validator", "WebAuthn"],
};
const STAND: Record<Scenario, V2> = { agentic: [0, -2.3], canton: [-1.1, -1.95], relay: [-1.95, -0.9] };
const BEAMS: Record<Scenario, BeamDef[]> = {
  agentic: [
    { a: STAND.agentic, b: [0, -1.2], label: "EIP-7702" },
    { a: [0, -1.2], b: [-2.0, 0.1], label: "ERC-7715" },
    { a: [-2.0, 0.1], b: [0, 0.1], label: "ERC-7710", both: true },
    { a: [0, 0.1], b: [2.0, 0.1], label: "x402" },
    { a: [0, 0.1], b: [0, 1.4], label: "AP2", both: true, off: [0.95, 0] },
  ],
  canton: [
    { a: STAND.canton, b: [-1.1, 0.25], label: { ko: "당사자", en: "party" } },
    { a: [-1.1, 0.25], b: [1.1, 0.25], label: "" },
    { a: [1.1, -1.05], b: [1.1, 0.25], label: "" },
    { a: [1.1, 0.25], b: [1.1, 1.55], label: "" },
  ],
  relay: [
    { a: STAND.relay, b: [0, -0.9], label: { ko: "가짜 주소", en: "fake address" } },
    { a: [0, -0.9], b: [1.9, -0.9], label: { ko: "진짜 서버", en: "real server" } },
    { a: [0, -0.9], b: [0, 1.0], label: { ko: "OTP 중계", en: "OTP relay" }, off: [-0.75, 0] },
    { a: [1.9, -0.9], b: [1.9, 1.0], label: { ko: "검사", en: "checks" }, off: [0.6, 0] },
  ],
};
// 구슬이 도는 순서: [간선 번호, 거꾸로 가나].
// 에이전트 결제: 사용자 → MetaMask → Delegator → 에이전트 → 제공자 → 에이전트 → AP2.
// 중계 피싱: 사용자 → 프록시 → 진짜 사이트 → 프록시 → 사용자 (진짜 화면) → 프록시 → 공격자의 다른 거래 (OTP).
const ROUTES: Partial<Record<Scenario, Array<[number, boolean]>>> = {
  agentic: [[0, false], [1, false], [2, false], [3, false], [3, true], [4, false]],
  relay: [[0, false], [1, false], [1, true], [0, true], [0, false], [2, false]],
};
const ORB: Record<Scenario, string> = { agentic: "#4ade80", canton: "#4ade80", relay: "#f87171" };
// 섬의 자리: 접혀 있을 때(home)와 다른 섬이 펼쳐졌을 때(aside). [넓은 화면, 좁은 화면]
const HOME: Record<Scenario, [[number, number, number], [number, number, number]]> = {
  agentic: [[-4.3, 0, -1.2], [-3.0, 0, -3.4]],
  canton: [[4.3, 0, -1.2], [3.0, 0, -3.4]],
  relay: [[0, 0, 4.2], [0, 0, 3.6]],
};
const ASIDE: Record<Scenario, [[number, number, number], [number, number, number]]> = {
  agentic: [[-7.6, 0, -3.6], [-3.4, 0, -6.4]],
  canton: [[7.6, 0, -3.6], [3.4, 0, -6.4]],
  relay: [[0, 0, -7.2], [0, 0, -7.6]],
};
const ISLAND: Record<Scenario, { title: Txt; sub: Txt; color: string; emissive: string; ring: string }> = {
  agentic: { title: { ko: "에이전트 결제 시나리오", en: "Agentic payment scenario" }, sub: { ko: "여섯 데모 · EIP-7702 → AP2", en: "six demos · EIP-7702 → AP2" }, color: "#1e3a8a", emissive: "#2563eb", ring: "#60a5fa" },
  canton: { title: { ko: "Canton 시나리오", en: "Canton scenario" }, sub: { ko: "계획 · T5 · 테스트넷만", en: "planned · T5 · test networks only" }, color: "#334155", emissive: "#475569", ring: "#94a3b8" },
  relay: { title: { ko: "AiTM 중계 피싱 시나리오", en: "AiTM relay-phishing scenario" }, sub: { ko: "진짜 화면 · OTP 중계 · 패스키가 막는다", en: "a real screen · a relayed OTP · a passkey blocks it" }, color: "#7f1d1d", emissive: "#dc2626", ring: "#f87171" },
};

const backOut = (t: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

// ── 글자: 캔버스에 그려 스프라이트로 띄운다 (늘 카메라를 본다) ──────────────────────
type Line = { text: string; size: number; weight: number; color: string };
const PX = 0.0105; // CSS 픽셀 하나의 월드 크기
function useLabel(lines: Line[], bg: string, border?: string) {
  const key = JSON.stringify([lines, bg, border]);
  const made = useMemo(() => {
    const dpr = 2, padX = 12, padY = 7;
    const c = document.createElement("canvas");
    const g = c.getContext("2d")!;
    const font = (l: Line) => `${l.weight} ${l.size * dpr}px Pretendard, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;
    let w = 0;
    for (const l of lines) { g.font = font(l); w = Math.max(w, g.measureText(l.text).width); }
    const lh = lines.map((l) => l.size * 1.3 * dpr);
    c.width = Math.ceil(w + padX * 2 * dpr);
    c.height = Math.ceil(lh.reduce((a, b) => a + b, 0) + padY * 2 * dpr);
    const r = Math.min(c.height / 2, 14 * dpr);
    g.beginPath(); g.roundRect(dpr, dpr, c.width - 2 * dpr, c.height - 2 * dpr, r);
    g.fillStyle = bg; g.fill();
    if (border) { g.lineWidth = 1.5 * dpr; g.strokeStyle = border; g.stroke(); }
    g.textAlign = "center"; g.textBaseline = "middle";
    let y = padY * dpr;
    lines.forEach((l, i) => { g.font = font(l); g.fillStyle = l.color; g.fillText(l.text, c.width / 2, y + lh[i] / 2); y += lh[i]; });
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { tex, w: (c.width / dpr) * PX, h: (c.height / dpr) * PX };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => () => made.tex.dispose(), [made]);
  return made;
}
function Label({ lines, bg = "rgba(10,15,28,.82)", border, position, scale = 1 }: {
  lines: Line[]; bg?: string; border?: string; position: [number, number, number]; scale?: number;
}) {
  const { tex, w, h } = useLabel(lines, bg, border);
  return (
    <sprite position={position} scale={[w * scale, h * scale, 1]} renderOrder={10}>
      <spriteMaterial map={tex} transparent depthTest={false} depthWrite={false} />
    </sprite>
  );
}

// ── 선: 원기둥 토막. 점선은 토막을 여러 개로 ─────────────────────────────────────
function segs(a: THREE.Vector3, b: THREE.Vector3, dashed: boolean) {
  const out: Array<{ pos: THREE.Vector3; q: THREE.Quaternion; len: number }> = [];
  const dir = b.clone().sub(a);
  const L = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  const step = dashed ? 0.3 : L, dash = dashed ? 0.17 : L;
  for (let s = 0; s < L - 0.01; s += step) {
    const len = Math.min(dash, L - s);
    out.push({ pos: a.clone().add(dir.clone().multiplyScalar((s + len / 2) / L)), q, len });
  }
  return out;
}
function Beam({ def, shown, delay, plan, lang, active, index }: {
  def: BeamDef; shown: boolean; delay: number; plan: boolean; lang: Lang; active: React.MutableRefObject<number>; index: number;
}) {
  const y = TOP + 0.24;
  const a = useMemo(() => new THREE.Vector3(def.a[0], y, def.a[1]), [def, y]);
  const b = useMemo(() => new THREE.Vector3(def.b[0], y, def.b[1]), [def, y]);
  const parts = useMemo(() => segs(a, b, plan), [a, b, plan]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: plan ? "#64748b" : "#3b82f6", transparent: true, opacity: 0 }), [plan]);
  useEffect(() => () => mat.dispose(), [mat]);
  const since = useRef(0);
  const grp = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    since.current = shown ? since.current + dt : 0;
    const want = shown && since.current > delay ? 0.9 : 0;
    mat.opacity += (want - mat.opacity) * Math.min(1, dt * 8);
    if (grp.current) grp.current.visible = mat.opacity > 0.02;
    // 구슬이 지나가는 선은 밝게
    mat.color.set(plan ? "#64748b" : active.current === index ? "#93c5fd" : "#3b82f6");
  });
  const text = typeof def.label === "string" ? def.label : lang === "ko" ? def.label.ko : def.label.en;
  const mid: [number, number, number] = [(def.a[0] + def.b[0]) / 2 + (def.off?.[0] ?? 0), y + 0.32, (def.a[1] + def.b[1]) / 2 + (def.off?.[1] ?? 0)];
  return (
    <group ref={grp}>
      {parts.map((p, i) => (
        <mesh key={i} position={p.pos} quaternion={p.q} material={mat}>
          <cylinderGeometry args={[0.035, 0.035, p.len, 8]} />
        </mesh>
      ))}
      {text && <Label position={mid} scale={0.85} lines={[{ text: def.both ? `${text} ↔` : text, size: 12, weight: 700, color: plan ? "#cbd5e1" : "#bfdbfe" }]} />}
    </group>
  );
}

// ── 부품: 섬이 펼쳐지면 차례로 솟아오른다 ─────────────────────────────────────────
function Block({ comp, shown, delay, plan, lang, picked, onPick }: {
  comp: Comp; shown: boolean; delay: number; plan: boolean; lang: Lang; picked: boolean; onPick: (c: Comp) => void;
}) {
  const g = useRef<THREE.Group>(null);
  const k = useRef(0), since = useRef(0);
  const [hover, setHover] = useState(false);
  useFrame((state, dt) => {
    since.current = shown ? since.current + dt : 0;
    const up = shown && since.current > delay;
    k.current = up ? Math.min(1, k.current + dt / 0.5) : Math.max(0, k.current - dt / 0.18);
    if (!g.current) return;
    const s = Math.max(backOut(k.current), 0.0001);
    g.current.scale.set(s, s, s);
    g.current.visible = k.current > 0.001;
    const lift = hover || picked ? 0.12 + Math.sin(state.clock.elapsedTime * 4) * 0.03 : 0;
    g.current.position.set(comp.at[0], TOP + lift, comp.at[1]);
  });
  const w = 1.05, h = 0.46, d = 0.72;
  const glow = hover || picked;
  return (
    <group ref={g} visible={false}>
      <mesh
        position={[0, h / 2, 0]}
        onClick={(e) => { e.stopPropagation(); onPick(comp); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={comp.tint} roughness={0.45} metalness={0.1} transparent={plan || comp.contract} opacity={plan ? 0.45 : comp.contract ? 0.7 : 1}
          emissive={comp.tint} emissiveIntensity={glow ? 0.55 : 0.12} />
      </mesh>
      {(plan || comp.contract) && (
        <lineSegments position={[0, h / 2, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
          <lineBasicMaterial color={glow ? "#ffffff" : "#e2e8f0"} />
        </lineSegments>
      )}
      <Label position={[0, h + 0.3, 0]} scale={0.82} border={glow ? "#ffffff" : undefined}
        lines={[{ text: lang === "ko" ? comp.title.ko : comp.title.en, size: 13, weight: 700, color: plan ? "#cbd5e1" : "#ffffff" }]} />
    </group>
  );
}

// ── 섬 ─────────────────────────────────────────────────────────────────────────────
function Island({ id, open, narrow, lang, onOpen, picked, onPick }: {
  id: Scenario; open: Scenario | null; narrow: boolean; lang: Lang; onOpen: (s: Scenario) => void; picked: CompId | null; onPick: (c: Comp) => void;
}) {
  const plan = id === "canton";
  const g = useRef<THREE.Group>(null);
  const label = useRef<THREE.Group>(null);
  const scale = useRef(1), vel = useRef(0);
  const [hover, setHover] = useState(false);
  const isOpen = open === id;
  const home = HOME[id][narrow ? 1 : 0];
  const aside = ASIDE[id][narrow ? 1 : 0];
  const tPos = open === null ? home : isOpen ? [0, 0, 0] : aside;
  const tScale = open === null ? 1 : isOpen ? BLOAT : 0.38;
  const active = useRef(-1);
  const orb = useRef<THREE.Mesh>(null);
  const runT = useRef(0);
  useFrame((_, dt) => {
    if (!g.current) return;
    // 부푸는 크기는 스프링 — 한 번 출렁이고 멈춘다("it's bloated").
    vel.current += (tScale - scale.current) * 70 * dt;
    vel.current *= Math.exp(-7 * dt);
    scale.current += vel.current * dt;
    g.current.scale.setScalar(scale.current);
    const p = g.current.position;
    p.lerp(new THREE.Vector3(...(tPos as [number, number, number])), 1 - Math.exp(-dt * 4));
    // 섬 이름표: 접혀 있으면 가운데 위, 펼치면 가까운 쪽 가장자리로 비켜 준다 — 먼 쪽에는 사용자가 선다.
    if (label.current) label.current.position.lerp(new THREE.Vector3(0, isOpen ? 0.55 : 1.25, isOpen ? RADIUS + 0.45 : 0), 1 - Math.exp(-dt * 5));
    // 구슬 (에이전트 결제 섬은 jUSD, 피싱 섬은 붉은 요청·OTP)
    const route = ROUTES[id];
    if (orb.current) {
      if (!isOpen || plan || !route) { orb.current.visible = false; active.current = -1; runT.current = 0; return; }
      runT.current += dt;
      const t = runT.current - 1.6; // 부품이 다 솟은 뒤에 출발
      const per = 0.85, cycle = route.length * per + 1.2;
      if (t < 0) { orb.current.visible = false; return; }
      const c = t % cycle, i = Math.floor(c / per);
      if (i >= route.length) { orb.current.visible = false; active.current = -1; return; }
      const [bi, rev] = route[i];
      const bd = BEAMS[id][bi];
      const f = (c - i * per) / per, a = rev ? bd.b : bd.a, b = rev ? bd.a : bd.b;
      orb.current.visible = true;
      orb.current.position.set(a[0] + (b[0] - a[0]) * f, TOP + 0.24, a[1] + (b[1] - a[1]) * f);
      active.current = bi;
    }
  });
  const { title, sub, color, emissive, ring: ringColor } = ISLAND[id];
  const tx = (x: Txt) => (lang === "ko" ? x.ko : x.en);
  const ring = useMemo(() => {
    const pts = new THREE.Path().absarc(0, 0, RADIUS + 0.02, 0, Math.PI * 2, false).getPoints(96);
    return new THREE.BufferGeometry().setFromPoints(pts.map((v) => new THREE.Vector3(v.x, TOP + 0.01, v.y)));
  }, []);
  const ringRef = useRef<THREE.LineLoop>(null);
  useEffect(() => { ringRef.current?.computeLineDistances(); }, []);
  // Canton 구역 테두리 (Bird View 의 점선 상자)
  const frame = useMemo(() => {
    const [x0, x1, z0, z1] = [0.42, 1.78, -1.6, 2.1];
    return new THREE.BufferGeometry().setFromPoints([[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => new THREE.Vector3(x, TOP + 0.02, z)));
  }, []);
  const frameRef = useRef<THREE.LineLoop>(null);
  useEffect(() => { frameRef.current?.computeLineDistances(); }, []);
  const glow = hover && !isOpen;
  return (
    <group ref={g} position={home}>
      <mesh
        onClick={(e) => { e.stopPropagation(); if (!isOpen) onOpen(id); }}
        onPointerOver={(e) => { e.stopPropagation(); if (!isOpen) { setHover(true); document.body.style.cursor = "pointer"; } }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}
      >
        <cylinderGeometry args={[RADIUS, RADIUS * 0.9, 0.36, 64]} />
        <meshStandardMaterial color={color} roughness={0.7} transparent={plan} opacity={plan ? 0.7 : 1}
          emissive={emissive} emissiveIntensity={glow ? 0.55 : 0.18} />
      </mesh>
      <lineLoop ref={ringRef} geometry={ring}>
        <lineDashedMaterial color={glow ? "#ffffff" : ringColor} dashSize={plan ? 0.25 : 100} gapSize={plan ? 0.15 : 0} />
      </lineLoop>
      <group ref={label} position={[0, 1.25, 0]}>
        <Label position={[0, 0, 0]} scale={isOpen ? 0.8 : 1.15} border={glow ? "#ffffff" : ringColor}
          lines={[{ text: tx(title), size: 15, weight: 700, color: "#ffffff" }, { text: tx(sub), size: 11, weight: 500, color: "#cbd5e1" }]} />
      </group>
      {plan && (
        <group visible={isOpen}>
          <lineLoop ref={frameRef} geometry={frame}>
            <lineDashedMaterial color="#94a3b8" dashSize={0.18} gapSize={0.12} />
          </lineLoop>
          <Label position={[1.1, TOP + 0.3, 2.35]} scale={0.8} lines={[{ text: "Canton Network · T5", size: 12, weight: 700, color: "#cbd5e1" }]} />
        </group>
      )}
      {BEAMS[id].map((b, i) => (
        <Beam key={i} def={b} index={i} shown={isOpen} delay={0.25 + COMPS[id].length * 0.12} plan={plan} lang={lang} active={active} />
      ))}
      {COMPS[id].map((c, i) => (
        <Block key={c.id} comp={c} shown={isOpen} delay={0.15 + i * 0.12} plan={plan} lang={lang} picked={picked === c.id} onPick={onPick} />
      ))}
      <mesh ref={orb} visible={false}>
        <sphereGeometry args={[0.12, 20, 20]} />
        <meshBasicMaterial color={ORB[id]} />
      </mesh>
    </group>
  );
}

// ── 사용자: 두 섬 사이에 서 있다가, 펼친 섬으로 걸어간다 ─────────────────────────────
function Avatar({ open, narrow, lang, picked, onPick }: { open: Scenario | null; narrow: boolean; lang: Lang; picked: boolean; onPick: (c: Comp) => void }) {
  const g = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  useFrame((state, dt) => {
    if (!g.current || !body.current) return;
    const st = open ? STAND[open] : null;
    const target = st ? new THREE.Vector3(st[0] * BLOAT, TOP * BLOAT, st[1] * BLOAT) : new THREE.Vector3(0, 0, narrow ? 0 : 0.6);
    const p = g.current.position;
    const d = target.clone().sub(p);
    const moving = d.length() > 0.05;
    if (moving) {
      p.add(d.clampLength(0, dt * 4.2));
      g.current.rotation.y = Math.atan2(d.x, d.z);
    } else {
      g.current.rotation.y += (0 - g.current.rotation.y) * Math.min(1, dt * 5);
    }
    const t = state.clock.elapsedTime;
    body.current.position.y = moving ? Math.abs(Math.sin(t * 12)) * 0.12 : Math.sin(t * 2) * 0.04;
  });
  const glow = hover || picked;
  return (
    <group ref={g} position={[0, 0, narrow ? 0 : 0.6]}>
      <group ref={body}
        onClick={(e) => { e.stopPropagation(); onPick(USER); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}
      >
        <mesh position={[0, 0.55, 0]}>
          <capsuleGeometry args={[0.24, 0.5, 6, 16]} />
          <meshStandardMaterial color="#f8fafc" emissive="#93c5fd" emissiveIntensity={glow ? 0.6 : 0.15} roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.18, 0]}>
          <sphereGeometry args={[0.21, 24, 24]} />
          <meshStandardMaterial color="#f8fafc" emissive="#93c5fd" emissiveIntensity={glow ? 0.6 : 0.15} roughness={0.5} />
        </mesh>
        {/* 얼굴 쪽을 알 수 있게 눈 하나 */}
        <mesh position={[0, 1.2, 0.18]}>
          <boxGeometry args={[0.2, 0.06, 0.06]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
      </group>
      <Label position={[0, 1.75, 0]} border={glow ? "#ffffff" : undefined} lines={[{ text: lang === "ko" ? "사용자" : "User", size: 13, weight: 700, color: "#ffffff" }]} />
    </group>
  );
}

function Rig({ open, narrow }: { open: Scenario | null; narrow: boolean }) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    const pos = open ? (narrow ? [0, 15, 10] : [0, 10.2, 6.2]) : narrow ? [0, 27, 9] : [0, 10.5, 13.5];
    const a = 1 - Math.exp(-dt * 3);
    camera.position.lerp(new THREE.Vector3(pos[0], pos[1], pos[2]), a);
    look.current.lerp(new THREE.Vector3(0, 0, open ? -0.4 : 0), a);
    camera.lookAt(look.current);
  });
  return null;
}

function Stars() {
  const geo = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < 420; i++) {
      const r = 22 + Math.random() * 10, th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.45;
      pts.push(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.8 + 2, r * Math.sin(ph) * Math.sin(th) - 6);
    }
    return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#cbd5e1" size={0.08} sizeAttenuation />
    </points>
  );
}

export default function MetaverseRun({ lang }: { lang: Lang }) {
  const t = (ko: string, en: string) => (lang === "ko" ? ko : en);
  const tx = (x: Txt) => (lang === "ko" ? x.ko : x.en);
  const [open, setOpen] = useState<Scenario | null>(null);
  const [pick, setPick] = useState<Comp | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setNarrow(mq.matches);
    on(); mq.addEventListener("change", on);
    return () => { mq.removeEventListener("change", on); document.body.style.cursor = ""; };
  }, []);
  const openIsland = (s: Scenario | null) => { setOpen(s); setPick(null); setDetail(null); };
  const choose = (c: Comp) => { setPick(c); setDetail(null); };
  // Esc: 말풍선이 있으면 말풍선을, 없으면 섬을 접는다.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (pick) { setPick(null); setDetail(null); } else if (open) openIsland(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pick, open]);

  const ALL: Scenario[] = ["agentic", "canton", "relay"];
  const others = ALL.filter((x) => open && x !== open);
  const name = (s: Scenario) => tx(ISLAND[s].title);
  const s = detail ? STD[detail] : null;

  return (
    <div className="mv-stage" style={{ marginTop: 16 }}>
      <Canvas
        camera={{ position: [0, 10.5, 13.5], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
        onPointerMissed={() => { setPick(null); setDetail(null); }}
        fallback={<p className="mv-fallback">{t("이 브라우저에서는 3D(WebGL)를 쓸 수 없습니다. 같은 내용을 평면으로 보려면 Bird View 로 가세요.", "3D (WebGL) is not available in this browser. The same content is in Bird View.")}</p>}
      >
        <color attach="background" args={[BG]} />
        <fog attach="fog" args={[BG, 20, 42]} />
        <hemisphereLight args={["#cbd5e1", "#0b1020", 0.7]} />
        <directionalLight position={[4, 10, 6]} intensity={1.3} />
        <directionalLight position={[-6, 5, -4]} intensity={0.35} />
        <Stars />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
          <circleGeometry args={[26, 64]} />
          <meshStandardMaterial color="#0d1526" roughness={1} />
        </mesh>
        <gridHelper args={[52, 52, "#1e2a44", "#141d33"]} position={[0, -0.19, 0]} />
        <Rig open={open} narrow={narrow} />
        <Island id="agentic" open={open} narrow={narrow} lang={lang} onOpen={openIsland} picked={pick?.id ?? null} onPick={choose} />
        <Island id="canton" open={open} narrow={narrow} lang={lang} onOpen={openIsland} picked={pick?.id ?? null} onPick={choose} />
        <Island id="relay" open={open} narrow={narrow} lang={lang} onOpen={openIsland} picked={pick?.id ?? null} onPick={choose} />
        <Avatar open={open} narrow={narrow} lang={lang} picked={pick?.id === "user"} onPick={choose} />
      </Canvas>

      {/* ── HUD: 무엇을 누르면 되는지 + 키보드로도 갈 수 있는 버튼 ─────────── */}
      <div className="mv-hud">
        <div className="mv-hud-k">Metaverse View</div>
        <div className="mv-hud-t">
          {open ? t("부품을 누르면 말풍선이 뜹니다. 바닥을 누르면 닫힙니다.", "Press a part to open its bubble. Press the ground to close it.")
            : t("섬을 누르세요 — 누른 섬이 부풀고 부품이 솟아오릅니다.", "Press an island — it swells and its parts rise up.")}
        </div>
        <div className="mv-hud-b">
          {open ? (<>
            <button className="ghost" onClick={() => openIsland(null)}>{t("← 전체 보기", "← Overview")}</button>
            {others.map((o) => <button key={o} className="ghost" onClick={() => openIsland(o)}>{name(o)} →</button>)}
          </>) : ALL.map((o) => <button key={o} className="ghost" onClick={() => openIsland(o)}>{name(o)}</button>)}
        </div>
      </div>

      {/* ── 말풍선 ─────────────────────────────────────────────────── */}
      {pick && (
        <div className={`stack-bubble mv-bubble${pick.id === "wallet" ? " wallet" : ""}`} role="dialog" aria-modal="false">
          <button className="stack-bubble-x" aria-label={t("닫기", "Close")} onClick={() => { setPick(null); setDetail(null); }}>×</button>
          {s ? (<>
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
          </>) : (<>
            <div className="stack-bubble-h">{pick.id === "wallet" && <span className="stack-fox" aria-hidden>🦊</span>}{tx(pick.title)}</div>
            <p>{tx(pick.body)}</p>
            <div className="stack-std">
              <span className="stack-std-k">{t("표준", "standards")}</span>
              {pick.menu.map((k) => (
                <button key={k} className={`stack-std-b${STD[k].runs === "live" ? "" : " dim"}`} onClick={() => setDetail(k)}>{STD[k].id}</button>
              ))}
            </div>
          </>)}
        </div>
      )}
    </div>
  );
}
