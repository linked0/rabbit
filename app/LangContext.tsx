"use client";

import { createContext, useContext, useEffect, useState } from "react";

// 앱 언어 상태(ko/en). localStorage에 저장, <html lang> 반영. 테마 토글과 같은 패턴.
export type Lang = "ko" | "en";

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "ko",
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ko");

  useEffect(() => {
    // layout 인라인 스크립트가 미리 <html lang>을 설정 → 그 값을 초기값으로.
    const initial =
      (localStorage.getItem("lang") as Lang) ||
      (document.documentElement.lang as Lang) ||
      "ko";
    setLangState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    document.documentElement.lang = l;
    try {
      localStorage.setItem("lang", l);
    } catch {
      /* localStorage 불가 시 무시 */
    }
  };

  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
