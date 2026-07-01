import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "./LangContext";
import { getLang } from "@/lib/lang";

export const metadata: Metadata = {
  title: "rabbit — Crypto Portfolio Summary",
  description: "내 암호화폐 포트폴리오의 현재 수익성과 미래 전망 (PoC)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = getLang(); // 쿠키 기반 — 서버 렌더부터 올바른 언어
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* 페인트 전에 테마 적용 (플래시 방지). 기본 light. 언어는 서버가 <html lang>로 설정. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();",
          }}
        />
      </head>
      <body>
        <LangProvider initial={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
