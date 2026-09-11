// Screen B — position + exchange rate. The chart line IS the yield: it only
// moves on RewardsAdded (up) and Slashed (down), never on deposits.
import type { DefiClients, DefiState } from "./defi";
import { fmt } from "./defi";

export function PositionPanel({ state, clients }: { state: DefiState; clients: DefiClients }) {
  const ethValue = state.jeBalance + (state.jweBalance * state.rate) / 10n ** 18n;
  return (
    <section className="panel">
      <h2>Position</h2>
      <div className="stats">
        <Stat label="jeETH (rebasing)" value={fmt(state.jeBalance)} />
        <Stat label="jweETH (wrapped)" value={fmt(state.jweBalance)} />
        <Stat label="shares" value={fmt(state.shares)} />
        <Stat label="exchange rate" value={`${fmt(state.rate)} ETH/share`} />
        <Stat label="total ETH value" value={fmt(ethValue)} />
        <Stat label="restaking" value={state.restaking ? "ON (AVS delegated — extra yield, extra slash risk)" : "off"} />
      </div>
      <RateChart history={state.history} />
      <p className="hint">signer: {clients.wallet.account.address}</p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function RateChart({ history }: { history: { label: string; rate: number }[] }) {
  if (history.length < 2) return null;
  const w = 560, h = 120, pad = 8;
  const rates = history.map((p) => p.rate);
  const min = Math.min(...rates), max = Math.max(...rates);
  const span = max - min || 0.01;
  const x = (i: number) => pad + (i * (w - 2 * pad)) / (history.length - 1);
  const y = (r: number) => h - pad - ((r - min) * (h - 2 * pad)) / span;
  const line = history.map((p, i) => `${x(i)},${y(p.rate)}`).join(" ");
  const last = history[history.length - 1];
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="exchange-rate history">
        <polyline points={line} fill="none" stroke="#22c55e" strokeWidth="2" />
        {history.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.rate)} r="3" fill="#22c55e">
            <title>{`${p.label}: ${p.rate.toFixed(6)} ETH/share`}</title>
          </circle>
        ))}
      </svg>
      <figcaption>
        rate history from on-chain events · latest {last.rate.toFixed(6)} ETH/share
      </figcaption>
    </figure>
  );
}
