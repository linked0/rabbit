// Jay Chat 지출 장부 — 달러 상한 (T1 §1.10, jay 2026-10-30: "10 dollar in a week").
//
// 층이 넷이고, 안쪽이 놓친 것을 바깥이 받는다:
//   시간 $0.50  인메모리 (lib/jay-chat.ts)      — 순간적인 몰림을 깎는다
//   하루 $2.50  Postgres                        — 느리게 새는 것을 막는다
//   주   $10    Postgres                        — jay 가 정한 숫자, 실제로 묶이는 상한
//   월   $45    Anthropic Console (jay 수동)    — 앱에 버그가 있어도 버티는 마지막 선
//
// **왜 DB 인가.** 인메모리 카운터는 배포·재시작·스케일 투 제로마다 0이 된다. 하루·주
// 상한이 그래선 뜻이 없다. 시간 상한만 메모리로 두는 건, 리셋돼도 바깥의 일·주가 받아
// 주기 때문이다 (§1.9 item 8).
//
// **원자성.** 예약은 한 문장이다. 읽고-판단하고-쓰면 동시 요청이 같은 잔액을 본다 —
// §1.8 에서 고친 바로 그 구멍을 DB 에서 되풀이하게 된다.
import { prisma } from "./db";

// ── 상한값 (달러) ───────────────────────────────────────────────────────
export const CAPS = {
  week: Number(process.env.JAY_CHAT_CAP_WEEK || 10),
  day: Number(process.env.JAY_CHAT_CAP_DAY || 2.5),
  hour: Number(process.env.JAY_CHAT_CAP_HOUR || 0.5),
  /** IP 대역 하나, 쿠키 하나가 하루에 쓸 수 있는 몫 (§1.9 items 1·9). */
  visitorDay: Number(process.env.JAY_CHAT_CAP_VISITOR_DAY || 0.2),
  /** 돌아온 방문자와 jay 를 위해 떼어 두는 하루 몫. 익명 트래픽은 못 가져간다 (§1.9 item 4). */
  reservedDay: Number(process.env.JAY_CHAT_CAP_RESERVED_DAY || 0.5),
};

/** 공격 모드에서 줄이는 비율 (§1.9 item 9). */
export const UNDER_ATTACK_VISITOR_FACTOR = 0.25;

// ── KST 날짜 키 ─────────────────────────────────────────────────────────
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function kstParts(now = Date.now()) {
  const d = new Date(now + KST_OFFSET_MS); // UTC 필드를 읽으면 KST 가 된다
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), day: d.getUTCDay(), t: d };
}

