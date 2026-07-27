"use client";

import { signIn } from "next-auth/react";

// Google 로그인 버튼 — 클라이언트에서 next-auth/react 의 signIn() 을 부른다.
//
// 왜 서버 액션이 아니라 이쪽인가 (2026-07-27, jay):
// 예전엔 로그인 폼이 `"use server"` 액션 안에서 signIn("google") 을 호출했다. 그 경로로는
// 운영에서 로그인이 한 번도 성공한 적이 없다 — 2026-07-25 리비전부터 계속
// `InvalidCheck: pkceCodeVerifier value could not be parsed` 였다. 서버 액션 응답이 심는
// PKCE 쿠키가 구글 콜백 시점에 읽히지 않는다(액션이 외부 URL 로 리다이렉트할 때 Set-Cookie
// 가 유실됨). 반면 Auth.js 기본 경로(`GET /api/auth/csrf` → `POST /api/auth/signin/google`)는
// 운영에서 curl 로 확인했을 때 PKCE 쿠키를 정상적으로 심고 되읽는다.
// next-auth/react 의 signIn() 이 바로 그 경로를 그대로 탄다.
export default function GoogleSignInButton({
  callbackUrl,
  label,
}: {
  callbackUrl: string;
  label: string;
}) {
  return (
    <button type="button" onClick={() => signIn("google", { callbackUrl })}>
      {label}
    </button>
  );
}
