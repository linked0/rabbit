import { appMode } from "@/lib/mode";
import { jayverse, projectUrl, isLocalHost } from "@/lib/jayverse";

// Verex 링크 — 환경별로 분기 (원래 Nav.tsx의 메뉴용이었으나, 2026-07-25 메뉴 항목이
// 홈의 피처드 카드로 대체되며 이곳으로 이동).
//  - 운영 서버(cloud): https://verex.jaylabs.xyz
//  - 로컬: 브라우저가 실제로 rabbit 에 닿은 호스트의 3000 포트
// 테스트 서버 분기는 제거 (2026-07-25) — 운영 서버 1대 체제로 정리.
//
// host 를 받는 이유: 예전에는 로컬이면 무조건 http://localhost:3000/ 을 돌려줬는데,
// Tailscale 로 폰에서 열면 localhost 는 **폰 자신**을 가리켜 링크가 죽는다. 요청의
// Host 헤더를 넘기면 100.x.y.z:3000 처럼 브라우저가 닿을 수 있는 주소가 된다
// (jay, 2026-09-15). host 를 안 넘기면 예전처럼 appMode() 로만 판단한다.
export function verexUrl(host?: string | null): string {
  // Host 를 알면 그것만으로 결정한다. appMode() 는 환경변수라 실제 접속 경로와
  // 어긋날 수 있고, 어긋났을 때 나오는 답이 항상 틀린 쪽이다 — 공개 도메인으로
  // 들어온 방문자에게 localhost 링크를 주는 경우가 그렇다.
  if (host) {
    return isLocalHost(host)
      ? (projectUrl(jayverse("verex"), host) ?? "https://verex.jaylabs.xyz")
      : "https://verex.jaylabs.xyz";
  }
  return appMode() === "cloud" ? "https://verex.jaylabs.xyz" : "http://localhost:3000/";
}
