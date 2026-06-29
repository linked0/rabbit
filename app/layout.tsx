import type { Metadata } from "next";
import "./globals.css";

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
        {/* 페인트 전에 테마 적용 (플래시 방지). 기본 light. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
