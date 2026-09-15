"use client";

// AA §3 — ERC-7702/7715 세션 키 데모. 설계: docs/tasks/current-plan.md §3.
// 흐름: MetaMask 연결 → 브라우저에서 1회용 세션 계정 생성 → ERC-7715로 "최대 5 테스트 jUSD,
// 1시간 한도" 권한을 세션 계정에 위임 → 세션 계정이 (재서명 팝업 없이) 그 한도 안에서 직접
// 트랜잭션을 브로드캐스트. 요구사항: MetaMask v13.23.0+ (Advanced Permissions 지원).
import { useEffect, useRef, useState } from "react";
import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
  encodeFunctionData,
  erc20Abi,
  parseUnits,
  parseEther,
  numberToHex,
} from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { defineChain } from "viem";
import { erc7715ProviderActions, erc7710WalletActions } from "@metamask/smart-accounts-kit/actions";
import { useLang } from "../../LangContext";
import { pick } from "@/lib/i18n";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// 이 데모는 Jayverse 데브넷(313370)에서 돈다. 이전에는 Sepolia + Circle 공식 테스트
// USDC 였는데, jUSD 가 생태계의 유일한 달러가 되면서 옮겼다(jay, 2026-09-15). 데브넷을
// 쓰면 포싯이 셀프서비스이고 jUSD 의 `mint` 가 열려 있어서, 방문자가 외부 포싯 대기열에
// 묶이지 않는다. 대신 MetaMask 의 ERC-7715 가 커스텀 체인에서 Sepolia 만큼 검증되지
// 않았다는 위험은 남아 있다 — 권한 요청이 거부되면 그 지점이 원인이다.
const DEVNET_CHAIN_ID = 313370;
const DEVNET_RPC = process.env.NEXT_PUBLIC_DEVNET_RPC || "https://devnet.jaylabs.xyz/rpc";
const DEVNET_EXPLORER = process.env.NEXT_PUBLIC_DEVNET_EXPLORER || "https://devnet.jaylabs.xyz/explorer";
// jUSD — Jayverse 의 달러. 시드가 배포하며, 주소는 데브넷 Registry 의 `token:JUSD` 와 같다.
const JUSD_DEVNET = (process.env.NEXT_PUBLIC_DEVNET_JUSD ||
  "0x55F1b740d15c097eD1FfD0520540131A5B7127e6") as `0x${string}`;

