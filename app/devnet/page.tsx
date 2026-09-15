import Nav from "../Nav";
import NotifyPageView from "@/app/NotifyPageView";
import {
  fetchStatus, fetchRegistry, fetchRecentBlocks, probe,
  CONTRACT_GROUPS, SERVICES, DEVNET_URL, DEVNET_RPC, DEVNET_EXPLORER, DEVNET_CHAIN_ID,
} from "@/lib/devnet";
import type { Address } from "viem";

// The Jayverse devnet at a glance (jay, 2026-09-15): "what is on our chain, and
// is it alive". Everything here was previously only reachable with `cast call`
// against the Registry, which meant nobody looked at it.
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

const fmtAge = (sec: number) => {
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
};

const fmtUptime = (sec?: number) => {
  if (sec == null) return "—";
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  return `${d ? `${d}d ` : ""}${h ? `${h}h ` : ""}${m}m`;
};

function Addr({ address }: { address: string }) {
  return (
    <a href={`${DEVNET_EXPLORER}/address/${address}`} target="_blank" rel="noreferrer"
       style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "0.82rem", wordBreak: "break-all" }}>
      {address}
    </a>
  );
}

export default async function DevnetPage() {
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

  const now = Math.floor(Date.now() / 1000);
  const found = Object.keys(book).length;

  return (
    <>
      <Nav />
      <NotifyPageView path="/devnet" />
      <main>
        <h1>Jayverse Devnet</h1>
        <p className="muted">
          Our own chain — an always-on Anvil forked from Sepolia, at chain id{" "}
          <strong>{DEVNET_CHAIN_ID}</strong>. Every Jayverse service targets this
          instead of Sepolia. Contracts below are deployed <em>by our seed</em>, not
          inherited from the fork.
        </p>

        {/* ---- chain card ---- */}
        <section style={{ margin: "1.5rem 0" }}>
          <h2 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.6 }}>
            Chain
          </h2>
          {status.error && (
            <p className="small" style={{ color: "#b4232c" }}>
              The devnet did not answer: {status.error}
            </p>
          )}
          <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 18px", margin: 0 }}>
            <dt className="muted">Status</dt>
            <dd style={{ margin: 0, fontWeight: 600, color: status.healthy ? "#17803d" : "#b4232c" }}>
              {status.healthy ? "healthy" : "unreachable"}
            </dd>
            <dt className="muted">Chain id</dt><dd style={{ margin: 0 }}>{status.chainId}</dd>
            <dt className="muted">Latest block</dt>
            <dd style={{ margin: 0 }}>{status.blockNumber?.toLocaleString() ?? "—"}</dd>
            <dt className="muted">Block time</dt><dd style={{ margin: 0 }}>1s</dd>
            <dt className="muted">Mode</dt>
            <dd style={{ margin: 0 }}>{status.mode === "fork" ? "fork of Sepolia" : "own genesis"}</dd>
            <dt className="muted">Forked at</dt>
            <dd style={{ margin: 0 }}>
              {status.forkBlock ? `Sepolia block ${Number(status.forkBlock).toLocaleString()}` : "—"}
            </dd>
            <dt className="muted">Edge uptime</dt><dd style={{ margin: 0 }}>{fmtUptime(status.proxyUptimeSeconds)}</dd>
            <dt className="muted">RPC</dt>
            <dd style={{ margin: 0, fontFamily: "ui-monospace, monospace", fontSize: "0.82rem" }}>{DEVNET_RPC}</dd>
            <dt className="muted">Explorer</dt>
            <dd style={{ margin: 0 }}>
              <a href={DEVNET_EXPLORER} target="_blank" rel="noreferrer">Otterscan</a>{" · "}
              <a href={DEVNET_URL} target="_blank" rel="noreferrer">status page</a>
            </dd>
            {status.faucet && !status.faucet.error && (
              <>
                <dt className="muted">Faucet</dt>
                <dd style={{ margin: 0 }}>
                  {status.faucet.payoutEth} ETH per request ·{" "}
                  {status.faucet.remainingTodayEth}/{status.faucet.dailyBudgetEth} ETH left today
                </dd>
              </>
            )}
          </dl>
        </section>

        {/* ---- services ---- */}
        <section style={{ margin: "2rem 0" }}>
          <h2 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.6 }}>
            Services on this chain
          </h2>
          <p className="small muted">
            Every Jayverse service targets chain {DEVNET_CHAIN_ID}. Sepolia is kept only for the
            oracle-dependent tests and the MetaMask 7715 popup, which engage only on chains
            MetaMask recognises.
          </p>

          <div style={{ display: "grid", gap: "14px", marginTop: "1rem" }}>
            {SERVICES.map((svc, i) => {
              const owned = svc.contracts.filter((n) => book[n]);
              return (
                <div key={svc.name} style={{ border: "1px solid rgba(128,128,128,0.25)", borderRadius: "10px", padding: "12px 14px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "baseline", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: "0.95rem" }}>{svc.name}</strong>
                    {svc.url && (
                      <span className="small">
                        <a href={svc.url} target="_blank" rel="noreferrer">
                          {svc.url.replace(/^https?:\/\//, "")}
                        </a>
                        <span
                          title={liveness[i] === "up" ? "answered just now" : "no answer — may be scaled to zero rather than broken"}
                          style={{
                            marginLeft: "8px", fontSize: "0.75rem", padding: "1px 7px", borderRadius: "99px",
                            background: liveness[i] === "up" ? "rgba(23,128,61,0.15)" : "rgba(128,128,128,0.18)",
                            color: liveness[i] === "up" ? "#17803d" : "inherit",
                          }}
                        >
                          {liveness[i] === "up" ? "answering" : "no answer"}
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="small muted" style={{ margin: "4px 0 0" }}>{svc.blurb}</p>
                  {svc.note && <p className="small muted" style={{ margin: "6px 0 0", opacity: 0.85 }}>{svc.note}</p>}
                  {owned.length > 0 && (
                    <div style={{ marginTop: "8px", display: "grid", gap: "2px" }}>
                      {owned.map((n) => (
                        <div key={n} className="small">
                          <span style={{ display: "inline-block", minWidth: "10.5rem", fontWeight: 600 }}>{n}</span>
                          <Addr address={book[n]} />
                        </div>
                      ))}
                    </div>
                  )}
                  {svc.contracts.length > 0 && owned.length === 0 && (
                    <p className="small muted" style={{ margin: "6px 0 0" }}>
                      Its contracts are not in the Registry right now — the chain may have reset
                      since the last seed.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="small muted" style={{ marginTop: "10px" }}>
            &ldquo;No answer&rdquo; does not mean broken: most of these scale to zero when nobody is
            using them, and a sleeping service looks identical to a stopped one from out here.
          </p>
        </section>

        {/* ---- address book ---- */}
        <section style={{ margin: "2rem 0" }}>
          <h2 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.6 }}>
            Ecosystem contracts
          </h2>
          <p className="small muted">
            Read live from the on-chain <code>Registry</code>
            {registryAddress && <> at <Addr address={registryAddress} /></>}
            {count != null && <> — {count} names registered, {found} shown here.</>}
          </p>
          {!registryAddress && (
            <p className="small" style={{ color: "#b4232c" }}>
              No Registry address in the devnet status — has <code>scripts/seed.ts</code> run since
              the last reset?
            </p>
          )}

          {CONTRACT_GROUPS.map((group) => {
            const rows = group.names.filter((n) => book[n]);
            if (!rows.length) return null;
            return (
              <div key={group.title} style={{ marginTop: "1.25rem" }}>
                <h3 style={{ fontSize: "0.95rem", margin: "0 0 2px" }}>{group.title}</h3>
                <p className="small muted" style={{ margin: "0 0 8px" }}>{group.blurb}</p>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                    <tbody>
                      {rows.map((name) => (
                        <tr key={name}>
                          <th style={{ textAlign: "left", padding: "5px 12px 5px 0", whiteSpace: "nowrap", fontWeight: 600 }}>
                            {name}
                          </th>
                          <td style={{ padding: "5px 0" }}><Addr address={book[name]} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </section>

        {/* ---- recent blocks ---- */}
        <section style={{ margin: "2rem 0" }}>
          <h2 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.6 }}>
            Recent blocks
          </h2>
          {blocks.length === 0 ? (
            <p className="small muted">No blocks read — the node is not answering.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ textAlign: "left", opacity: 0.6 }}>
                    <th style={{ padding: "4px 12px 4px 0" }}>Block</th>
                    <th style={{ padding: "4px 12px 4px 0" }}>Age</th>
                    <th style={{ padding: "4px 12px 4px 0" }}>Txs</th>
                    <th style={{ padding: "4px 0" }}>Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((b) => (
                    <tr key={b.hash}>
                      <td style={{ padding: "4px 12px 4px 0", fontFamily: "ui-monospace, monospace" }}>
                        <a href={`${DEVNET_EXPLORER}/block/${b.number}`} target="_blank" rel="noreferrer">
                          {b.number.toLocaleString()}
                        </a>
                      </td>
                      <td style={{ padding: "4px 12px 4px 0" }} className="muted">{fmtAge(now - b.timestamp)}</td>
                      <td style={{ padding: "4px 12px 4px 0" }}>{b.txCount || "—"}</td>
                      <td style={{ padding: "4px 0", fontFamily: "ui-monospace, monospace", fontSize: "0.78rem", opacity: 0.7 }}>
                        {b.hash.slice(0, 18)}…
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="small muted" style={{ marginTop: "10px" }}>
            Blocks are produced every second whether or not anything happens, so most are empty —
            that is deliberate. Real blocks on a clock make timing bugs show up here rather than on
            Sepolia.
          </p>
        </section>
      </main>
    </>
  );
}
