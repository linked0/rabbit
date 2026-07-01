"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";

// 앱 언어 상태(ko/en). 진실 원천은 `lang` 쿠키(서버가 읽음) — 서버 컴포넌트도 번역되게.
// localStorage는 클라이언트 편의용, <html lang>도 함께 반영. 초기값은 서버(layout)가 주입.
const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "ko",
  setLang: () => {},
});

function readCookieLang(): Lang | null {
  const m = document.cookie.match(/(?:^|;\s*)lang=(ko|en)/);
  return (m?.[1] as Lang) ?? null;
}

export function LangProvider({
  initial,
  children,
}: {
  initial: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initial);
  const router = useRouter();

  useEffect(() => {
    const c = readCookieLang() || (localStorage.getItem("lang") as Lang) || initial;
    document.documentElement.lang = c;
    if (c !== lang) setLangState(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    document.documentElement.lang = l;
    try {
      localStorage.setItem("lang", l);
    } catch {
      /* 무시 */
    }
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh(); // 서버 컴포넌트를 새 쿠키로 다시 렌더
  };

  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
