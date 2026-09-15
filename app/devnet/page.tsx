import Nav from "../Nav";
import NotifyPageView from "@/app/NotifyPageView";
import AutoRefresh from "./AutoRefresh";
import {
  fetchStatus, fetchRegistry, fetchRecentBlocks, probe,
  CONTRACT_GROUPS, SERVICES, DEVNET_URL, DEVNET_RPC, DEVNET_EXPLORER, DEVNET_CHAIN_ID,
} from "@/lib/devnet";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import type { Address } from "viem";

// The Jayverse devnet at a glance (jay, 2026-09-15): "what is on our chain, and
// is it alive". Everything here was previously only reachable with `cast call`
// against the Registry, which meant nobody looked at it.
//
// Laid out as a dashboard rather than a document (jay, 2026-09-15: "grafana
// style, simpler"). The first version answered "is it alive" in prose, so you
// had to read a paragraph to learn a number. Numbers come first now; sentences
// appear only where the chain genuinely cannot speak for itself.
//
// Rendered on the server and never cached: a status page that can show a stale
// block number is worse than no status page, because it reports health it has
// not checked.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Devnet — Jayverse",
  description: "Jayverse devnet (chain 313370): live status and the on-chain address book.",
};

// Age is measured against the chain's own head, not against wall-clock time.
//
// Anvil continues the forked block's timestamp at one second per block, so the
// chain's clock sits a fixed distance behind the real one — 18.8h at the time
// of writing, and it only grows. Subtracting a block timestamp from Date.now()
// therefore gave the SAME answer for every row ("18h ago"), which looked like a
// frozen chain when the chain was fine and the comparison was wrong
// (jay, 2026-09-15). Distance from the head is the honest measure here.
const fmtAge = (sec: number, ko: boolean) => {
  if (sec <= 0) return ko ? "최신" : "head";
  if (sec < 60) return ko ? `${sec}초 전` : `${sec}s`;
  if (sec < 3600) return ko ? `${Math.floor(sec / 60)}분 전` : `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return ko ? `${Math.floor(sec / 3600)}시간 전` : `${Math.floor(sec / 3600)}h`;
  return ko ? `${Math.floor(sec / 86400)}일 전` : `${Math.floor(sec / 86400)}d`;
};

/** The chain clock's distance from the real one, as a human phrase. */
const fmtSkew = (sec: number) => {
  const h = Math.floor(sec / 3600);
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
};

const fmtUptime = (sec?: number) => {
  if (sec == null) return "—";
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  return `${d ? `${d}d ` : ""}${h ? `${h}h ` : ""}${m}m`;
};

function Addr({ address }: { address: string }) {
  return (
    <a href={`${DEVNET_EXPLORER}/address/${address}`} target="_blank" rel="noreferrer" className="gf-mono">
      {address}
    </a>
  );
}

function Stat({ label, value, sub, tone }: {
  label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "ok" | "bad";
}) {
  return (
    <div className="gf-stat">
      <div className="gf-label">{label}</div>
      <div className={`gf-value${tone ? ` gf-${tone}` : ""}`}>{value}</div>
      {sub && <div className="gf-sub">{sub}</div>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="gf-panel">
      <h2>{title}</h2>
      <div className="gf-panel-body">{children}</div>
    </section>
  );
}

export default async function DevnetPage() {
  const lang = getLang();
  const ko = lang === "ko";
  const status = await fetchStatus();

  // The Registry address comes from the status payload, but the CONTENTS are
  // read from the contract — see the note in lib/devnet.ts.
  const registryAddress = status.registry?.registry as Address | undefined;
  // Every name any section wants, asked for once.
  const wanted = Array.from(
    new Set([...CONTRACT_GROUPS.flatMap((g) => g.names), ...SERVICES.flatMap((s) => s.contracts)]),
  );
  const [{ book, count }, blocks, liveness] = await Promise.all([
    registryAddress
      ? fetchRegistry(registryAddress, wanted)
      : Promise.resolve({ book: {} as Record<string, Address>, count: null as number | null }),
    fetchRecentBlocks(8),
    Promise.all(SERVICES.map((svc) => probe(svc.url))),
  ]);

  const found = Object.keys(book).length;
  // The newest block we read — the reference point for every row's age, and
  // the thing that tells us how far the chain clock has drifted from ours.
  const head = blocks.length ? Math.max(...blocks.map((b) => b.timestamp)) : 0;
  const skew = head ? Math.floor(Date.now() / 1000) - head : 0;

  return (
    <>
      <Nav />
      <NotifyPageView path="/devnet" />
      {/* 블록이 늘어나는 것이 "살아 있다"의 유일한 신호라, 멈춰 있는 숫자는 멈춘 체인과 구별되지 않는다. */}
      <AutoRefresh seconds={5} />
      <main>
        <h1>Jayverse Devnet</h1>
        <p className="muted" style={{ fontSize: 13 }}>
          {pick(
            lang,
            `우리 체인 — Sepolia 를 포크해 상시 가동 중인 Anvil, 체인 아이디 ${DEVNET_CHAIN_ID}. 모든 Jayverse 서비스가 Sepolia 대신 여기를 바라봅니다.`,
            `Our own chain — an always-on Anvil forked from Sepolia, at chain id ${DEVNET_CHAIN_ID}. Every Jayverse service targets this instead of Sepolia.`,
          )}
        </p>

        {status.error && (
          <p className="small gf-bad">
            {pick(lang, "데브넷이 응답하지 않았습니다: ", "The devnet did not answer: ")}
            {status.error}
          </p>
        )}

        {/* ---- stat row ---- */}
        <div className="gf-row">
          <Stat
            label={pick(lang, "상태", "Status")}
            value={status.healthy ? pick(lang, "정상", "healthy") : pick(lang, "응답 없음", "unreachable")}
            tone={status.healthy ? "ok" : "bad"}
            sub={status.mode === "fork" ? pick(lang, "Sepolia 포크", "fork of Sepolia") : pick(lang, "자체 제네시스", "own genesis")}
          />
          <Stat
            label={pick(lang, "최신 블록", "Latest block")}
            value={status.blockNumber?.toLocaleString() ?? "—"}
            sub={pick(lang, "블록 1초", "1s block time")}
          />
          <Stat label={pick(lang, "체인 아이디", "Chain id")} value={status.chainId ?? "—"} />
          {/* 이 타일이 없으면 블록 시각이 왜 "지금"이 아닌지 설명할 데가 없다. */}
          {head > 0 && (
            <Stat
              label={pick(lang, "체인 시계", "Chain clock")}
              value={fmtSkew(skew)}
              sub={pick(lang, "실제 시각보다 뒤", "behind real time")}
            />
          )}
          <Stat
            label={pick(lang, "포크 지점", "Forked at")}
            value={status.forkBlock ? Number(status.forkBlock).toLocaleString() : "—"}
            sub={pick(lang, "Sepolia 블록", "Sepolia block")}
          />
          <Stat label={pick(lang, "엣지 가동", "Edge uptime")} value={fmtUptime(status.proxyUptimeSeconds)} />
          {status.faucet && !status.faucet.error && (
            <Stat
              label={pick(lang, "포싯 잔여", "Faucet left")}
              value={`${status.faucet.remainingTodayEth} ETH`}
              sub={pick(
                lang,
                `오늘 ${status.faucet.dailyBudgetEth} 중 · 요청당 ${status.faucet.payoutEth}`,
                `of ${status.faucet.dailyBudgetEth} today · ${status.faucet.payoutEth} per request`,
              )}
            />
          )}
          <Stat
            label={pick(lang, "Registry 이름", "Registry names")}
            value={count ?? "—"}
            sub={pick(lang, `${found}개 표시`, `${found} shown`)}
          />
        </div>

        {/* ---- recent blocks — 맨 위 (jay, 2026-09-15). 이 페이지에 와서 가장 먼저
             확인하는 것이 "지금 돌고 있나"이고, 그 답은 블록이 늘어나는 것이다.
             해시 열은 뺐다 — 18자를 잘라 보여줘 봐야 읽히지 않고, 필요하면 블록
             번호가 탐색기로 데려간다. ---- */}
        <Panel title={pick(lang, "최근 블록", "Recent blocks")}>
          {blocks.length === 0 ? (
            <p className="gf-note">
              {pick(lang, "블록을 읽지 못했습니다 — 노드가 응답하지 않습니다.", "No blocks read — the node is not answering.")}
            </p>
          ) : (
            <table className="gf-table">
              <thead>
                <tr>
                  <th>{pick(lang, "블록", "Block")}</th>
                  <th>{pick(lang, "최신 대비", "Behind head")}</th>
                  <th>{pick(lang, "트랜잭션", "Txs")}</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((b) => (
                  <tr key={b.hash}>
                    <td className="gf-mono">
                      <a href={`${DEVNET_EXPLORER}/block/${b.number}`} target="_blank" rel="noreferrer">
                        {b.number.toLocaleString()}
                      </a>
                    </td>
                    <td style={{ opacity: 0.65, whiteSpace: "nowrap" }}>{fmtAge(head - b.timestamp, ko)}</td>
                    {/* 트랜잭션이 있는 블록만 링크한다 — 0 을 눌렀는데 빈 목록이 나오는
                        것은 고장처럼 보인다 (jay, 2026-09-15). */}
                    <td>
                      {b.txCount ? (
                        <a href={`${DEVNET_EXPLORER}/block/${b.number}/txs`} target="_blank" rel="noreferrer">
                          {b.txCount}
                        </a>
                      ) : (
                        <span style={{ opacity: 0.4 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="gf-note">
            {pick(
              lang,
              `아무 일이 없어도 1 초마다 블록이 생성되므로 대부분 비어 있습니다. 시간은 체인 자신의 시계 기준입니다 — 포크 시점부터 1 초씩 나아가므로 실제 시각보다 ${fmtSkew(skew)} 뒤에 있습니다.`,
              `Blocks are produced every second whether or not anything happens, so most are empty. Times are on the chain's own clock, which advances a second per block from the fork point and so runs ${fmtSkew(skew)} behind the real one.`,
            )}
          </p>
        </Panel>

        {/* ---- endpoints ---- */}
        <Panel title={pick(lang, "엔드포인트", "Endpoints")}>
          <table className="gf-table">
            <tbody>
              <tr>
                <td style={{ width: "6.5rem", opacity: 0.6 }}>RPC</td>
                <td className="gf-mono">{DEVNET_RPC}</td>
              </tr>
              <tr>
                <td style={{ opacity: 0.6 }}>{pick(lang, "탐색기", "Explorer")}</td>
                <td>
                  <a href={DEVNET_EXPLORER} target="_blank" rel="noreferrer">Otterscan</a>
                  {" · "}
                  <a href={DEVNET_URL} target="_blank" rel="noreferrer">
                    {pick(lang, "상태 페이지", "status page")}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </Panel>

        {/* ---- services ---- */}
        <Panel title={pick(lang, "이 체인 위의 서비스", "Services on this chain")}>
          <table className="gf-table">
            <thead>
              <tr>
                <th>{pick(lang, "서비스", "Service")}</th>
                <th>{pick(lang, "응답", "Reachable")}</th>
                <th>{pick(lang, "이 체인의 컨트랙트", "Contracts here")}</th>
              </tr>
            </thead>
            <tbody>
              {SERVICES.map((svc, i) => {
                const owned = svc.contracts.filter((n) => book[n]);
                const up = liveness[i] === "up";
                return (
                  <tr key={svc.name}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{svc.name}</div>
                      {svc.url && (
                        <a href={svc.url} target="_blank" rel="noreferrer" style={{ fontSize: 11.5 }}>
                          {svc.url.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                      <div className="gf-note" style={{ marginTop: 2 }}>
                        {pick(lang, svc.blurbKo, svc.blurb)}
                      </div>
                      {svc.note && (
                        <div className="gf-note">{pick(lang, svc.noteKo ?? svc.note, svc.note)}</div>
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {svc.url ? (
                        <>
                          <span
                            className="gf-dot"
                            style={{ background: up ? "#17803d" : "rgba(128,128,128,0.55)" }}
                          />
                          {up ? pick(lang, "응답함", "yes") : pick(lang, "무응답", "no answer")}
                        </>
                      ) : (
                        <span style={{ opacity: 0.4 }}>—</span>
                      )}
                    </td>
                    <td>
                      {owned.length > 0 ? (
                        owned.map((n) => (
                          <div key={n} style={{ marginBottom: 2 }}>
                            <span style={{ display: "inline-block", minWidth: "10rem", fontWeight: 600, fontSize: 11.5 }}>
                              {n}
                            </span>
                            <Addr address={book[n]} />
                          </div>
                        ))
                      ) : svc.contracts.length > 0 ? (
                        <span className="gf-note">
                          {pick(
                            lang,
                            "Registry 에 없음 — 마지막 시드 이후 체인이 초기화됐을 수 있습니다.",
                            "Not in the Registry — the chain may have reset since the last seed.",
                          )}
                        </span>
                      ) : (
                        <span style={{ opacity: 0.4 }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="gf-note">
            {pick(
              lang,
              "“무응답”이 고장을 뜻하지는 않습니다 — 대부분 아무도 안 쓰면 0 으로 줄어들고, 자고 있는 서비스와 멈춘 서비스는 밖에서 구분되지 않습니다.",
              "“No answer” does not mean broken: most of these scale to zero when nobody is using them, and a sleeping service looks identical to a stopped one from out here.",
            )}
          </p>
        </Panel>

        {/* ---- address book ---- */}
        <Panel title={pick(lang, "생태계 컨트랙트", "Ecosystem contracts")}>
          <p className="gf-note" style={{ margin: "6px 0 10px" }}>
            {pick(lang, "온체인 ", "Read live from the on-chain ")}
            <code>Registry</code>
            {pick(lang, " 에서 직접 읽습니다", "")}
            {registryAddress && <> — <Addr address={registryAddress} /></>}
          </p>
          {!registryAddress && (
            <p className="small gf-bad">
              {pick(
                lang,
                "상태 응답에 Registry 주소가 없습니다 — 마지막 초기화 이후 scripts/seed.ts 를 돌렸나요?",
                "No Registry address in the devnet status — has scripts/seed.ts run since the last reset?",
              )}
            </p>
          )}
          {CONTRACT_GROUPS.map((group) => {
            const rows = group.names.filter((n) => book[n]);
            if (!rows.length) return null;
            return (
              <div key={group.title} style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{pick(lang, group.titleKo, group.title)}</div>
                <div className="gf-note" style={{ marginBottom: 4 }}>{pick(lang, group.blurbKo, group.blurb)}</div>
                <table className="gf-table">
                  <tbody>
                    {rows.map((name) => (
                      <tr key={name}>
                        <td style={{ width: "14rem", fontWeight: 600, whiteSpace: "nowrap" }}>{name}</td>
                        <td><Addr address={book[name]} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </Panel>

      </main>
    </>
  );
}
