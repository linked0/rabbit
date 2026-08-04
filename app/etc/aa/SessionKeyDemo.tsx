"use client";

// AA §3 — ERC-7702/7715 세션 키 데모. 설계: docs/tasks/current-plan.md §3.
// 흐름: MetaMask 연결 → 브라우저에서 1회용 세션 계정 생성 → ERC-7715로 "최대 5 테스트 USDC,
// 1시간 한도" 권한을 세션 계정에 위임 → 세션 계정이 (재서명 팝업 없이) 그 한도 안에서 직접
// 트랜잭션을 브로드캐스트. 요구사항: MetaMask v13.23.0+ (Advanced Permissions 지원).
import { useState } from "react";
import { createWalletClient, createPublicClient, custom, http, encodeFunctionData, erc20Abi, parseUnits } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { sepolia } from "viem/chains";
import { erc7715ProviderActions, erc7710WalletActions } from "@metamask/smart-accounts-kit/actions";
import { useLang } from "../../LangContext";
import { pick } from "@/lib/i18n";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Sepolia USDC (MetaMask 공식 문서 예시 주소) — 테스트넷 토큰, 실제 가치 없음.
const USDC_SEPOLIA = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as const;
// 공개 읽기 전용 RPC — 키 불필요 (세션 계정의 브로드캐스트 전용, jay의 Alchemy 키는 안 씀).
const PUBLIC_SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
const ALLOWANCE_USDC = "5"; // 최대 5 테스트 USDC
const EXPIRY_SECONDS = 3600; // 1시간

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 세션 계정 개인키는 이 컴포넌트 안에서만 산다 — 서버로 전송되지 않고, 저장되지도 않는다.
  const [sessionPrivateKey, setSessionPrivateKey] = useState<`0x${string}` | null>(null);

  async function connect() {
    setError(null);
    if (!window.ethereum) {
      setError(t("MetaMask가 설치되어 있지 않습니다.", "MetaMask is not installed."));
      return;
    }
    setBusy(true);
    try {
      const [addr] = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      setOwner(addr);

      const pk = generatePrivateKey();
      setSessionPrivateKey(pk);
      setSessionAddress(privateKeyToAccount(pk).address);

      setStep("connected");
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  async function grant() {
    if (!sessionAddress) return;
    setError(null);
    setBusy(true);
    try {
      const walletClient = createWalletClient({
        transport: custom(window.ethereum),
      }).extend(erc7715ProviderActions());

      const currentTime = Math.floor(Date.now() / 1000);
      const granted = await walletClient.requestExecutionPermissions([
        {
          chainId: sepolia.id,
          expiry: currentTime + EXPIRY_SECONDS,
          to: sessionAddress as `0x${string}`,
          permission: {
            type: "erc20-token-allowance",
            data: {
              tokenAddress: USDC_SEPOLIA,
              allowanceAmount: parseUnits(ALLOWANCE_USDC, 6),
              startTime: currentTime,
              justification: `rabbit AA demo — up to ${ALLOWANCE_USDC} test USDC, 1h`,
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
      const publicClient = createPublicClient({ chain: sepolia, transport: http(PUBLIC_SEPOLIA_RPC) });
      const sessionWalletClient = createWalletClient({
        account: sessionAccount,
        chain: sepolia,
        transport: http(PUBLIC_SEPOLIA_RPC),
      }).extend(erc7710WalletActions());

      // 재서명 팝업 없이 — 세션 계정이 위임받은 한도 안에서 스스로 서명·브로드캐스트한다.
      // 데모 목적상 세션 계정 자기 자신에게 소액(0.1 USDC) 전송.
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [sessionAccount.address, parseUnits("0.1", 6)],
      });

      const hash = await sessionWalletClient.sendTransactionWithDelegation({
        account: sessionAccount,
        chain: sepolia,
        to: USDC_SEPOLIA,
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
      <strong>{t("1. Sepolia에서 MetaMask 연결 + 세션 계정 생성", "1. Connect MetaMask on Sepolia + generate a session account")}</strong>
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
      <button type="button" onClick={connect} disabled={busy || step !== "idle"} style={{ marginTop: 8 }}>
        {t("MetaMask 연결", "Connect MetaMask")}
      </button>

      <div style={{ marginTop: 16, opacity: step === "idle" ? 0.5 : 1 }}>
        <strong>{t("2. ERC-7715 권한 요청", "2. Request an ERC-7715 permission")}</strong>
        <p className="sub" style={{ marginTop: 4 }}>
          {t(
            `최대 ${ALLOWANCE_USDC} 테스트 USDC, ${EXPIRY_SECONDS / 60}분 유효 — MetaMask 팝업에서 승인.`,
            `Up to ${ALLOWANCE_USDC} test USDC, valid ${EXPIRY_SECONDS / 60} min — approve in the MetaMask popup.`
          )}
        </p>
        <button type="button" onClick={grant} disabled={busy || step === "idle" || step !== "connected"} style={{ marginTop: 8 }}>
          {t("세션 키 권한 부여", "Grant session key permission")}
        </button>
        {permission && (
          <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
            {t("권한 컨텍스트 발급됨", "Permission context issued")}: {permission.context.slice(0, 18)}…
          </p>
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
        <button type="button" onClick={spend} disabled={busy || step !== "granted"} style={{ marginTop: 8 }}>
          {t("한도 내 전송 실행", "Execute a bounded transfer")}
        </button>
        {txHash && (
          <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
            <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">
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
