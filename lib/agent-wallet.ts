import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import type { Hex } from "viem";

// J2 / R-A — 에이전트의 키.
//
// 계획서의 D2 결정: **키는 rabbit 서버에 산다.** 브라우저에는 주소만 나가고
// 개인키는 나가지 않는다. 이것은 프로덕션 수탁 방식이 아니며, 그렇게 주장하지도
// 않는다 — 페이지에 "testnet-grade"라고 적는 이유이고, 계획서
// *What this will not prove* 에 이미 한 줄로 들어가 있다.
//
// 안전 주장 전체는 키가 아니라 **금액**에 있다: 에이전트는 mandate 로 풀려난
// 것만 잃을 수 있다. 키가 서버에 있다는 사실이 그 주장을 약화시키지 않는 이유가
// 그것이다 — 키를 훔쳐도 상한을 넘길 수 없다.

let cached: { key: Hex; address: `0x${string}` } | null = null;

/// 키가 없을 때 새로 만들어 쓰지 **않는** 이유: mandate 는 주소로 위임된다.
/// 재시작마다 주소가 바뀌면 이미 부여된 위임이 가리키는 대상이 사라지고,
/// "만료 전까지는 유효하다"는 데모의 주장이 조용히 거짓이 된다.
/// 개발 편의로 생성은 허용하되, 그 사실을 크게 알리고 재시작 시 사라짐을 밝힌다.
function load(): { key: Hex; address: `0x${string}` } {
  if (cached) return cached;

  const fromEnv = process.env.AGENT_PRIVATE_KEY as Hex | undefined;
  if (fromEnv) {
    const account = privateKeyToAccount(fromEnv);
    cached = { key: fromEnv, address: account.address };
    return cached;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AGENT_PRIVATE_KEY is not set. The mandate is delegated to an address, so a key that " +
        "changes on restart would silently orphan every grant already made.",
    );
  }

  const key = generatePrivateKey();
  const account = privateKeyToAccount(key);
  console.warn(
    `[agent-wallet] AGENT_PRIVATE_KEY not set — generated an ephemeral key for ${account.address}. ` +
      `It will NOT survive a restart, and any mandate granted to it dies with the process. ` +
      `Set AGENT_PRIVATE_KEY to make it stable.`,
  );
  cached = { key, address: account.address };
  return cached;
}

/// 서버 전용. 라우트 핸들러 밖으로 절대 나가면 안 된다.
export function agentAccount() {
  return privateKeyToAccount(load().key);
}

/// 브라우저에 보내도 되는 유일한 것.
export function agentAddress(): `0x${string}` {
  return load().address;
}

/// 키가 환경변수에서 왔는지(= 재시작을 견디는지). UI 가 경고를 띄울지 정하는 데 쓴다.
export function agentKeyIsPersistent(): boolean {
  return Boolean(process.env.AGENT_PRIVATE_KEY);
}

/// throw 하지 않는 주소 조회. 배포 사이트(로컬 전용 콘솔을 prod 에서 연 경우)처럼
/// 키가 없을 때 `agentAddress()` 는 500 을 던지지만, 프리플라이트는 그 상황 자체를
/// **패널에 보여줘야** 하므로 null 로 받아 우아하게 처리한다 (jay, 2026-09-04).
export function agentAddressOrNull(): `0x${string}` | null {
  try {
    return load().address;
  } catch {
    return null;
  }
}
