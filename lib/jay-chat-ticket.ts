// Jay Chat 입장권 — 페이지가 발급하는 서명 쿠키 (T1 §1.9 item 2).
//
// 왜: 지금은 누구나 `/api/jay-chat` 을 바로 부를 수 있다. 페이지가 쿠키를 주고 API 가
// 그걸 요구하면, 스크립트는 신원 하나마다 페이지를 먼저 불러야 한다. 공격을 막지는
// 못해도 **값을 올리고**, 무엇보다 사람마다 하루 몫을 매길 안정적인 키가 생긴다
// (IP 는 통신사 NAT 에서 수천 명이 공유하고, 반대로 한 사람이 매번 바뀌기도 한다).
//
// 형식: `<id>.<firstSeen>.<exp>.<sig>`  — 모두 base64url, sig 는 앞 세 조각의 HMAC-SHA256.
// `firstSeen` 을 따로 들고 다니는 이유: 재발급돼도 "언제 처음 왔나"가 유지돼야
// "하루 넘은 쿠키 = 돌아온 방문자"(§1.9 item 4)를 판단할 수 있다.
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export const TICKET_COOKIE = "jc_t";
const TTL_MS = Number(process.env.JAY_CHAT_TICKET_TTL_MS || 12 * 60 * 60 * 1000); // 12시간
/** 이 시간이 지난 쿠키를 가진 사람은 "돌아온 방문자"로 본다. */
const RETURNING_AFTER_MS = Number(process.env.JAY_CHAT_RETURNING_AFTER_MS || 24 * 60 * 60 * 1000);

function secret(): string {
  // AUTH_SECRET 은 이미 배포 환경에 있다. 전용 값을 주면 그걸 쓴다.
  return process.env.JAY_CHAT_TICKET_SECRET || process.env.AUTH_SECRET || "";
}

const b64 = (b: Buffer) => b.toString("base64url");

function sign(payload: string): string {
  return b64(createHmac("sha256", secret()).update(payload).digest());
}

export function issueTicket(prev?: string | null): string {
  const now = Date.now();
  const parsed = prev ? parse(prev) : null;
  // 재발급이면 id 와 firstSeen 을 이어받는다 — 그래야 "돌아온 방문자"가 유지된다.
  const id = parsed?.id ?? b64(randomBytes(12));
  const firstSeen = parsed?.firstSeen ?? now;
  const payload = `${id}.${firstSeen}.${now + TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

type Parsed = { id: string; firstSeen: number; exp: number };

/** 서명만 확인하고 조각을 돌려준다 (만료는 보지 않는다 — 재발급이 firstSeen 을 이어받아야 하므로). */
function parse(raw: string): Parsed | null {
  const parts = raw.split(".");
  if (parts.length !== 4) return null;
  const [id, firstSeenS, expS, sig] = parts;
  const expect = sign(`${id}.${firstSeenS}.${expS}`);
  // 길이가 다르면 timingSafeEqual 이 던진다 — 먼저 거른다.
  if (sig.length !== expect.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  const firstSeen = Number(firstSeenS);
  const exp = Number(expS);
  if (!Number.isFinite(firstSeen) || !Number.isFinite(exp)) return null;
  return { id, firstSeen, exp };
}

export type Ticket = { id: string; returning: boolean };

/** API 쪽 검증: 서명이 맞고 아직 살아 있어야 한다. */
export function verifyTicket(raw: string | undefined | null, now = Date.now()): Ticket | null {
  if (!secret()) return null; // 비밀값이 없으면 아무 쿠키도 유효하지 않다 (열어 두지 않는다)
  if (!raw) return null;
  const p = parse(raw);
  if (!p || p.exp < now) return null;
  return { id: p.id, returning: now - p.firstSeen >= RETURNING_AFTER_MS };
}

/** 비밀값이 없으면 쿠키 검사를 켤 수 없다 — 그 사실을 호출부가 알아야 한다. */
export function ticketsConfigured(): boolean {
  return Boolean(secret());
}

export function ticketCookie(value: string): string {
  const maxAge = Math.floor(TTL_MS / 1000);
  const secure = process.env.APP_MODE === "cloud" ? "; Secure" : "";
  // HttpOnly 로 둔다 — 페이지 스크립트가 읽을 필요가 없고, XSS 로 새 나가는 길을 막는다.
  return `${TICKET_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}