const jayverseDevnet = defineChain({
  id: DEVNET_CHAIN_ID,
  name: "Jayverse Devnet",
  nativeCurrency: { name: "Test Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [DEVNET_RPC] } },
  blockExplorers: { default: { name: "Otterscan", url: DEVNET_EXPLORER } },
});

const ALLOWANCE_JUSD = "5"; // 최대 5 jUSD
const EXPIRY_SECONDS = 3600; // 1시간
// 세션 계정 가스용 — 데브넷 전송 한 건이면 충분하고도 남는 금액.
const FUND_AMOUNT_ETH = "0.002";

type Step = "idle" | "connected" | "granted" | "spent";

export default function SessionKeyDemo() {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  const [step, setStep] = useState<Step>("idle");
  const [owner, setOwner] = useState<string | null>(null);
  const [sessionAddress, setSessionAddress] = useState<string | null>(null);
  const [permission, setPermission] = useState<{ context: `0x${string}`; delegationManager: `0x${string}` } | null>(
    null
  );
  const [txHash, setTxHash] = useState<string | null>(null);
  const [ownerCode, setOwnerCode] = useState<{ delegated: boolean; implementation?: string } | null>(null);
  const [fundHash, setFundHash] = useState<string | null>(null);
  const [funded, setFunded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 세션 계정 개인키는 이 컴포넌트 안에서만 산다 — 서버로 전송되지 않고, 저장되지도 않는다.
  const [sessionPrivateKey, setSessionPrivateKey] = useState<`0x${string}` | null>(null);

  // adopt는 effect의 리스너 안에서도 불리므로, 최신 owner를 state 대신 ref로 읽는다
  // (리스너가 마운트 시점의 owner를 클로저에 가둬버리는 문제 방지).
  const ownerRef = useRef<string | null>(null);

  // 이미 연결된 계정을 이어받는다. 계정이 바뀌면 이전 오너에게 받은 권한/세션 키는 무효이므로 새로 만든다.
  function adopt(addr: string) {
    if (ownerRef.current?.toLowerCase() === addr.toLowerCase()) return;
    ownerRef.current = addr;
    setOwner(addr);
    const pk = generatePrivateKey();
    setSessionPrivateKey(pk);
    setSessionAddress(privateKeyToAccount(pk).address);
    setPermission(null);
    setTxHash(null);
    setOwnerCode(null);
    setFundHash(null);
    setFunded(false);
    setError(null);
    setStep("connected");
  }

  function resetLocal() {
    ownerRef.current = null;
    setOwner(null);
    setSessionPrivateKey(null);
    setSessionAddress(null);
    setPermission(null);
    setTxHash(null);
    setOwnerCode(null);
    setFundHash(null);
    setFunded(false);
    setError(null);
    setStep("idle");
  }

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;

    // eth_accounts는 팝업 없이 "이 사이트에 이미 연결된 계정"만 돌려준다 — MetaMask에서 이미
    // 연결해 둔 지갑이 있으면 Connect를 누르지 않아도 그대로 이어받는다.
    eth
      .request({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        if (accounts?.[0]) adopt(accounts[0]);
      })
      .catch(() => {});

    // MetaMask에서 계정을 바꾸거나 연결을 끊으면 이 화면도 따라간다.
    const onAccountsChanged = (accounts: string[]) => {
      if (!accounts?.length) resetLocal();
      else adopt(accounts[0]);
    };
    eth.on?.("accountsChanged", onAccountsChanged);
    return () => eth.removeListener?.("accountsChanged", onAccountsChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connect() {
    setError(null);
    if (!window.ethereum) {
      setError(t("MetaMask가 설치되어 있지 않습니다.", "MetaMask is not installed."));
      return;
    }
    setBusy(true);
    try {
      const [addr] = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      if (addr) adopt(addr);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  // 네트워크가 데브넷이 아니면 "직접 바꾸세요"라고 막는 대신 전환을 요청한다 — 사용자가 할 일을
  // 알려주기만 하는 에러는 한 번의 클릭으로 대신할 수 있으면 그냥 대신하는 게 낫다(jay 테스트, 2026-08-05).
  // 지갑에 데브넷이 아예 없으면(4902) 추가부터 요청한다. Sepolia 와 달리 데브넷은 어떤
  // 지갑에도 기본 내장되어 있지 않으므로, 4902 는 예외가 아니라 첫 방문자의 정상 경로다.
  async function ensureDevnet(): Promise<boolean> {
    const addChain = () =>
      window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: numberToHex(DEVNET_CHAIN_ID),
            chainName: "Jayverse Devnet",
            nativeCurrency: { name: "Test Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: [DEVNET_RPC],
            blockExplorerUrls: [DEVNET_EXPLORER],
          },
        ],
      });

    const current = (await window.ethereum.request({ method: "eth_chainId" })) as string;
    if (parseInt(current, 16) === DEVNET_CHAIN_ID) return true;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: numberToHex(DEVNET_CHAIN_ID) }],
      });
      return true;
    } catch (e) {
      if ((e as { code?: number })?.code === 4902) {
        await addChain();
        return true;
      }
      setError(
        t(
          "Jayverse 데브넷으로의 전환이 거부되었습니다 — MetaMask에서 직접 전환한 뒤 다시 시도해 주세요.",
          "The network switch was rejected — switch to the Jayverse Devnet in MetaMask and try again."
        )
      );
      return false;
    }
  }

  // 세션 계정은 자기 가스를 직접 내는데 새로 생성된 계정이라 잔액이 0이다 — 3단계가 여기서
  // "insufficient funds"로 죽는다(jay 실제 테스트, 2026-08-05). faucet은 새 주소마다 오래 걸리고
  // 세션 키는 새로고침하면 사라지므로, 오너 지갑에서 바로 소액을 보내는 버튼이 가장 빠른 경로.
  async function fundSession() {
    if (!window.ethereum || !owner || !sessionAddress) return;
    setError(null);
    setBusy(true);
    try {
      if (!(await ensureDevnet())) return;
      const hash = (await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: owner,
            to: sessionAddress,
            value: `0x${parseEther(FUND_AMOUNT_ETH).toString(16)}`,
          },
        ],
      })) as string;
      setFundHash(hash);
      // 채굴될 때까지 기다렸다가 알려준다 — 바로 3단계를 누르면 잔액이 아직 0일 수 있다.
      const publicClient = createPublicClient({ chain: jayverseDevnet, transport: http(DEVNET_RPC) });
      await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` }).catch(() => {});
      setFunded(true);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  // EIP-7702는 지갑 안에서 조용히 일어나 화면에 흔적이 없다 — 오너 계정의 코드 슬롯을 직접 읽어
  // 위임 지정자(0xef0100 + 구현체)가 생겼는지 보여준다. 권한 부여 전/후로 눌러보면 차이가 보인다.
  async function checkOwnerCode() {
    if (!owner) return;
    setError(null);
    setBusy(true);
    try {
      const client = createPublicClient({ chain: jayverseDevnet, transport: http(DEVNET_RPC) });
      const code = await client.getCode({ address: owner as `0x${string}` });
      if (!code || code === "0x") setOwnerCode({ delegated: false });
      else if (code.slice(2, 8).toLowerCase() === "ef0100")
        setOwnerCode({ delegated: true, implementation: `0x${code.slice(8, 48)}` });
      else setOwnerCode({ delegated: false });
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      // dapp이 지갑을 강제로 끊을 수는 없다 — 사이트에 부여된 계정 접근 권한을 회수해야
      // 새로고침 후에도 eth_accounts가 빈 배열을 준다. 미지원 지갑이면 로컬 초기화만 한다.
      await window.ethereum?.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch {
      /* wallet_revokePermissions 미지원 — 아래 resetLocal로 충분 */
    } finally {
      resetLocal();
      setBusy(false);
    }
  }

  async function grant() {
    if (!sessionAddress) return;
    setError(null);
    setBusy(true);
    try {
      // 권한 요청 자체에 chainId를 넣지만, 지갑이 다른 네트워크에 있으면 팝업이 엉키기 쉬워 먼저 맞춘다.
      if (!(await ensureDevnet())) return;
      const walletClient = createWalletClient({
        transport: custom(window.ethereum),
      }).extend(erc7715ProviderActions());

      const currentTime = Math.floor(Date.now() / 1000);
      const granted = await walletClient.requestExecutionPermissions([
        {
          chainId: DEVNET_CHAIN_ID,
          expiry: currentTime + EXPIRY_SECONDS,
          to: sessionAddress as `0x${string}`,
          permission: {
            type: "erc20-token-allowance",
            data: {
              tokenAddress: JUSD_DEVNET,
              allowanceAmount: parseUnits(ALLOWANCE_JUSD, 6),
              startTime: currentTime,
              justification: `rabbit AA demo — up to ${ALLOWANCE_JUSD} test jUSD, 1h`,
            },
            isAdjustmentAllowed: false,
          },
        },
      ]);

      setPermission({
        context: granted[0].context,
        delegationManager: granted[0].delegationManager,
      });
      setStep("granted");
    } catch (e) {
      setError(
        String(e instanceof Error ? e.message : e) +
          " — " +
          t(
            "MetaMask v13.23.0 이상이 필요할 수 있습니다.",
            "This may require MetaMask v13.23.0 or later."
          )
      );
    } finally {
      setBusy(false);
    }
  }

  async function spend() {
    if (!permission || !sessionPrivateKey || !sessionAddress) return;
    setError(null);
    setBusy(true);
    try {
      const sessionAccount = privateKeyToAccount(sessionPrivateKey);
      const publicClient = createPublicClient({ chain: jayverseDevnet, transport: http(DEVNET_RPC) });
      const sessionWalletClient = createWalletClient({
        account: sessionAccount,
        chain: jayverseDevnet,
        transport: http(DEVNET_RPC),
      }).extend(erc7710WalletActions());

      // 재서명 팝업 없이 — 세션 계정이 위임받은 한도 안에서 스스로 서명·브로드캐스트한다.
      // 데모 목적상 세션 계정 자기 자신에게 소액(0.1 jUSD) 전송.
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [sessionAccount.address, parseUnits("0.1", 6)],
      });

      const hash = await sessionWalletClient.sendTransactionWithDelegation({
        account: sessionAccount,
        chain: jayverseDevnet,
        to: JUSD_DEVNET,
        data,
        permissionContext: permission.context,
        delegationManager: permission.delegationManager,
      });
      await publicClient.waitForTransactionReceipt({ hash }).catch(() => {});
      setTxHash(hash);
      setStep("spent");
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel" style={{ marginTop: 24, maxWidth: 560 }}>
      {/* 준비물 — 이 데모는 데브넷의 실제 토큰과 가스를 쓴다. 잔액이 없으면 마지막
          전송 단계에서 실패하므로, 시작 전에 확인할 항목을 눈에 띄게 적어둔다. 이 목록 자체가
          번호를 쓰므로, 아래 단계는 숫자 대신 버튼 이름으로 가리킨다(번호 충돌 방지).
          포싯과 mint 는 둘 다 명령 한 줄이다 — 웹 UI 가 있는 척하지 않는다. */}
      <div
        style={{
          border: "1px solid var(--border, #e5e7eb)",
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
          fontSize: 13,
        }}
      >
        <strong>{t("시작 전 준비물 (Jayverse 데브넷)", "Before you start (Jayverse Devnet)")}</strong>
        <ol className="sub" style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.7 }}>
          <li>
            {t("오너 지갑에 jUSD", "jUSD in the owner wallet")} —{" "}
            {t(
              "jUSD의 mint는 누구나 호출할 수 있습니다(데모 체인 전용). 마지막 「한도 내 전송 실행」이 실제로 토큰을 옮기므로, 잔액이 0이면 revert 됩니다.",
              "jUSD's mint is open to anyone (demo chain only). The final “Execute a bounded transfer” really moves tokens, so a zero balance will revert."
            )}
            <code style={{ display: "block", marginTop: 4, fontSize: 11, wordBreak: "break-all" }}>
              cast send {JUSD_DEVNET} &quot;mint(address,uint256)&quot; &lt;owner&gt; 100000000 --rpc-url {DEVNET_RPC}
            </code>
          </li>
          <li>
            {t("세션 계정에 소액의 데브넷 ETH", "A little devnet ETH in the session account")} —{" "}
            {t(
              "그 전송은 세션 계정이 스스로 브로드캐스트하므로 가스도 이 계정이 직접 냅니다. 새로 생성된 계정은 잔액이 0이니, MetaMask를 연결하면 아래에 표시되는 세션 계정 주소로 먼저 보내세요. 데브넷 포싯은 주소당 하루 10 ETH를 줍니다.",
              "That transfer is broadcast by the session account itself, so it pays its own gas. A freshly generated account holds nothing — fund the session address shown below once MetaMask is connected. The devnet faucet pays 10 ETH per address per day."
            )}
            <code style={{ display: "block", marginTop: 4, fontSize: 11, wordBreak: "break-all" }}>
              curl -X POST https://devnet.jaylabs.xyz/faucet -H &apos;content-type: application/json&apos; -d
              &apos;{"{"}&quot;address&quot;:&quot;&lt;session&gt;&quot;{"}"}&apos;
            </code>
          </li>
        </ol>
        <p className="sub" style={{ margin: "8px 0 0", fontSize: 12 }}>
          {t("토큰", "Token")}:{" "}
          <a href={`${DEVNET_EXPLORER}/address/${JUSD_DEVNET}`} target="_blank" rel="noreferrer">
            {t("jUSD — Jayverse 달러", "jUSD — the Jayverse dollar")} ↗
          </a>{" "}
          — {t("소수점 6자리, 실제 가치 없음.", "6 decimals, no real value.")}{" "}
          <a href="/devnet">{t("데브넷 상태", "Devnet status")}</a>
        </p>
      </div>

      <strong>{t("1. 데브넷에서 MetaMask 연결 + 세션 계정 생성", "1. Connect MetaMask on the devnet + generate a session account")}</strong>
      {owner ? (
        <p className="sub" style={{ marginTop: 4 }}>
          {t("소유자", "Owner")}: {owner} → {t("세션 계정", "session account")}: {sessionAddress}
        </p>
      ) : (
        <p className="sub" style={{ marginTop: 4 }}>
          {t(
            "MetaMask 지갑(오너)이 브라우저에서 생성된 1회용 세션 계정에 한도 안 권한을 위임합니다.",
            "The MetaMask wallet (owner) delegates a bounded permission to a session account generated in the browser."
          )}
        </p>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={connect} disabled={busy || !!owner}>
          {t("MetaMask 연결", "Connect MetaMask")}
        </button>
        <button type="button" onClick={disconnect} disabled={busy || !owner}>
          {t("연결 해제", "Disconnect")}
        </button>
        <button type="button" onClick={checkOwnerCode} disabled={busy || !owner}>
          {t("내 계정 확인 (EIP-7702)", "Check my account (EIP-7702)")}
        </button>
      </div>
      {ownerCode && (
        <p className="sub" style={{ marginTop: 6, fontSize: 13 }}>
          {ownerCode.delegated ? (
            <>
              {t(
                "EIP-7702로 업그레이드됨 — 코드 슬롯에 위임 지정자가 있습니다. 구현체: ",
                "Upgraded via EIP-7702 — the code slot holds a delegation designator. Implementation: "
              )}
              <a
                href={`${DEVNET_EXPLORER}/address/${ownerCode.implementation}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontFamily: "ui-monospace, monospace" }}
              >
                {ownerCode.implementation} ↗
              </a>
            </>
          ) : (
            t(
              "아직 평범한 EOA입니다 — 코드 없음. 권한을 부여한 뒤 다시 눌러보면 달라집니다.",
              "Still a plain EOA — no code. Grant the permission below, then press this again to see the difference."
            )
          )}
        </p>
      )}
      {owner && (
        <p className="sub" style={{ marginTop: 6, fontSize: 12 }}>
          {t(
            "연결 해제 시 이 사이트의 계정 접근 권한을 회수하고, 세션 키와 부여된 권한도 함께 폐기합니다.",
            "Disconnecting revokes this site's account access and discards the session key and any granted permission."
          )}
        </p>
      )}

      <div style={{ marginTop: 16, opacity: step === "idle" ? 0.5 : 1 }}>
        <strong>{t("2. ERC-7715 권한 요청", "2. Request an ERC-7715 permission")}</strong>
        <p className="sub" style={{ marginTop: 4 }}>
          {t(
            `최대 ${ALLOWANCE_JUSD} 테스트 jUSD, ${EXPIRY_SECONDS / 60}분 유효 — MetaMask 팝업에서 승인.`,
            `Up to ${ALLOWANCE_JUSD} test jUSD, valid ${EXPIRY_SECONDS / 60} min — approve in the MetaMask popup.`
          )}
        </p>
        <button type="button" onClick={grant} disabled={busy || step === "idle" || step !== "connected"} style={{ marginTop: 8 }}>
          {t("세션 키 권한 부여", "Grant session key permission")}
        </button>
        <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
          {t(
            "ERC-7715는 컨트랙트가 아니라 지갑 RPC 규격입니다 — 온체인 강제는 ERC-7710의 DelegationManager 컨트랙트가 맡고, 그 주소는 우리 코드에 없이 MetaMask가 권한 응답으로 알려줍니다(아래).",
            "ERC-7715 is a wallet RPC spec, not a contract — on-chain enforcement lives in ERC-7710's DelegationManager, whose address is not in our code: MetaMask returns it with the granted permission (below)."
          )}
        </p>
        {permission && (
          <div className="sub" style={{ marginTop: 6, fontSize: 13 }}>
            <p style={{ margin: 0 }}>
              {t("권한 컨텍스트 발급됨", "Permission context issued")}: {permission.context.slice(0, 18)}…
            </p>
            <p style={{ margin: "2px 0 0" }}>
              DelegationManager:{" "}
              <a
                href={`${DEVNET_EXPLORER}/address/${permission.delegationManager}`}
                target="_blank"
                rel="noreferrer"
              >
                {permission.delegationManager} ↗
              </a>
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, opacity: step === "granted" || step === "spent" ? 1 : 0.5 }}>
        <strong>{t("3. 재서명 없이 한도 내 지출", "3. Spend within the limit, no re-signing")}</strong>
        <p className="sub" style={{ marginTop: 4 }}>
          {t(
            "세션 계정이 위임받은 권한만으로 직접 서명·전송 — MetaMask 팝업이 뜨지 않습니다.",
            "The session account signs and sends on its own using only the delegated permission — no MetaMask popup."
          )}
        </p>
        <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
          {t(
            "오너 잔액에서 0.1 jUSD를 전송합니다. 가스는 세션 계정의 데브넷 ETH에서 나갑니다 — 둘 중 하나라도 비어 있으면 여기서 실패합니다.",
            "Transfers 0.1 jUSD from the owner's balance; gas comes from the session account's devnet ETH — if either is empty, this step is where it fails."
          )}
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={fundSession} disabled={busy || !owner}>
            {t(`세션 계정에 ${FUND_AMOUNT_ETH} ETH 충전`, `Fund the session account (${FUND_AMOUNT_ETH} ETH)`)}
          </button>
          <button type="button" onClick={spend} disabled={busy || step !== "granted"}>
            {t("한도 내 전송 실행", "Execute a bounded transfer")}
          </button>
        </div>
        {fundHash && (
          <p className="sub" style={{ marginTop: 6, fontSize: 13 }}>
            {funded
              ? t("충전 완료 — 이제 전송을 실행할 수 있습니다. ", "Funded — you can run the transfer now. ")
              : t("충전 트랜잭션 전송됨, 채굴 대기 중… ", "Funding transaction sent, waiting for it to be mined… ")}
            <a href={`${DEVNET_EXPLORER}/tx/${fundHash}`} target="_blank" rel="noreferrer">
              {t("Etherscan", "Etherscan")} ↗
            </a>
          </p>
        )}
        {txHash && (
          <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
            <a href={`${DEVNET_EXPLORER}/tx/${txHash}`} target="_blank" rel="noreferrer">
              {t("Etherscan에서 트랜잭션 보기", "View transaction on Etherscan")} ↗
            </a>
          </p>
        )}
      </div>

      {error && (
        <p className="sub" style={{ marginTop: 16, color: "#dc2626" }}>
          {error}
        </p>
      )}
    </div>
  );
}
