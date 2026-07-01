import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "./LangContext";

export const metadata: Metadata = {
  title: "rabbit — Crypto Portfolio Summary",
  description: "내 암호화폐 포트폴리오의 현재 수익성과 미래 전망 (PoC)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 페인트 전에 테마·언어 적용 (플래시 방지). 기본 theme=light, lang=ko. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme')||'light';document.documentElement.setAttribute('data-theme',t);var l=localStorage.getItem('lang')||'ko';document.documentElement.lang=l;}catch(e){}})();",
          }}
        />
      </head>
      <body>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
