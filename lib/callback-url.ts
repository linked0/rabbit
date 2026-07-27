// 로그인 후 돌아갈 경로(`?callbackUrl=`) 정리 (2026-07-27, jay — "로그인하면 원래 보던
// 페이지로 돌아와야 한다").
//
// 쿼리스트링은 사용자가 마음대로 쓸 수 있으므로 그대로 redirect 에 넣으면 오픈 리디렉트가
// 된다 — `?callbackUrl=https://evil.example` 로 우리 도메인을 발판 삼아 남의 사이트로
// 보내버릴 수 있다. 그래서 "우리 사이트 안의 절대 경로"만 통과시킨다:
//   - `/` 로 시작해야 하고
//   - `//evil.com`, `/\evil.com`(브라우저가 프로토콜 상대 URL 로 읽는다)은 거부
export const DEFAULT_AFTER_LOGIN = "/summary";

export function safeCallbackUrl(raw: string | undefined | null, fallback = DEFAULT_AFTER_LOGIN) {
  if (!raw || !raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
