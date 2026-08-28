// J2 — 콘솔의 fetch 래퍼. **응답이 JSON 이 아닐 때 무엇이 왔는지 말한다.**
//
// `fetch(url).then((r) => r.json())` 은 서버가 무엇을 보냈든 브라우저의 파서
// 에러 하나로 뭉갠다. 이 콘솔에서 같은 실패를 두 번 만났다 (2026-08-27, 08-28):
//
//   Unexpected token '<', "<!DOCTYPE "…   ← 로그인 페이지 HTML 이 왔다
//   Unexpected end of JSON input          ← 본문이 아예 비어 있었다 (핸들러가 던짐)
//
// 두 문장 모두 **상태 코드도, 경로도, 원인도** 말하지 않는다. 화면에는 파서
// 에러가 뜨고 진짜 원인은 매번 dev 터미널에서 따로 찾아야 했다 — 어제 고친 것은
// 첫 번째 원인(미들웨어 리다이렉트)이었지, 그것을 가린 이 **형태**가 아니었다.
//
// 유효한 JSON 이 온 경우의 동작은 바꾸지 않는다. 호출부는 지금처럼 `r.error` 를
// 직접 본다 — 여기서 `!res.ok` 를 던지게 만들면 401 의 정직한 본문까지 삼킨다.
export async function fetchJson<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? "GET";
  const res = await fetch(url, init);
  const text = await res.text();

  if (!text) {
    throw new Error(
      `${method} ${url} → ${res.status}, empty body` +
        (res.status >= 500
          ? " — the route handler threw. The stack trace is in the terminal running `pnpm dev`."
          : ""),
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const ct = res.headers.get("content-type") ?? "no content-type";
    const looksLikeHtml = text.trimStart().startsWith("<");
    throw new Error(
      `${method} ${url} → ${res.status}, ${ct} — not JSON` +
        (looksLikeHtml ? " (an HTML page; usually a redirect to /login)" : "") +
        `: ${text.slice(0, 120)}`,
    );
  }
}
