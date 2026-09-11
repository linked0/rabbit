// Screen A — deposit / wrap / withdraw. Every button is simulate-before-sign:
// the preview line under the input is the simulation result, shown before any
// state-changing transaction is sent.
import { useEffect, useState } from "react";
import { parseEther } from "viem";
import type { DefiClients, DefiState } from "./defi";
import { doClaim, doDeposit, doRequestWithdraw, doUnwrap, doWrap, fmt, previewDeposit } from "./defi";

export function DepositPanel({ state, clients, onDone }: { state: DefiState; clients: DefiClients; onDone: () => void }) {
  const [ethIn, setEthIn] = useState("1");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;
    setPreview(null);
    try {
      const wei = parseEther(ethIn as `${number}`);
      if (wei <= 0n) return;
      previewDeposit(clients, wei)
        .then((shares) => { if (!stale) setPreview(`will mint ${fmt(shares)} shares at the current rate`); })
        .catch((e) => { if (!stale) setPreview(`simulation failed: ${short(e)}`); });
    } catch { /* not a number yet */ }
    return () => { stale = true; };
  }, [ethIn, clients, state.rate]);

  const act = (label: string, fn: () => Promise<void>) => async () => {
    setBusy(label); setErr(null);
    try { await fn(); onDone(); }
    catch (e) { setErr(short(e)); }
    finally { setBusy(null); }
  };

  return (
    <section className="panel">
      <h2>Actions</h2>

      <div className="row">
        <input value={ethIn} onChange={(e) => setEthIn(e.target.value)} aria-label="ETH to deposit" />
        <button disabled={!!busy} onClick={act("deposit", () => doDeposit(clients, parseEther(ethIn as `${number}`)))}>
          {busy === "deposit" ? "…" : "Deposit ETH"}
        </button>
      </div>
      {preview && <p className="hint">{preview}</p>}

      <div className="row">
        <button
          disabled={!!busy || state.jeBalance === 0n}
          onClick={act("wrap", () => doWrap(clients, state.jeBalance))}
        >
          Wrap all → jweETH
        </button>
        <button
          disabled={!!busy || state.jweBalance === 0n}
          onClick={act("unwrap", () => doUnwrap(clients, state.jweBalance))}
        >
          Unwrap all → jeETH
        </button>
        <button
          disabled={!!busy || state.shares === 0n}
          onClick={act("withdraw", () => doRequestWithdraw(clients, state.shares))}
        >
          Request withdraw (all shares)
        </button>
      </div>
      <p className="hint">
        wrap/unwrap converts between the two representations of the same shares; a withdraw burns
        shares now and pays ETH after the {Number(state.withdrawDelay) / 3600}h queue delay.
      </p>

      {state.queue.length > 0 && (
        <table>
          <thead>
            <tr><th>#</th><th>ETH owed</th><th>status</th><th /></tr>
          </thead>
          <tbody>
            {state.queue.map((q) => {
              const ready = state.now >= Number(q.readyAt);
              return (
                <tr key={q.id}>
                  <td>{q.id}</td>
                  <td>{fmt(q.ethOwed)}</td>
                  <td>{q.claimed ? "claimed" : ready ? "ready" : `ready at ${new Date(Number(q.readyAt) * 1000).toLocaleString()}`}</td>
                  <td>
                    {!q.claimed && (
                      <button disabled={!ready || !!busy} onClick={act(`claim${q.id}`, () => doClaim(clients, q.id))}>
                        Claim
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {err && <p className="err">{err}</p>}
    </section>
  );
}

const short = (e: unknown) => (e instanceof Error ? e.message.split("\n")[0] : String(e));
