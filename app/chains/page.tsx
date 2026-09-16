import Nav from "../Nav";
import NotifyPageView from "@/app/NotifyPageView";
import AutoRefresh from "./AutoRefresh";
import {
  fetchStatus, fetchRegistry, probe,
  CONTRACT_GROUPS, SERVICES, DEVNET_URL, DEVNET_EXPLORER,
} from "@/lib/devnet";
import {
  CHAINS, CAPABILITIES, SEPOLIA_RAILS, chainDef, readChains, IN_CLOUD,
  type ChainDef, type ChainKey, type ChainReading, type Cell,
} from "@/lib/chains";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import type { Address } from "viem";

// The three networks Jayverse runs on, side by side.
//
// jay, 2026-09-16: "We use three networks — Anvil, devnet, Sepolia. Change the
// name of the Devnet top menu to Chains and make it show all the information
// for the three chains."
//
// Tabs were considered and dropped (jay, 2026-09-16, after seeing both): one
// chain per tab makes each screen shorter, but comparison is the whole reason
// this page exists and a tab hides two thirds of the comparison. The length is
// controlled instead by putting the three chains into columns wherever they
// carry the same kind of fact — one card row, one block grid, one matrix —
// rather than stacking three copies of a status page.
//
// This grew out of /devnet, and keeps that page's two rules:
//   - numbers first, sentences only where the chain cannot speak for itself
//     (jay, 2026-09-15: "grafana style, simpler");
//   - the devnet's address book is read from the Registry CONTRACT, never from
//     a JSON file beside it.
//
// What it adds is the comparison. Three chains that all answer
// eth_getBlockByNumber look interchangeable from a status page, and they are
// not: only Sepolia has live oracles and a MetaMask that knows it, only the
// devnet is shared and seeded, only the local fork resets in a second. The
// capability matrix is where that is said out loud — and where "Alchemy" stops
// being written next to chains Alchemy cannot see.
//
// Rendered on the server and never cached: a status page that can show a stale
// block number is worse than no status page, because it reports health it has
// not checked.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Chains — Jayverse",
  description:
    "The three networks Jayverse runs on — the local Anvil fork, the Jayverse devnet (313370) and Sepolia — with live status, endpoints and what each one can actually do.",
};

