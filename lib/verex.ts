import { appMode } from "@/lib/mode";

// Verex 링크 — 환경별로 분기 (원래 Nav.tsx의 메뉴용이었으나, 2026-07-25 메뉴 항목이
// 홈의 피처드 카드로 대체되며 이곳으로 이동).
//  - 로컬(appMode local): http://localhost:3000/
//  - 운영 서버(cloud): https://verex.jaylabs.xyz
// 테스트 서버 분기는 제거 (2026-07-25) — 운영 서버 1대 체제로 정리.
export function verexUrl(): string {
  return appMode() === "cloud" ? "https://verex.jaylabs.xyz" : "http://localhost:3000/";
}
