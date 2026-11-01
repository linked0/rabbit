// Where Jayverse runs — the cloud placement shown on /chains (jay, 2026-11-01: "display what cloud I use for the
// Jayverse service and chain in the Chain top menu", after asking whether that disclosure is a risk).
//
// The provider, the service kind and the city are public anyway (response headers, the devnet's IP block, the
// page's own "rendering on Cloud Run" line). What stays OFF this list on purpose: the project id, IPs, zones,
// machine types, service-account names and anything about billing — those are a map for an attacker, not
// information for a visitor. Checked against the live project on 2026-11-01 (gcloud run/compute/sql list).
//
// Why two cities: Cloud Run cannot map a custom domain in Seoul (asia-northeast3 → 501), so the web services
// moved to Tokyo on 2026-07-27 (docs/history/2026-07-27-rabbit-history.md); the devnet VM needs no domain
// mapping and went to Seoul with the 2026-09-14 rollout.
import { prisma } from "./db";
import { IN_CLOUD } from "./chains";

export type Placement = {
  key: string;
  part: string; partKo: string;
  runsOn: string; runsOnKo: string;
  where: string; whereKo: string;
  running: string; runningKo: string;
  /** what the live check reads: Jayverse service URLs (the probes /chains already makes), a chain, the devnet status, or the database */
  check: { urls: string[] } | { chain: "devnet" | "sepolia" | "local" } | { db: true } | { self: true };
};

export const PLACEMENTS: Placement[] = [
  {
    key: "rabbit", part: "Web app (this site)", partKo: "웹앱 (이 사이트)",
    runsOn: "Google Cloud Run", runsOnKo: "Google Cloud Run", where: "Tokyo", whereKo: "도쿄",
    running: "0–1 container, wakes on a request", runningKo: "컨테이너 0–1개, 요청이 오면 깨어남",
    check: { self: true },
  },
  {
    key: "exchange", part: "Exchange · Wallet · Number", partKo: "Exchange · Wallet · Number",
    runsOn: "Google Cloud Run", runsOnKo: "Google Cloud Run", where: "Tokyo", whereKo: "도쿄",
    running: "0–1 container each", runningKo: "각각 컨테이너 0–1개",
    check: { urls: ["https://exchange.jaylabs.xyz", "https://wallet.jaylabs.xyz", "https://number.jaylabs.xyz"] },
  },
  {
    key: "db", part: "Database", partKo: "데이터베이스",
    runsOn: "Google Cloud SQL (PostgreSQL)", runsOnKo: "Google Cloud SQL (PostgreSQL)", where: "Tokyo", whereKo: "도쿄",
    running: "always on", runningKo: "항상 켜져 있음",
    check: { db: true },
  },
  {
    key: "devnet", part: "Jayverse devnet (313370)", partKo: "Jayverse 데브넷 (313370)",
    runsOn: "Google Compute Engine VM", runsOnKo: "Google Compute Engine VM", where: "Seoul", whereKo: "서울",
    running: "always on — a chain has to keep making blocks", runningKo: "항상 켜져 있음 — 체인은 블록을 계속 만들어야 함",
    check: { chain: "devnet" },
  },
  {
    key: "sepolia", part: "Sepolia", partKo: "Sepolia",
    runsOn: "public Ethereum testnet", runsOnKo: "공개 이더리움 테스트넷", where: "—", whereKo: "—",
    running: "not ours to run", runningKo: "우리가 운영하지 않음",
    check: { chain: "sepolia" },
  },
  {
    key: "local", part: "Anvil (local fork)", partKo: "Anvil (로컬 포크)",
    runsOn: "jay's Mac — never in the cloud", runsOnKo: "jay의 Mac — 클라우드에 없음", where: "—", whereKo: "—",
    running: "only while jay runs it", runningKo: "jay가 켤 때만",
    check: { chain: "local" },
  },
];

// The page refreshes every 5 s; the database is asked at most every 30 s, with a 2 s ceiling, so a viewer
// leaving the tab open is one `SELECT 1` per half minute, not twelve.
let dbPing: { at: number; ok: boolean } | null = null;

/** true/false on the live site; null where the answer would not be about Cloud SQL (local runs). */
export async function pingDatabase(): Promise<boolean | null> {
  if (!IN_CLOUD || !process.env.DATABASE_URL) return null;
  if (dbPing && Date.now() - dbPing.at < 30_000) return dbPing.ok;
  let ok = false;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000)),
    ]);
    ok = true;
  } catch {
    ok = false;
  }
  dbPing = { at: Date.now(), ok };
  return ok;
}
