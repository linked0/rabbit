// Chain-facing layer for the DeFi study UI. Framework-free on purpose: the
// components receive a `DefiClients` and never construct providers themselves,
// so the local harness (web/dev) and the rabbit portal page can each wire
// their own — anvil dev key now, the portal's wallet later.
import { useCallback, useEffect, useState } from "react";
import type { Account, Chain, PublicClient, Transport, WalletClient } from "viem";
import { formatEther } from "viem";
import { poolAbi, jeEthAbi, jweEthAbi, type DefiAddresses } from "./abi";

export type DefiClients = {
  pub: PublicClient;
  wallet: WalletClient<Transport, Chain, Account>;
  addresses: DefiAddresses;
};

export type RatePoint = { label: string; rate: number };

export type DefiState = {
  rate: bigint;
  totalPooledETH: bigint;
  totalShares: bigint;
  restaking: boolean;
  jeBalance: bigint;
  shares: bigint;
  jweBalance: bigint;
  withdrawDelay: bigint;
  queue: { id: number; ethOwed: bigint; readyAt: bigint; claimed: boolean }[];
  history: RatePoint[];
  now: number;
};

const ZERO = "0x0000000000000000000000000000000000000000";

export async function fetchDefiState(c: DefiClients): Promise<DefiState> {
  const { pub, addresses: a } = c;
  const me = c.wallet.account.address;
  const pool = { address: a.liquidityPool, abi: poolAbi } as const;

  const [rate, totalPooledETH, totalShares, avs, withdrawDelay, queueLen, jeBalance, shares, jweBalance] =
    await Promise.all([
      pub.readContract({ ...pool, functionName: "exchangeRate" }),
      pub.readContract({ ...pool, functionName: "totalPooledETH" }),
      pub.readContract({ ...pool, functionName: "totalShares" }),
      pub.readContract({ ...pool, functionName: "avs" }),
      pub.readContract({ ...pool, functionName: "WITHDRAW_DELAY" }),
      pub.readContract({ ...pool, functionName: "withdrawQueueLength" }),
      pub.readContract({ address: a.jeETH, abi: jeEthAbi, functionName: "balanceOf", args: [me] }),
      pub.readContract({ address: a.jeETH, abi: jeEthAbi, functionName: "sharesOf", args: [me] }),
      pub.readContract({ address: a.jweETH, abi: jweEthAbi, functionName: "balanceOf", args: [me] }),
    ]);

  const queue = (
    await Promise.all(
      Array.from({ length: Number(queueLen) }, (_, id) =>
        pub.readContract({ ...pool, functionName: "withdrawQueue", args: [BigInt(id)] }).then(
          ([user, ethOwed, readyAt, claimed]) => ({ id, user, ethOwed, readyAt, claimed })
        )
      )
    )
  ).filter((r) => r.user.toLowerCase() === me.toLowerCase());

  // The rate line is rebuilt from our own events, so it is exact: every
  // Deposited/RewardsAdded/Slashed emits the totals the rate derives from.
  const [rewardLogs, slashLogs, depositLogs] = await Promise.all([
    pub.getContractEvents({ ...pool, eventName: "RewardsAdded", fromBlock: 0n }),
    pub.getContractEvents({ ...pool, eventName: "Slashed", fromBlock: 0n }),
    pub.getContractEvents({ ...pool, eventName: "Deposited", fromBlock: 0n }),
  ]);
  const points: { block: bigint; label: string; pooled: bigint; shares: bigint }[] = [];
  for (const l of rewardLogs)
    points.push({ block: l.blockNumber, label: `+${formatEther(l.args.amount!)} ${l.args.source}`, pooled: l.args.totalPooledETH!, shares: l.args.totalShares! });
  for (const l of slashLogs)
    points.push({ block: l.blockNumber, label: `slash −${formatEther(l.args.amount!)}`, pooled: l.args.totalPooledETH!, shares: l.args.totalShares! });
  for (const l of depositLogs)
    points.push({ block: l.blockNumber, label: `deposit ${formatEther(l.args.ethIn!)}`, pooled: 0n, shares: 0n });
  points.sort((x, y) => (x.block < y.block ? -1 : 1));
  const history: RatePoint[] = [{ label: "start", rate: 1 }];
  for (const p of points)
    history.push({
      label: p.label,
      // Deposits do not move the rate; carry the previous value forward.
      rate: p.shares === 0n ? history[history.length - 1].rate : Number(p.pooled) / Number(p.shares),
    });
  history.push({ label: "now", rate: Number(rate) / 1e18 });

  return {
    rate, totalPooledETH, totalShares,
    restaking: avs !== ZERO,
    jeBalance, shares, jweBalance, withdrawDelay, queue, history,
    now: Math.floor(Date.now() / 1000),
  };
}

export function useDefiState(clients: DefiClients, pollMs = 3000) {
  const [state, setState] = useState<DefiState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    fetchDefiState(clients)
      .then((s) => { setState(s); setError(null); })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [clients]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, pollMs);
    return () => clearInterval(t);
  }, [refresh, pollMs]);

  return { state, error, refresh };
}

// ---------------------------------------------------------------- actions
// Every write is simulate-before-sign: simulateContract previews the effect
// (and surfaces the revert reason) BEFORE the user commits a signature. When
// the jayverse-wallet service exists, its simulate() replaces this layer.

async function run(c: DefiClients, req: Parameters<PublicClient["simulateContract"]>[0]) {
  const { request } = await c.pub.simulateContract({ ...req, account: c.wallet.account } as never);
  const hash = await c.wallet.writeContract(request as never);
  await c.pub.waitForTransactionReceipt({ hash });
}

export async function previewDeposit(c: DefiClients, ethIn: bigint): Promise<bigint> {
  const { result } = await c.pub.simulateContract({
    address: c.addresses.liquidityPool, abi: poolAbi, functionName: "deposit",
    value: ethIn, account: c.wallet.account,
  });
  return result;
}

export const doDeposit = (c: DefiClients, ethIn: bigint) =>
  run(c, { address: c.addresses.liquidityPool, abi: poolAbi, functionName: "deposit", value: ethIn } as never);

export async function doWrap(c: DefiClients, jeAmount: bigint) {
  const me = c.wallet.account.address;
  const allowance = await c.pub.readContract({
    address: c.addresses.jeETH, abi: jeEthAbi, functionName: "allowance", args: [me, c.addresses.jweETH],
  });
  if (allowance < jeAmount)
    await run(c, { address: c.addresses.jeETH, abi: jeEthAbi, functionName: "approve", args: [c.addresses.jweETH, jeAmount] } as never);
  await run(c, { address: c.addresses.jweETH, abi: jweEthAbi, functionName: "wrap", args: [jeAmount] } as never);
}

export const doUnwrap = (c: DefiClients, jweAmount: bigint) =>
  run(c, { address: c.addresses.jweETH, abi: jweEthAbi, functionName: "unwrap", args: [jweAmount] } as never);

export const doRequestWithdraw = (c: DefiClients, shares: bigint) =>
  run(c, { address: c.addresses.liquidityPool, abi: poolAbi, functionName: "requestWithdraw", args: [shares] } as never);

export const doClaim = (c: DefiClients, id: number) =>
  run(c, { address: c.addresses.liquidityPool, abi: poolAbi, functionName: "claim", args: [BigInt(id)] } as never);

export const fmt = (wei: bigint, digits = 4) => Number(formatEther(wei)).toFixed(digits);
