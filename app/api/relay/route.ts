import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// C4 관찰자 — 공개 relay Data API 폴링 (키 불필요, 공개 라우트).
// proposer_payload_delivered = 각 relay가 실제로 제안자에게 전달한(=블록에 들어간) 페이로드.
// 설계: docs/features/xyz-demo.md (C4 dashboard) · relay-specs: https://flashbots.github.io/relay-specs/
// 관측 대상 = Ethereum 메인넷의 mev-boost relay들 (공개 Data API에 실제 트래픽이 있는 곳).
const NETWORK = "Ethereum Mainnet";
const ENDPOINT = "/relay/v1/data/bidtraces/proposer_payload_delivered";
const RELAYS = [
  { name: "Flashbots", url: "https://boost-relay.flashbots.net" },
  { name: "bloXroute (max profit)", url: "https://bloxroute.max-profit.blxrbdn.com" },
  { name: "Agnostic", url: "https://agnostic-relay.net" },
  { name: "Ultra Sound", url: "https://relay.ultrasound.money" },
];

const LIMIT = 20;
const TIMEOUT_MS = 6000;

// relay Data API 응답(부분) — 필요한 필드만.
type Delivered = {
  slot: string;
  block_number: string;
  block_hash: string;
  builder_pubkey: string;
  value: string; // wei
  num_tx: string;
};

async function pollRelay(r: { name: string; url: string }) {
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `${r.url}/relay/v1/data/bidtraces/proposer_payload_delivered?limit=${LIMIT}`,
      { signal: ctrl.signal, cache: "no-store", headers: { accept: "application/json" } }
    );
    const latencyMs = Date.now() - started;
    if (!res.ok) return { ...r, ok: false, latencyMs, error: `HTTP ${res.status}`, entries: [] };
    const raw = (await res.json()) as Delivered[];
    const entries = (Array.isArray(raw) ? raw : []).map((d) => ({
      slot: d.slot,
      blockNumber: d.block_number,
      blockHash: d.block_hash,
      builder: d.builder_pubkey,
      valueWei: d.value,
      numTx: d.num_tx,
    }));
    const host = new URL(r.url).host;
    return { ...r, host, ok: true, latencyMs, error: null, entries };
  } catch (e) {
    return {
      ...r,
      host: new URL(r.url).host,
      ok: false,
      latencyMs: Date.now() - started,
      error: String(e instanceof Error ? e.message : e),
      entries: [],
    };
  } finally {
    clearTimeout(timer);
  }
}

// GET /api/relay — 여러 relay를 동시에 폴링해 delivered 블록 + relay별 지연을 반환. 공개.
export async function GET() {
  const relays = await Promise.all(RELAYS.map(pollRelay));
  return NextResponse.json({
    network: NETWORK,
    endpoint: ENDPOINT,
    limit: LIMIT,
    relays,
    fetchedAt: new Date().toISOString(),
  });
}
