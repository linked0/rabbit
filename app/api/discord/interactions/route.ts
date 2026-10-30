import { createPublicKey, verify } from "node:crypto";

// Discord 인터랙션 엔드포인트 (T4 3단계, jay 2026-10-30). Developer Portal 의
// "Interactions Endpoint URL" 이 이 경로를 가리킨다. 슬래시 명령이 게이트웨이 소켓 없이
// HTTP POST 로 들어오므로 Cloud Run 의 scale-to-zero 와 맞는다.
//
// 로그인 대신 **서명이 곧 보호 장치**다 (middleware.ts PUBLIC_PATHS). Discord 는 모든 요청에
// X-Signature-Ed25519 / X-Signature-Timestamp 를 붙이고, 우리는 `timestamp + raw body` 를
// 애플리케이션의 공개 키(DISCORD_PUBLIC_KEY)로 검증한다. URL 을 저장할 때 Discord 는 서명된
// PING 에 `{"type":1}` 이 오는지, 그리고 일부러 틀린 서명에 401 이 오는지 둘 다 본다 —
// 저장 전에 이 라우트가 배포돼 있어야 하는 이유다 (2026-10-30, 포털의 "인증할 수 없습니다").
//
// 지금은 검증 + PING 까지다. /ask(지연 응답 + Cloud Tasks 후속)와 /status 는 4단계에서 붙는다.
// 그 전에 명령이 들어오면 본인에게만 보이는 안내로 답한다.
export const dynamic = "force-dynamic";

// Ed25519 공개 키 32바이트 앞에 붙는 SPKI DER 머리 — node:crypto 는 키를 이 형식으로 받는다.
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
// 오래된 요청을 다시 보내는 재전송을 막는 창. Discord 의 요청은 보낸 직후 도착한다.
const MAX_SKEW_SEC = 5 * 60;

function isSignedByDiscord(body: string, sig: string, ts: string, publicKeyHex: string): boolean {
  if (!/^[0-9a-f]{128}$/i.test(sig) || !/^[0-9a-f]{64}$/i.test(publicKeyHex) || !/^\d+$/.test(ts)) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > MAX_SKEW_SEC) return false;
  const key = createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(publicKeyHex, "hex")]),
    format: "der",
    type: "spki",
  });
  return verify(null, Buffer.from(ts + body), key, Buffer.from(sig, "hex"));
}

export async function POST(req: Request) {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) return Response.json({ error: "DISCORD_PUBLIC_KEY not set" }, { status: 503 });

  // 검증은 원문 그대로의 바이트로 한다 — JSON 으로 파싱했다 다시 쓰면 서명이 맞지 않는다.
  const body = await req.text();
  const sig = req.headers.get("x-signature-ed25519") ?? "";
  const ts = req.headers.get("x-signature-timestamp") ?? "";
  if (!isSignedByDiscord(body, sig, ts, publicKey)) {
    return Response.json({ error: "invalid request signature" }, { status: 401 });
  }

  let interaction: { type?: number };
  try {
    interaction = JSON.parse(body);
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }

  if (interaction.type === 1) return Response.json({ type: 1 }); // PING → PONG
  if (interaction.type === 2) {
    // APPLICATION_COMMAND: type 4 = 바로 답장, flags 64 = 명령을 쓴 사람에게만 보임.
    return Response.json({
      type: 4,
      data: { content: "Jay's bot is not answering commands yet. /ask and /status are coming.", flags: 64 },
    });
  }
  return Response.json({ error: "unsupported interaction type" }, { status: 400 });
}