export function kstDay(now = Date.now()): string {
  const { y, m, d } = kstParts(now);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** ISO 주 (KST 기준). 월요일 시작, 목요일이 속한 해가 그 주의 해. */
export function kstWeek(now = Date.now()): string {
  const { t } = kstParts(now);
  const date = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
  const dow = (date.getUTCDay() + 6) % 7; // 월=0
  date.setUTCDate(date.getUTCDate() - dow + 3); // 그 주의 목요일
  const isoYear = date.getUTCFullYear();
  const firstThu = new Date(Date.UTC(isoYear, 0, 4));
  const firstDow = (firstThu.getUTCDay() + 6) % 7;
  firstThu.setUTCDate(firstThu.getUTCDate() - firstDow + 3);
  const week = 1 + Math.round((date.getTime() - firstThu.getTime()) / (7 * 24 * 3600 * 1000));
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

/** 다음 KST 자정까지 남은 밀리초 — "내일 다시" 메시지와 공격 모드 해제에 쓴다. */
export function msToKstMidnight(now = Date.now()): number {
  const { t } = kstParts(now);
  const endOfDay = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + 1);
  return endOfDay - (now + KST_OFFSET_MS);
}

// ── 저장소: Postgres, 없으면 메모리 ──────────────────────────────────────
// 메모리 폴백은 **로컬 개발·테스트 전용**이다. 인스턴스마다 따로 세므로 상한의 보증이
// 약해진다. 클라우드에서 이 길로 빠지면 한 번 크게 로그를 남긴다.
type Row = { cap: number; used: number };
const mem = new Map<string, Row>();
let memWarned = false;

function useMemory(e: unknown): boolean {
  if (!memWarned) {
    memWarned = true;
    const where = process.env.APP_MODE === "cloud" ? "CLOUD" : "local";
    console.error(`jay-chat-spend: DB 사용 불가 → 메모리 폴백 (${where}).`, e instanceof Error ? e.message : e);
  }
  return true;
}

function memReserve(key: string, cap: number, amount: number): number | null {
  const row = mem.get(key) ?? { cap, used: 0 };
  row.cap = cap;
  if (row.used + amount > cap) return null;
  row.used += amount;
  mem.set(key, row);
  return row.used;
}

/**
 * 한 문장으로 예약한다. 성공하면 예약 뒤의 누적액, 상한을 넘으면 null.
 *
 * 새 줄은 INSERT 로, 있는 줄은 조건부 UPDATE 로 — 둘 다 한 번의 왕복 안에서.
 * `WHERE used + amount <= cap` 이 핵심이다: 이 조건이 DB 안에 있어야 동시 요청이
 * 같은 잔액을 보고 함께 통과하는 일이 없다.
 */
export async function reserve(key: string, cap: number, amount: number): Promise<number | null> {
  if (amount > cap) return null; // 한 번 요청이 상한보다 크면 새 줄로도 통과하면 안 된다
  try {
    const rows = await prisma.$queryRaw<Array<{ used: string | number }>>`
      INSERT INTO "ChatSpend" ("key", "cap", "used", "updatedAt")
      VALUES (${key}, ${cap}::numeric, ${amount}::numeric, now())
      ON CONFLICT ("key") DO UPDATE
        SET "used" = "ChatSpend"."used" + ${amount}::numeric,
            "cap"  = ${cap}::numeric,
            "updatedAt" = now()
        WHERE "ChatSpend"."used" + ${amount}::numeric <= ${cap}::numeric
      RETURNING "used"
    `;
    return rows.length ? Number(rows[0].used) : null;
  } catch (e) {
    useMemory(e);
    return memReserve(key, cap, amount);
  }
}

/** 예약을 실제 비용으로 바꾼다. 음수로 내려가지 않게 바닥을 둔다. */
export async function settle(key: string, reserved: number, actual: number): Promise<void> {
  const delta = actual - reserved;
  if (delta === 0) return;
  try {
    await prisma.$executeRaw`
      UPDATE "ChatSpend"
      SET "used" = GREATEST(0::numeric, "used" + ${delta}::numeric), "updatedAt" = now()
      WHERE "key" = ${key}
    `;
  } catch (e) {
    useMemory(e);
    const row = mem.get(key);
    if (row) row.used = Math.max(0, row.used + delta);
  }
}

/** 지금 얼마나 썼나 (알림·진단용). 못 읽으면 null. */
export async function usedOf(keys: string[]): Promise<Record<string, { used: number; cap: number }> | null> {
  try {
    const rows = await prisma.$queryRaw<Array<{ key: string; used: string | number; cap: string | number }>>`
      SELECT "key", "used", "cap" FROM "ChatSpend" WHERE "key" = ANY(${keys})
    `;
    return Object.fromEntries(rows.map((r) => [r.key, { used: Number(r.used), cap: Number(r.cap) }]));
  } catch {
    const out: Record<string, { used: number; cap: number }> = {};
    for (const k of keys) {
      const row = mem.get(k);
      if (row) out[k] = { used: row.used, cap: row.cap };
    }
    return Object.keys(out).length ? out : null;
  }
}

/** 오늘 가장 많이 쓴 IP 대역 — 알림에 붙인다 (§1.9 item 6). */
export async function topPrefixes(day = kstDay(), limit = 5): Promise<Array<{ key: string; used: number }>> {
  try {
    const rows = await prisma.$queryRaw<Array<{ key: string; used: string | number }>>`
      SELECT "key", "used" FROM "ChatSpend"
      WHERE "key" LIKE ${`ip:%:${day}`} ORDER BY "used" DESC LIMIT ${limit}
    `;
    return rows.map((r) => ({ key: r.key, used: Number(r.used) }));
  } catch {
    return [...mem.entries()]
      .filter(([k]) => k.startsWith("ip:") && k.endsWith(`:${day}`))
      .sort((a, b) => b[1].used - a[1].used)
      .slice(0, limit)
      .map(([key, row]) => ({ key, used: row.used }));
  }
}

/** 테스트에서 장부를 들여다보거나 비울 때. */
export const _memoryStore = mem;
