// 클라이언트/서버 공용 i18n 헬퍼 (next/headers 미포함 → 클라이언트에서도 import 가능).
export type Lang = "ko" | "en";

// 현재 언어에 맞는 문자열을 고른다: pick(lang, "한국어", "English")
export function pick(lang: Lang, ko: string, en: string): string {
  return lang === "en" ? en : ko;
}
