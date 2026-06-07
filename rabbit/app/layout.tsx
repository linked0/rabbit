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
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
