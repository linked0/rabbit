"use client";

import { useLang } from "./LangContext";

// 한국어/English 전환 버튼 (테마 토글 옆). 라벨은 "전환하면 될 언어"를 보여줌.
export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <button
      className="ghost"
      onClick={() => setLang(lang === "ko" ? "en" : "ko")}
      aria-label="언어 전환 / Toggle language"
      title={lang === "ko" ? "Switch to English" : "한국어로 전환"}
    >
      {lang === "ko" ? "EN" : "KO"}
    </button>
  );
}
