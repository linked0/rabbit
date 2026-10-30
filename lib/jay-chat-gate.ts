// Jay Chat 입장 판정 — 돈과 가용성을 함께 지킨다 (T1 §1.9, §1.10).
//
// 한 요청이 통과하려면 **모든** 층의 예약이 동시에 성공해야 한다:
//   주 → 하루 → (익명이면) 익명 몫 → IP 대역 → 쿠키
// 하나라도 실패하면 이미 잡은 것을 되돌리고 거절한다. 되돌리지 않으면 거절당한 요청이
// 남의 몫을 갉아먹는다.
//
// 익명과 "돌아온 방문자 + jay" 를 가르는 이유 (§1.9 item 4): 익명은 `anon:<날짜>` 줄을
// 함께 쓰고 그 상한이 하루 상한보다 reservedDay 만큼 작다. 그래서 공격자가 익명 풀을
// 다 비워도 돌아온 사람과 jay 는 계속 쓸 수 있다.
import { CAPS, UNDER_ATTACK_VISITOR_FACTOR, kstDay, kstWeek, msToKstMidnight, reserve, settle, usedOf, topPrefixes } from "./jay-chat-spend";
import { CHEAP_MODEL, worstCaseCost } from "./ai-provider";
import { notifySpend } from "./visitor-notify";

