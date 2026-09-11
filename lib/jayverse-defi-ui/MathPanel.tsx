// Screen C — "how the math works": the three formulas that run the whole
// protocol, printed with the CURRENT on-chain numbers substituted in, so every
// deposit/reward/slash visibly changes the arithmetic it flows through.
import type { DefiState } from "./defi";
import { fmt } from "./defi";

export function MathPanel({ state }: { state: DefiState }) {
  const P = fmt(state.totalPooledETH);
  const S = fmt(state.totalShares);
  const rate = fmt(state.rate, 6);
  const my = fmt(state.shares);
  const bal = fmt(state.jeBalance);
  return (
    <section className="panel">
      <h2>How the math works</h2>
      <dl className="math">
        <dt>exchange rate</dt>
        <dd>
          <code>rate = totalPooledETH / totalShares = {P} / {S} = {rate}</code>
          <p>Rewards raise the numerator, slashes lower it, deposits raise both in proportion — so
            only yield and loss move the rate.</p>
        </dd>
        <dt>your rebasing balance (jeETH)</dt>
        <dd>
          <code>balance = shares × totalPooledETH / totalShares = {my} × {P} / {S} = {bal}</code>
          <p>The stored number is <em>shares</em>; the balance is derived on every read. That
            derivation is the rebase — nothing is transferred when rewards arrive.</p>
        </dd>
        <dt>shares minted for a deposit</dt>
        <dd>
          <code>shares = ethIn × totalShares / totalPooledETH = ethIn × {S} / {P}</code>
          <p>Priced at the rate <em>before</em> the deposit, so a newcomer can never capture yield
            that accrued before they arrived.</p>
        </dd>
      </dl>
    </section>
  );
}
