"use client";

// Portal wiring for the DeFi study UI — the cloud counterpart of jayverse-defi's
// web/dev/main.tsx harness (same components, same wiring idea). The page talks to the
// *visitor's* local anvil at 127.0.0.1:8545 from the browser (localhost is exempt from
// mixed-content blocking), with the anvil dev keys — public by design, never secrets.
// This is a study build: no real funds can exist on a local dev chain, which is exactly
// why shipping dev keys in page code is acceptable here and nowhere else.
import { useMemo, useState } from "react";
import { createPublicClient, createWalletClient, defineChain, http, parseAbi, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  DepositPanel, MathPanel, PositionPanel, useDefiState, type DefiClients,
} from "@/lib/jayverse-defi-ui";
import { DEFI_ADDRESSES } from "@/lib/jayverse-defi-ui/addresses";
import "./defi.css";

const RPC_URL = "http://127.0.0.1:8545";
const NARI_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"; // anvil #1
const OPERATOR_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // anvil #0

const chain = defineChain({
  id: DEFI_ADDRESSES.chainId,
  name: "local anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
});

const operatorAbi = parseAbi([
  "function addRewards(string source) payable",
  "function delegateToAVS(address avs)",
  "function payRestakingRewards() payable",
  "function slashPool(uint256 amount)",
]);

function makeClients() {
  const pub = createPublicClient({ chain, transport: http(RPC_URL) });
  const wallet = createWalletClient({ account: privateKeyToAccount(NARI_KEY), chain, transport: http(RPC_URL) });
  const operator = createWalletClient({ account: privateKeyToAccount(OPERATOR_KEY), chain, transport: http(RPC_URL) });
  return { user: { pub, wallet, addresses: DEFI_ADDRESSES } as DefiClients, operator };
}

function StudyControls({ clients, operator, restaking, onDone }: {
  clients: DefiClients;
  operator: ReturnType<typeof makeClients>["operator"];
  restaking: boolean;
  onDone: () => void;
}) {
  const [err, setErr] = useState<string | null>(null);
  const run = (fn: () => Promise<unknown>) => async () => {
    setErr(null);
    try { await fn(); onDone(); }
    catch (e) { setErr(e instanceof Error ? e.message.split("\n")[0] : String(e)); }
  };
  const write = async (address: `0x${string}`, functionName: string, args: unknown[] = [], value?: bigint) => {
    const hash = await operator.writeContract({
      address, abi: operatorAbi, functionName: functionName as never, args: args as never, value,
    });
    await clients.pub.waitForTransactionReceipt({ hash });
  };
  const a = clients.addresses;
  return (
    <section className="panel study">
      <h2>Study controls (operator · local node only)</h2>
      <div className="row">
        <button onClick={run(() => write(a.liquidityPool, "addRewards", ["staking"], parseEther("0.01")))}>
          Drip staking rewards +0.01
        </button>
        <button disabled={restaking} onClick={run(() => write(a.liquidityPool, "delegateToAVS", [a.mockAVS]))}>
          Restaking on (delegate AVS)
        </button>
        <button disabled={!restaking} onClick={run(() => write(a.mockAVS, "payRestakingRewards", [], parseEther("0.005")))}>
          AVS pays +0.005
        </button>
        <button disabled={!restaking} className="danger" onClick={run(() => write(a.mockAVS, "slashPool", [parseEther("0.05")]))}>
          Simulate slash −0.05
        </button>
      </div>
      <p className="hint">
        These drive the pool the way validators/EigenLayer would; in production they do not exist —
        rewards and slashes arrive from the chain, not from buttons.
      </p>
      {err && <p className="err">{err}</p>}
    </section>
  );
}

export default function DefiClient() {
  const { user, operator } = useMemo(makeClients, []);
  const { state, error, refresh } = useDefiState(user);
  return (
    <main className="defi-study">
      <h1>Jayverse DeFi — liquid-restaking study <span className="badge">LOCAL CHAIN</span></h1>
      <p className="hint">
        EtherFi&apos;s core mechanics rebuilt from scratch: deposit &rarr; rebasing jeETH &rarr; rewards through
        the exchange rate &rarr; restaking &rarr; withdrawal queue. This page connects to <code>{RPC_URL}</code>{" "}
        <b>on your machine</b> — a study chain with well-known dev keys, no real funds.
      </p>
      {error ? (
        <section className="panel">
          <h2>No local node reachable</h2>
          <p className="hint">
            Run the study chain, deploy the contracts, then reload:
          </p>
          <pre className="setup">{`anvil                                # terminal 1
git clone https://github.com/linked0/jayverse-defi && cd jayverse-defi
forge test && npm install && npm run deploy`}</pre>
          <p className="err">({error})</p>
        </section>
      ) : !state ? (
        <p className="hint">connecting to {RPC_URL}…</p>
      ) : (
        <>
          <PositionPanel state={state} clients={user} />
          <DepositPanel state={state} clients={user} onDone={refresh} />
          <StudyControls clients={user} operator={operator} restaking={state.restaking} onDone={refresh} />
          <MathPanel state={state} />
        </>
      )}
    </main>
  );
}
