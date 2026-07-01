import { cookies } from "next/headers";
import type { Lang } from "./i18n";

// 서버 전용: 요청 쿠키에서 언어를 읽는다(기본 ko). 클라이언트 토글이 lang 쿠키를 세팅.
export function getLang(): Lang {
  try {
    return cookies().get("lang")?.value === "en" ? "en" : "ko";
  } catch {
    return "ko";
  }
}