// Age is measured against the chain's own head, not against wall-clock time.
//
// A fork continues the forked block's timestamp at one second per block, so a
// forked chain's clock sits a fixed distance behind the real one — and it only
// grows. Subtracting a block timestamp from Date.now() therefore gave the SAME
// answer for every row ("18h ago"), which looked like a frozen chain when the
// chain was fine and the comparison was wrong (jay, 2026-09-15). On Sepolia the
// skew is ~0 and the two measures agree, which is exactly why one rule works
// for all three.
const fmtAge = (sec: number, ko: boolean) => {
  if (sec <= 0) return ko ? "최신" : "head";
  if (sec < 60) return ko ? `${sec}초 전` : `${sec}s`;
  if (sec < 3600) return ko ? `${Math.floor(sec / 60)}분 전` : `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return ko ? `${Math.floor(sec / 3600)}시간 전` : `${Math.floor(sec / 3600)}h`;
  return ko ? `${Math.floor(sec / 86400)}일 전` : `${Math.floor(sec / 86400)}d`;
};

/** The chain clock's distance from the real one, as a human phrase. */
const fmtSkew = (sec: number) => {
  if (sec < 120) return `${sec}s`;
  const h = Math.floor(sec / 3600);
  if (h < 1) return `${Math.floor(sec / 60)}m`;
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
};

const fmtUptime = (sec?: number) => {
  if (sec == null) return "—";
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  return `${d ? `${d}d ` : ""}${h ? `${h}h ` : ""}${m}m`;
};

function Addr({ address, explorer }: { address: string; explorer?: string }) {
  if (!explorer) return <span className="gf-mono">{address}</span>;
  return (
    <a href={`${explorer}/address/${address}`} target="_blank" rel="noreferrer" className="gf-mono">
      {address}
    </a>
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

/** One fact inside a chain card. */
function Fact({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "ok" | "bad" }) {
  return (
    <div className="gf-fact">
      <span className="gf-fact-k">{label}</span>
      <span className={`gf-fact-v${tone ? ` gf-${tone}` : ""}`}>{value}</span>
    </div>
  );
}

export default async function ChainsPage() {
  const lang = getLang();
  const ko = lang === "ko";

  // The devnet's /status knows things no chain reports about itself; the other
  // two have no equivalent, which is itself one of the differences worth showing.
  const [status, readings] = await Promise.all([fetchStatus(), readChains(8)]);

  // The Registry address comes from the status payload, but the CONTENTS are
  // read from the contract — see the note in lib/devnet.ts.
  const registryAddress = status.registry?.registry as Address | undefined;
  const wanted = Array.from(
    new Set([...CONTRACT_GROUPS.flatMap((g) => g.names), ...SERVICES.flatMap((s) => s.contracts)]),
  );
  const [{ book, count }, liveness] = await Promise.all([
    registryAddress
      ? fetchRegistry(registryAddress, wanted)
      : Promise.resolve({ book: {} as Record<string, Address>, count: null as number | null }),
    Promise.all(SERVICES.map((svc) => probe(svc.url))),
  ]);
  const found = Object.keys(book).length;
  const devnetRead = readings.devnet;

  const chainName = (c: ChainDef) => pick(lang, c.nameKo, c.name);

  /** The one line that is true of this chain and not of the others. */
  function extraFact(c: ChainDef, r: ChainReading): React.ReactNode {
    if (c.key === "devnet") {
      return (
        <>
          <Fact
            label={pick(lang, "포크 지점", "Forked at")}
            value={status.forkBlock ? `${Number(status.forkBlock).toLocaleString()} (Sepolia)` : "—"}
          />
          <Fact label={pick(lang, "엣지 가동", "Edge uptime")} value={fmtUptime(status.proxyUptimeSeconds)} />
          {status.faucet && !status.faucet.error && (
            <Fact
              label={pick(lang, "포싯 잔여", "Faucet left")}
              value={`${status.faucet.remainingTodayEth} / ${status.faucet.dailyBudgetEth} ETH`}
            />
          )}
          <Fact
            label={pick(lang, "Registry 이름", "Registry names")}
            value={count != null ? `${count} (${pick(lang, `${found}개 표시`, `${found} shown`)})` : "—"}
          />
        </>
      );
    }
    if (c.key === "sepolia") {
      return (
        <Fact
          label={pick(lang, "종류", "Kind")}
          value={pick(lang, "공개 테스트넷 — 우리가 운영하지 않음", "public testnet — not ours to run")}
        />
      );
    }
    return (
      <Fact
        label={pick(lang, "상태 파일", "State file")}
        value={<span className="gf-mono">./anvil-sepolia-state.json</span>}
      />
    );
  }

  return (
    <>
      <Nav />
      <NotifyPageView path="/chains" />
      {/* 블록이 늘어나는 것이 "살아 있다"의 유일한 신호라, 멈춰 있는 숫자는 멈춘 체인과 구별되지 않는다.
          Sepolia 는 12 초에 한 블록이라 lib/chains.ts 의 캐시가 그쪽 호출만 걸러 준다. */}
      <AutoRefresh seconds={5} />
      <main>
        <h1>Jayverse Chains</h1>
        <p className="muted" style={{ fontSize: 13 }}>
          {pick(
            lang,
            "Jayverse 는 세 네트워크 위에서 돌아갑니다. 서로 바꿔 쓸 수 있는 것이 아니라 각자 맡은 일이 다릅니다 — 로컬 Anvil 은 개발 루프, 데브넷은 클라우드 서비스들이 공유하는 상태, Sepolia 는 살아 있는 오라클과 지갑이 인정하는 공개 체인입니다.",
            "Jayverse runs on three networks. They are not interchangeable — each has a job: the local Anvil is the inner loop, the devnet is the shared state every cloud service targets, and Sepolia is the public chain with live oracles that wallets recognise.",
          )}
        </p>

        {status.error && (
          <p className="small gf-bad">
            {pick(lang, "데브넷 상태 엔드포인트가 응답하지 않았습니다: ", "The devnet status endpoint did not answer: ")}
            {status.error}
          </p>
        )}

        {/* ---- one card per chain, same layout so the eye can compare ---- */}
        <div className="gf-chains">
          {CHAINS.map((c) => {
            const r = readings[c.key];
            // The id the node REPORTS wins over the id we expect. They disagree
            // on the local fork right now (it was started as a Sepolia fork and
            // reports 11155111, not 31337), and a page that printed the expected
            // value would hide exactly the mismatch worth knowing about.
            const reportedId = r.chainId;
            const idMismatch = r.reachable && reportedId !== null && reportedId !== c.chainId;
            return (
              <section key={c.key} className="gf-chaincard">
                <header>
                  <span
                    className="gf-dot"
                    style={{
                      background: r.reachable
                        ? "#17803d"
                        : r.skipped
                          ? "rgba(128,128,128,0.55)"
                          : "#b4232c",
                    }}
                  />
                  <span className="gf-chainname">{chainName(c)}</span>
                  <span className="gf-chainstate">
                    {r.reachable
                      ? pick(lang, "정상", "healthy")
                      : r.skipped
                        ? pick(lang, "여기서는 확인 불가", "not reachable from here")
                        : pick(lang, "응답 없음", "unreachable")}
                  </span>
                </header>
                <p className="gf-role">{pick(lang, c.roleKo, c.role)}</p>
                <div className="gf-facts">
                  <Fact
                    label={pick(lang, "체인 아이디", "Chain id")}
                    value={
                      reportedId ?? (
                        <span style={{ opacity: 0.5 }}>{c.chainId} {pick(lang, "(예상)", "(expected)")}</span>
                      )
                    }
                    tone={idMismatch ? "bad" : undefined}
                  />
                  <Fact
                    label={pick(lang, "최신 블록", "Latest block")}
                    value={r.head != null ? r.head.toLocaleString() : "—"}
                  />
                  <Fact
                    label={pick(lang, "블록 간격", "Block time")}
                    value={`${c.blockTimeSec}s`}
                  />
                  <Fact
                    label={pick(lang, "체인 시계", "Chain clock")}
                    value={
                      r.reachable
                        ? r.skew < 120
                          ? pick(lang, "실제 시각과 일치", "in step with real time")
                          : pick(lang, `${fmtSkew(r.skew)} 뒤`, `${fmtSkew(r.skew)} behind`)
                        : "—"
                    }
                  />
                  {extraFact(c, r)}
                </div>
                {idMismatch && (
                  <p className="gf-note gf-bad">
                    {pick(
                      lang,
                      `설계상 ${c.chainId} 여야 하는데 ${reportedId} 를 보고합니다. 이 노드는 Sepolia 포크로 기본 아이디를 그대로 띄운 상태라, MetaMask 가 이 체인을 Sepolia 로 취급하고 여기서 서명한 트랜잭션이 실제 Sepolia 에서 재생될 수 있습니다. --chain-id ${c.chainId} 로 다시 띄우면 됩니다(상태 파일은 그대로).`,
                      `The design says ${c.chainId}; the node reports ${reportedId}. It was started as a Sepolia fork with the default id, so MetaMask treats it as Sepolia and a transaction signed here is replayable on real Sepolia. Restarting with --chain-id ${c.chainId} fixes it; the state file is unaffected.`,
                    )}
                  </p>
                )}
                {r.skipped && (
                  <p className="gf-note">
                    {pick(
                      lang,
                      "이 페이지가 클라우드에서 렌더링되고 있습니다. 로컬 Anvil 은 jay 의 노트북에 있어 구조상 닿지 않으므로 아예 시도하지 않습니다 — 로컬에서 rabbit 을 띄우면 이 칸도 살아납니다.",
                      "This page is rendering in the cloud, where the local Anvil is unreachable by construction — so we do not try. Run rabbit locally and this column comes alive.",
                    )}
                  </p>
                )}
                {!r.reachable && !r.skipped && (
                  <p className="gf-note">
                    {pick(lang, "노드가 응답하지 않습니다: ", "The node did not answer: ")}
                    {r.error ?? pick(lang, "알 수 없음", "unknown")}
                  </p>
                )}
              </section>
            );
          })}
        </div>

        {/* ---- recent blocks — 맨 위 (jay, 2026-09-15). 이 페이지에 와서 가장 먼저
             확인하는 것이 "지금 돌고 있나"이고, 그 답은 블록이 늘어나는 것이다. ---- */}
        <Panel title={pick(lang, "최근 블록", "Recent blocks")}>
          <div className="gf-blockgrid">
            {CHAINS.map((c) => {
              const r = readings[c.key];
              return (
                <div key={c.key}>
                  <div className="gf-subhead">{chainName(c)}</div>
                  {r.blocks.length === 0 ? (
                    <p className="gf-note" style={{ marginTop: 4 }}>
                      {r.skipped
                        ? pick(lang, "로컬에서 실행할 때만 보입니다.", "Visible when you run this locally.")
                        : pick(lang, "블록을 읽지 못했습니다.", "No blocks read.")}
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
                        {r.blocks.map((b) => (
                          <tr key={b.hash}>
                            <td className="gf-mono">
                              {c.explorer ? (
                                <a href={`${c.explorer}/block/${b.number}`} target="_blank" rel="noreferrer">
                                  {b.number.toLocaleString()}
                                </a>
                              ) : (
                                b.number.toLocaleString()
                              )}
                            </td>
                            <td style={{ opacity: 0.65, whiteSpace: "nowrap" }}>
                              {fmtAge((r.headTime ?? b.timestamp) - b.timestamp, ko)}
                            </td>
                            {/* 트랜잭션이 있는 블록만 링크한다 — 0 을 눌렀는데 빈 목록이
                                나오는 것은 고장처럼 보인다 (jay, 2026-09-15). Otterscan 만
                                /txs 하위 경로를 갖는다. */}
                            <td>
                              {b.txCount ? (
                                c.explorerName === "Otterscan" ? (
                                  <a href={`${c.explorer}/block/${b.number}/txs`} target="_blank" rel="noreferrer">
                                    {b.txCount}
                                  </a>
                                ) : (
                                  b.txCount
                                )
                              ) : (
                                <span style={{ opacity: 0.4 }}>—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
          <p className="gf-note">
            {pick(
              lang,
              "두 포크 체인은 아무 일이 없어도 1 초마다 블록을 만들므로 대부분 비어 있습니다. “최신 대비”는 각 체인 자신의 시계 기준입니다 — 포크는 포크 시점부터 1 초씩 나아가므로 실제 시각보다 한참 뒤에 있고, Sepolia 만 실제 시각과 일치합니다.",
              "The two forked chains produce a block every second whether or not anything happens, so most are empty. “Behind head” is measured on each chain's own clock: a fork advances a second per block from the fork point and so runs well behind real time, while Sepolia's clock is the real one.",
            )}
          </p>
        </Panel>

        {/* ---- endpoints ---- */}
        <Panel title={pick(lang, "엔드포인트", "Endpoints")}>
          <table className="gf-table">
            <thead>
              <tr>
                <th>{pick(lang, "체인", "Chain")}</th>
                <th>RPC</th>
                <th>{pick(lang, "그 외", "Also")}</th>
              </tr>
            </thead>
            <tbody>
              {CHAINS.map((c) => (
                <tr key={c.key}>
                  <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{chainName(c)}</td>
                  <td>
                    <div className="gf-mono">{c.rpc}</div>
                    {c.altRpc && <div className="gf-mono">{c.altRpc}</div>}
                    {c.ws && <div className="gf-mono">{c.ws}</div>}
                  </td>
                  <td>
                    {c.explorer && (
                      <div>
                        <a href={c.explorer} target="_blank" rel="noreferrer">{c.explorerName}</a>
                      </div>
                    )}
                    {c.statusUrl && (
                      <div>
                        <a href={DEVNET_URL} target="_blank" rel="noreferrer">
                          {pick(lang, "상태 페이지", "status page")}
                        </a>
                      </div>
                    )}
                    <div className="gf-note" style={{ margin: 0 }}>{pick(lang, c.faucetKo, c.faucet)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* 로컬 체인을 다른 기기에서 여는 법 — Tailscale (brief §4). 이 문단이 없으면
              위의 100.111.162.0 주소가 왜 지금은 안 붙는지 설명할 데가 없다. */}
          <p className="gf-note">
            {pick(
              lang,
              `로컬 Anvil 의 두 번째 주소(${chainDef("local").altRpc})는 Tailscale 용입니다 — 폰에서는 localhost 가 폰 자신을 가리키므로, 테일넷 주소라야 닿습니다. 다만 Anvil 은 기본적으로 127.0.0.1 에만 바인딩하므로 --host 0.0.0.0 으로 다시 띄워야 열립니다(상태 파일은 그대로). 노출은 테일넷까지만 — 공유기 포트 개방이나 공개 터널은 쓰지 마세요. Anvil 에는 인증이 없고 anvil_setBalance 같은 메서드가 그대로 열려 있습니다. MetaMask 모바일은 커스텀 RPC 에 http 를 허용하므로 그대로 넣으면 됩니다.`,
              `The local Anvil's second address (${chainDef("local").altRpc}) is for Tailscale — on a phone, localhost means the phone, so only a tailnet address reaches the Mac. Anvil binds to 127.0.0.1 by default, so it answers there only after a restart with --host 0.0.0.0 (the state file is unaffected). Keep the exposure to the tailnet: no router port-forward, no public tunnel. Anvil has no auth and anvil_setBalance is wide open to anyone who can reach the port. MetaMask mobile accepts http for a custom RPC, so the address goes in as-is.`,
            )}
          </p>
        </Panel>

        {/* ---- capability matrix — 이 페이지가 "데브넷 페이지 세 장"이 아닌 이유 ---- */}
        <Panel title={pick(lang, "체인별로 가능한 것", "What each chain can do")}>
          <p className="gf-note" style={{ margin: "6px 0 10px" }}>
            {pick(
              lang,
              "Alchemy 는 Sepolia 만 봅니다. 데이터 API·웹훅·번들러·가스 매니저는 Alchemy 가 직접 운영하는 체인을 색인하는데, 31337 도 313370 도 거기 없습니다. 같은 기능이라도 우리 두 체인에서는 직접 호스팅하거나 아예 없습니다 — 이름이 같아서 헷갈리기 쉬운 지점이라 칸마다 실제 구현을 적었습니다.",
              "Alchemy only sees Sepolia. Its data APIs, webhooks, bundler and gas manager index chains Alchemy runs, and it runs neither 31337 nor 313370. On our two chains the same capability is self-hosted or simply absent — the names are identical, which is what makes the mistake easy, so each cell names the implementation that actually provides it.",
            )}
          </p>
          <table className="gf-table gf-matrix">
            <thead>
              <tr>
                <th>{pick(lang, "기능", "Capability")}</th>
                {CHAINS.map((c) => (
                  <th key={c.key}>{chainName(c)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAPABILITIES.map((row) => (
                <tr key={row.name}>
                  <td style={{ fontWeight: 600 }}>{pick(lang, row.nameKo, row.name)}</td>
                  {(["local", "devnet", "sepolia"] as ChainKey[]).map((k) => {
                    const cell = row[k] as Cell;
                    return (
                      <td key={k} className={`gf-cell gf-cell-${cell.state}`}>
                        {(cell.state === "none" || cell.state === "planned") && <span className="gf-dash">—</span>}
                        <span>{pick(lang, cell.textKo, cell.text)}</span>
                        {cell.state === "planned" && (
                          <span className="gf-tag">{pick(lang, "예정", "planned")}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="gf-note">
            {pick(
              lang,
              "“예정”은 기능이 아니라 계획입니다 — 초록 점을 주지 않습니다. 자체 번들러와 paymaster 는 데브넷 설계 문서의 단계 표에 있습니다.",
              "“Planned” is a plan, not a feature — it does not get a green dot. The self-hosted bundler and paymaster are in the devnet design's phase table.",
            )}
          </p>
        </Panel>

        {/* ---- services ---- */}
        <Panel title={pick(lang, "서비스와 바라보는 체인", "Services, and the chains they target")}>
          <table className="gf-table">
            <thead>
              <tr>
                <th>{pick(lang, "서비스", "Service")}</th>
                <th>{pick(lang, "체인", "Chains")}</th>
                <th>{pick(lang, "응답", "Reachable")}</th>
                <th>{pick(lang, "데브넷의 컨트랙트", "Contracts on the devnet")}</th>
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
                    <td>
                      {svc.chains.map((k) => (
                        <span key={k} className={`gf-badge gf-badge-${k}`}>
                          {chainName(chainDef(k))}
                        </span>
                      ))}
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
                            <Addr address={book[n]} explorer={DEVNET_EXPLORER} />
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
              "“무응답”이 고장을 뜻하지는 않습니다 — 대부분 아무도 안 쓰면 0 으로 줄어들고, 자고 있는 서비스와 멈춘 서비스는 밖에서 구분되지 않습니다. 체인 뱃지는 각 서비스의 배포 env 와 deployments.json 에서 온 것이고 추측이 아닙니다.",
              "“No answer” does not mean broken: most of these scale to zero when nobody is using them, and a sleeping service looks identical to a stopped one from out here. The chain badges come from each service's deployed env and deployments.json — they are read, not guessed.",
            )}
          </p>
        </Panel>

        {/* ---- address book ---- */}
        <Panel title={pick(lang, "생태계 컨트랙트", "Ecosystem contracts")}>
          <p className="gf-note" style={{ margin: "6px 0 10px" }}>
            {pick(lang, "데브넷은 온체인 ", "On the devnet these are read live from the on-chain ")}
            <code>Registry</code>
            {pick(lang, " 에서 직접 읽습니다", "")}
            {registryAddress && <> — <Addr address={registryAddress} explorer={DEVNET_EXPLORER} /></>}
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
                <div className="gf-subhead">{pick(lang, group.titleKo, group.title)}</div>
                <div className="gf-note" style={{ marginBottom: 4 }}>{pick(lang, group.blurbKo, group.blurb)}</div>
                <table className="gf-table">
                  <tbody>
                    {rows.map((name) => (
                      <tr key={name}>
                        <td style={{ width: "14rem", fontWeight: 600, whiteSpace: "nowrap" }}>{name}</td>
                        <td><Addr address={book[name]} explorer={DEVNET_EXPLORER} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Sepolia has no Registry of ours, so this is a short static list —
              only the rails the fork inherits, at their real addresses. Anything
              we deploy belongs on the devnet, where the Registry can be the
              authority for it. */}
          <div style={{ marginTop: 18 }}>
            <div className="gf-subhead">{pick(lang, "Sepolia 의 기본 레일", "Base rails on Sepolia")}</div>
            <div className="gf-note" style={{ marginBottom: 4 }}>
              {pick(
                lang,
                "데브넷과 로컬 포크가 물려받는 것들 — 우리가 배포한 것이 아니라 포크가 실어 온 것입니다. 여기엔 우리 Registry 가 없으므로 이 목록은 손으로 관리합니다.",
                "What the devnet and the local fork inherit — carried in by the fork, not deployed by us. We have no Registry here, so this short list is maintained by hand.",
              )}
            </div>
            <table className="gf-table">
              <tbody>
                {SEPOLIA_RAILS.map((rail) => (
                  <tr key={rail.name}>
                    <td style={{ width: "14rem", fontWeight: 600 }}>
                      {rail.name}
                      <div className="gf-note" style={{ margin: 0, fontWeight: 400 }}>
                        {pick(lang, rail.noteKo, rail.note)}
                      </div>
                    </td>
                    <td><Addr address={rail.address} explorer={chainDef("sepolia").explorer} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="gf-note">
            {pick(
              lang,
              `로컬 포크는 시드를 돌린 뒤에는 데브넷과 같은 주소록을 갖습니다 — 같은 스크립트가 같은 순서로 배포하기 때문입니다. 시드 전에는 위의 기본 레일만 있습니다.${
                devnetRead.reachable ? "" : " (지금 데브넷을 읽지 못해 주소록이 비어 있습니다.)"
              }`,
              `After the seed has run, the local fork carries the same address book as the devnet — the same script deploys the same things in the same order. Before the seed it has only the base rails above.${
                devnetRead.reachable ? "" : " (The devnet is not answering right now, so the book above is empty.)"
              }`,
            )}
          </p>
        </Panel>

        {IN_CLOUD && (
          <p className="gf-note">
            {pick(
              lang,
              "이 페이지는 Cloud Run 에서 렌더링되고 있습니다.",
              "This page is rendering on Cloud Run.",
            )}
          </p>
        )}
      </main>
    </>
  );
}
