// Where Jayverse runs — the cloud placement shown on /chains (jay, 2026-11-01: "display what cloud I use for the
// Jayverse service and chain in the Chain top menu", after asking whether that disclosure is a risk).
//
// The provider, the service kind and the city are public anyway (response headers, the devnet's IP block, the
// page's own "rendering on Cloud Run" line). What stays OFF this list on purpose: the project id, IPs, zones,
// machine types, service-account names and anything about billing — those are a map for an attacker, not
// information for a visitor. Both projects (Jayverse, Verex) checked on 2026-11-01, stopped resources included.
//
// Why two cities: Cloud Run cannot map a custom domain in Seoul (asia-northeast3 → 501), so the web services
// moved to Tokyo on 2026-07-27 (docs/history/2026-07-27-rabbit-history.md); the devnet VM needs no domain
// mapping and went to Seoul with the 2026-09-14 rollout.
import { prisma } from "./db";
import { IN_CLOUD } from "./chains";

export type Placement = {
  key: string;
  /** the Google Cloud project it lives in, as a reader-facing group (no project ids) */
  group: "jayverse" | "verex" | "outside";
  part: string; partKo: string;
  runsOn: string; runsOnKo: string;
  where: string; whereKo: string;
  running: string; runningKo: string;
  /** what the "Now" column reads. Live: a site URL (the probes /chains already makes), a chain, the database, or this
   *  page itself. `fixed`: the state the cloud config had when this list was checked — the page has no permission to
   *  read the cloud's own state (least privilege), and probing a sleeping staging service would wake it and bill it. */
  check:
    | { urls: string[] } | { chain: "devnet" | "sepolia" | "local" } | { db: true } | { self: true }
    | { fixed: "on" | "warm" | "sleeps" | "stopped" };
};

export const GROUPS: Record<Placement["group"], { title: string; titleKo: string }> = {
  jayverse: { title: "Jayverse — one Google Cloud project", titleKo: "Jayverse — Google Cloud 프로젝트 하나" },
  verex: { title: "Verex — its own Google Cloud project", titleKo: "Verex — 따로 둔 Google Cloud 프로젝트" },
  outside: { title: "Outside our cloud", titleKo: "우리 클라우드 밖" },
};

const RUN = { runsOn: "Google Cloud Run", runsOnKo: "Google Cloud Run" };
const SQL = { runsOn: "Google Cloud SQL (PostgreSQL)", runsOnKo: "Google Cloud SQL (PostgreSQL)" };
const TOKYO = { where: "Tokyo", whereKo: "도쿄" };
const SEOUL = { where: "Seoul", whereKo: "서울" };
const SLEEPS = { running: "0–1 container, wakes on a request", runningKo: "컨테이너 0–1개, 요청이 오면 깨어남" };
const ALWAYS = { running: "always on", runningKo: "항상 켜져 있음" };

// Checked against both projects on 2026-11-01 (gcloud run/compute/sql list, every status — stopped ones included).
export const PLACEMENTS: Placement[] = [
  { key: "rabbit", group: "jayverse", part: "Web app (this site)", partKo: "웹앱 (이 사이트)", ...RUN, ...TOKYO, ...SLEEPS, check: { self: true } },
  { key: "exchange", group: "jayverse", part: "Exchange", partKo: "Exchange", ...RUN, ...TOKYO, ...SLEEPS, check: { urls: ["https://exchange.jaylabs.xyz"] } },
  { key: "wallet", group: "jayverse", part: "Wallet", partKo: "Wallet", ...RUN, ...TOKYO, ...SLEEPS, check: { urls: ["https://wallet.jaylabs.xyz"] } },
  { key: "number", group: "jayverse", part: "Number", partKo: "Number", ...RUN, ...TOKYO, ...SLEEPS, check: { urls: ["https://number.jaylabs.xyz"] } },
  { key: "db", group: "jayverse", part: "Database", partKo: "데이터베이스", ...SQL, ...TOKYO, ...ALWAYS, check: { db: true } },
  {
    key: "devnet", group: "jayverse", part: "Jayverse devnet (313370)", partKo: "Jayverse 데브넷 (313370)",
    runsOn: "Google Compute Engine VM", runsOnKo: "Google Compute Engine VM", ...SEOUL,
    running: "always on — a chain has to keep making blocks", runningKo: "항상 켜져 있음 — 체인은 블록을 계속 만들어야 함",
    check: { chain: "devnet" },
  },
  {
    key: "verex-web", group: "verex", part: "Verex web", partKo: "Verex 웹", ...RUN, ...SEOUL,
    running: "0–2 containers, wakes on a request", runningKo: "컨테이너 0–2개, 요청이 오면 깨어남",
    check: { urls: ["https://verex.jaylabs.xyz"] },
  },
  {
    key: "verex-api", group: "verex", part: "Verex API", partKo: "Verex API", ...RUN, ...SEOUL,
    running: "1 container kept warm", runningKo: "컨테이너 1개를 늘 켜 둠", check: { fixed: "warm" },
  },
  { key: "verex-db", group: "verex", part: "Verex database", partKo: "Verex 데이터베이스", ...SQL, ...SEOUL, ...ALWAYS, check: { fixed: "on" } },
  {
    key: "verex-staging", group: "verex", part: "Verex staging — web + API", partKo: "Verex 스테이징 — 웹 + API", ...RUN, ...SEOUL,
    running: "0–1 container each, sleeps until used", runningKo: "각각 컨테이너 0–1개, 쓸 때까지 잠듦", check: { fixed: "sleeps" },
  },
  {
    key: "verex-staging-db", group: "verex", part: "Verex staging database", partKo: "Verex 스테이징 데이터베이스", ...SQL, ...SEOUL,
    running: "stopped — started by hand when staging is used", runningKo: "꺼져 있음 — 스테이징을 쓸 때 손으로 켬", check: { fixed: "stopped" },
  },
  {
    key: "sepolia", group: "outside", part: "Sepolia", partKo: "Sepolia",
    runsOn: "public Ethereum testnet", runsOnKo: "공개 이더리움 테스트넷", where: "—", whereKo: "—",
    running: "not ours to run", runningKo: "우리가 운영하지 않음", check: { chain: "sepolia" },
  },
  {
    key: "local", group: "outside", part: "Anvil (local fork)", partKo: "Anvil (로컬 포크)",
    runsOn: "jay's Mac — never in the cloud", runsOnKo: "jay의 Mac — 클라우드에 없음", where: "—", whereKo: "—",
    running: "only while jay runs it", runningKo: "jay가 켤 때만", check: { chain: "local" },
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
