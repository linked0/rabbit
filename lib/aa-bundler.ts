// Jayverse AA §7 — 번들러 환경 선택자. 설계: docs/features/jayverse-rabbit.md §7.
//
// 번들러는 Jayverse 서비스가 아니다 — Sepolia 에서는 thirdweb(호스티드)을 쓰고,
// 로컬 anvil 에서는 번들러 없이 scripts/aa-self-relay.mjs 가 EntryPoint.handleOps 를
// 직접 부른다(셀프 릴레이). anvil 은 Sepolia 의 chainId(11155111)를 그대로 보고하므로
// **chainId 로는 둘을 구분할 수 없다** — 그래서 명시적 플래그로만 가른다:
//
//   AA_MODE=local   → self-relay: 페이마스터 없음, RPC 는 ANVIL_RPC_URL(기본 127.0.0.1:8545)
//   AA_MODE=sepolia → thirdweb: sponsorGas 페이마스터 + 호스티드 번들러 (미설정 시 기본)
//
// 기본이 sepolia 인 이유: /live/aa 와 이 위의 /markets 는 로컬 dev 에서도 지금까지
// 실제 Sepolia 를 상대로 동작해 왔다 — APP_MODE=local 을 그대로 물려받으면 그 개발
// 루프가 끊긴다. 로컬 anvil 검증은 의도적으로 켜는 것(AA_MODE=local)이다.
export type AaBundlerEnv =
  | { mode: "self-relay"; rpcUrl: string; sponsorGas: false }
  | { mode: "thirdweb"; sponsorGas: true };

export function aaBundlerEnv(): AaBundlerEnv {
  if (process.env.AA_MODE === "local") {
    return {
      mode: "self-relay",
      rpcUrl: process.env.ANVIL_RPC_URL ?? "http://127.0.0.1:8545",
      sponsorGas: false,
    };
  }
  return { mode: "thirdweb", sponsorGas: true };
}
