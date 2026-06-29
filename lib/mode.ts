// 실행 모드 스위치 (plan §1): APP_MODE=local|cloud
// 미설정 시 Cloud Run 환경변수(K_SERVICE)로 자동 감지
export type AppMode = "local" | "cloud";

export function appMode(): AppMode {
  const mode = process.env.APP_MODE;
  if (mode === "local" || mode === "cloud") return mode;
  return process.env.K_SERVICE ? "cloud" : "local";
}