// ── IP 대역 ─────────────────────────────────────────────────────────────
/** IPv4 는 /24, IPv6 는 /64 로 묶는다. 주소를 돌려도 보통 한 대역 안이다 (§1.9 item 1). */
export function ipPrefix(ip: string): string {
  if (!ip || ip === "unknown") return "unknown";
  if (ip.includes(":")) {
    const groups = ip.split(":");
    return groups.slice(0, 4).join(":") + "::/64";
  }
  const octets = ip.split(".");
  if (octets.length !== 4) return ip;
  return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`;
}

/** env 로 막는 대역 목록 — 알림을 보고 코드 배포 없이 늘릴 수 있다 (§1.9 item 9). */
function denyList(): string[] {
  return (process.env.JAY_CHAT_DENY_PREFIXES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function denied(ip: string): boolean {
  const prefix = ipPrefix(ip);
  return denyList().some((d) => d === ip || d === prefix || ip.startsWith(d));
}

// ── 공격 모드 (§1.9 item 9) ─────────────────────────────────────────────
// 익명 사용이 두 시간 연속 시간 상한의 80% 를 넘으면, 그 KST 날이 끝날 때까지 몫을
// 줄이고 싼 모델만 쓴다. 메모리에 둔다 — rabbit 은 인스턴스 하나이고, 재시작으로
// 풀려도 바깥의 일·주 상한이 돈은 이미 막고 있다.
let hotHours = 0;
let lastHourBucket = -1;
let underAttackUntil = 0;

export function underAttack(now = Date.now()): boolean {
  return now < underAttackUntil;
}

/** 시간이 바뀔 때마다 직전 시간의 익명 사용률을 넘겨 준다. */
export function rollHour(anonSpentThisHour: number, now = Date.now()): void {
  const bucket = Math.floor(now / 3_600_000);
  if (bucket === lastHourBucket) return;
  lastHourBucket = bucket;
  if (anonSpentThisHour >= CAPS.hour * 0.8) hotHours++;
  else hotHours = 0;
  if (hotHours >= 2 && !underAttack(now)) {
    underAttackUntil = now + msToKstMidnight(now);
    void topPrefixes().then((top) =>
      notifySpend(`⚠️ Jay Chat 공격 모드 — 익명 사용이 두 시간 연속 시간 상한의 80% 초과. 오늘 자정(KST)까지 몫 축소 + ${CHEAP_MODEL} 고정.`, top)
    );
  }
}

// ── 알림 (§1.9 item 6, §1.10) ───────────────────────────────────────────
const fired = new Set<string>();
async function alertOnce(id: string, text: string, withTop = false) {
  if (fired.has(id)) return;
  fired.add(id);
  await notifySpend(text, withTop ? await topPrefixes() : []);
}

// ── 판정 ────────────────────────────────────────────────────────────────
export type Visitor = { ip: string; cookieId: string | null; returning: boolean; owner: boolean };

export type Admission =
  | { ok: true; model: string; maxTokens: number; settle: (actualCost: number) => Promise<void> }
  | { ok: false; status: number; message: string };

const FULL_MAX_TOKENS = Number(process.env.JAY_CHAT_MAX_TOKENS || 4000);
const CHEAP_MAX_TOKENS = Number(process.env.JAY_CHAT_CHEAP_MAX_TOKENS || 1200);

/** 어느 상한에 걸렸는지에 따라 다른 말을 한다 — "언제 다시 오면 되나"가 답에 있어야 한다. */
const MESSAGES = {
  hour: "이번 시간의 채팅 한도에 도달했습니다 — 정각에 다시 열립니다.",
  day: "오늘의 채팅 한도에 도달했습니다 — 내일(00:00 KST) 다시 열립니다.",
  week: "이번 주 채팅 한도에 도달했습니다 — 월요일에 다시 열립니다.",
  visitor: "잠시 뒤에 다시 시도해주세요 — 한 분당 하루 사용량 한도입니다.",
};

export async function admit(v: Visitor, estInputTokens: number, now = Date.now()): Promise<Admission> {
  if (denied(v.ip)) return { ok: false, status: 403, message: "접근이 제한되었습니다." };

  const day = kstDay(now);
  const week = kstWeek(now);
  const attack = underAttack(now);

  // 하루를 얼마나 썼는지 먼저 본다 — 모델을 내릴지(§1.9 item 5) 정해야 비용 추정이 맞는다.
  const seen = await usedOf([`day:${day}`, `week:${week}`]);
  const dayUsed = seen?.[`day:${day}`]?.used ?? 0;
  const weekUsed = seen?.[`week:${week}`]?.used ?? 0;

  const degraded = attack || dayUsed >= CAPS.day * 0.8;
  const model = degraded ? CHEAP_MODEL : process.env.AI_MODEL || "claude-sonnet-5-5";
  const maxTokens = degraded ? CHEAP_MAX_TOKENS : FULL_MAX_TOKENS;
  const est = worstCaseCost(model, estInputTokens, maxTokens);

  // 주·일 임계 알림
  if (weekUsed >= CAPS.week * 0.8) await alertOnce(`w80:${week}`, `🔴 Jay Chat 주간 한도 80% — $${weekUsed.toFixed(2)} / $${CAPS.week}`, true);
  else if (weekUsed >= CAPS.week * 0.5) await alertOnce(`w50:${week}`, `🟡 Jay Chat 주간 한도 50% — $${weekUsed.toFixed(2)} / $${CAPS.week}`);
  if (degraded && !attack) await alertOnce(`d80:${day}`, `🟠 Jay Chat 오늘 80% — $${dayUsed.toFixed(2)} / $${CAPS.day}. 새 대화는 ${CHEAP_MODEL} 로 내려갑니다.`, true);

  const visitorCap = CAPS.visitorDay * (attack ? UNDER_ATTACK_VISITOR_FACTOR : 1);
  const anonCap = Math.max(0, CAPS.day - CAPS.reservedDay);

  // 바깥(주)부터 안쪽(개인)으로. 실패하면 **잡은 것을 되돌린다**.
  const steps: Array<{ key: string; cap: number; label: keyof typeof MESSAGES }> = [
    { key: `week:${week}`, cap: CAPS.week, label: "week" },
    { key: `day:${day}`, cap: CAPS.day, label: "day" },
  ];
  // 익명만 좁은 풀을 함께 쓴다. 돌아온 방문자와 jay 는 이 줄을 건너뛴다 (§1.9 item 4).
  if (!v.owner && !v.returning) steps.push({ key: `anon:${day}`, cap: anonCap, label: "day" });
  if (!v.owner) {
    steps.push({ key: `ip:${ipPrefix(v.ip)}:${day}`, cap: visitorCap, label: "visitor" });
    if (v.cookieId) steps.push({ key: `ck:${v.cookieId}:${day}`, cap: visitorCap, label: "visitor" });
  }

  const taken: string[] = [];
  for (const s of steps) {
    const got = await reserve(s.key, s.cap, est);
    if (got === null) {
      await Promise.all(taken.map((k) => settle(k, est, 0))); // 되돌린다
      if (s.label === "day") await alertOnce(`dayhit:${day}`, `🔴 Jay Chat 오늘 한도 소진 — $${CAPS.day}. 내일 00:00 KST 에 열립니다.`, true);
      return { ok: false, status: 429, message: MESSAGES[s.label] };
    }
    taken.push(s.key);
  }

  return {
    ok: true,
    model,
    maxTokens,
    settle: async (actualCost: number) => {
      await Promise.all(taken.map((k) => settle(k, est, actualCost)));
    },
  };
}

/** 테스트용 — 공격 모드와 알림 기록을 되돌린다. */
export function _resetGate() {
  hotHours = 0;
  lastHourBucket = -1;
  underAttackUntil = 0;
  fired.clear();
}
