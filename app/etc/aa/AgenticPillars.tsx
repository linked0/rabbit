"use client";

// AA §6 — Agentic AA 4대 요소 (pillar 1은 위의 SessionKeyDemo). 설계: docs/tasks/current-plan.md §6.
// 스택: thirdweb Connect + Account(ERC-4337 스마트 계정) + sponsorGas(paymaster). Sepolia.
import { ThirdwebProvider, ConnectButton, useActiveAccount, useSendTransaction, useSendBatchTransaction, lightTheme } from "thirdweb/react";
import { prepareTransaction } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { thirdwebClient } from "@/lib/thirdweb-client";
import { useLang } from "../../LangContext";
import { pick } from "@/lib/i18n";

// thirdweb의 기본 라이트 테마 버튼은 흰 배경 + 테두리 없음 — 이 페이지 배경도 흰색이라 버튼이
// 안 보이고 텍스트만 떠 있는 것처럼 보였다(2026-08-04, jay 스크린샷으로 확인). 앱의 --primary
// 버튼 색과 맞춰서 다른 버튼들과 시각적으로 통일 + 항상 보이게 고정.
const connectButtonTheme = lightTheme({
  colors: { primaryButtonBg: "var(--primary)", primaryButtonText: "var(--primary-foreground)" },
});

function Pillar2GasIndependence({ t }: { t: (ko: string, en: string) => string }) {
  const account = useActiveAccount();
  const { mutate: sendTx, data, error, isPending } = useSendTransaction();
  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <strong>{t("② 가스 독립 (paymaster)", "② Gas independence (paymaster)")}</strong>
      <p className="sub" style={{ marginTop: 4 }}>
        {t(
          "스마트 계정에 테스트넷 ETH가 없어도, thirdweb paymaster가 가스를 대신 내 트랜잭션이 성사됩니다.",
          "Even with zero testnet ETH in the smart account, thirdweb's paymaster covers gas so the transaction still goes through."
        )}
      </p>
      <button
        type="button"
        disabled={!account || isPending}
        style={{ marginTop: 8 }}
        onClick={() =>
          account &&
          sendTx(
            prepareTransaction({ to: account.address, chain: sepolia, client: thirdwebClient, value: 0n })
          )
        }
      >
        {t("스폰서 트랜잭션 전송", "Send a sponsored transaction")}
      </button>
      {data && (
        <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
          <a href={`https://sepolia.etherscan.io/tx/${data.transactionHash}`} target="_blank" rel="noreferrer">
            {t("Etherscan에서 보기", "View on Etherscan")} ↗
          </a>
        </p>
      )}
      {error && (
        <p className="sub" style={{ marginTop: 4, color: "#dc2626" }}>
          {error.message}
        </p>
      )}
    </div>
  );
}

function Pillar3AtomicIntent({ t }: { t: (ko: string, en: string) => string }) {
  const account = useActiveAccount();
  const { mutate: sendBatch, data, error, isPending } = useSendBatchTransaction();
  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <strong>{t("③ 원자적 의도 (배치 UserOperation)", "③ Atomic intent (batched UserOperation)")}</strong>
      <p className="sub" style={{ marginTop: 4 }}>
        {t(
          "두 개의 콜을 하나의 UserOperation으로 묶어 실행 — 하나라도 실패하면 전체가 되돌아갑니다(원자성).",
          "Two calls bundled into a single UserOperation — if either failed, both would revert together (atomicity)."
        )}
      </p>
      <button
        type="button"
        disabled={!account || isPending}
        style={{ marginTop: 8 }}
        onClick={() =>
          account &&
          sendBatch([
            prepareTransaction({ to: account.address, chain: sepolia, client: thirdwebClient, value: 0n }),
            prepareTransaction({ to: account.address, chain: sepolia, client: thirdwebClient, value: 0n }),
          ])
        }
      >
        {t("배치 트랜잭션 전송 (2개 콜)", "Send a batch transaction (2 calls)")}
      </button>
      {data && (
        <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
          <a href={`https://sepolia.etherscan.io/tx/${data.transactionHash}`} target="_blank" rel="noreferrer">
            {t("Etherscan에서 보기", "View on Etherscan")} ↗
          </a>
        </p>
      )}
      {error && (
        <p className="sub" style={{ marginTop: 4, color: "#dc2626" }}>
          {error.message}
        </p>
      )}
    </div>
  );
}

function Pillar4Kya({ t }: { t: (ko: string, en: string) => string }) {
  return (
    <div className="panel" style={{ marginTop: 16, opacity: 0.75 }}>
      <strong>{t("④ KYA — 에이전트 신원/평판 (탐색적)", "④ KYA — agent identity/reputation (exploratory)")}</strong>
      <p className="sub" style={{ marginTop: 4 }}>
        {t(
          "ERC-8004(신원·평판 레지스트리)은 아직 초기 단계입니다 — Sepolia 배포 현황이 확인되기 전까지는 라이브 데모 대신 이 설명만 제공합니다. 개념: 거래 상대가 온체인에서 에이전트의 신원/평판을 조회 후 거래 여부를 결정.",
          "ERC-8004 (identity/reputation registry) is still young — until its Sepolia deployment status is verified, this stays an explainer rather than a live demo. Concept: a counterparty looks up the agent's on-chain identity/reputation before deciding whether to transact."
        )}
      </p>
    </div>
  );
}

function PillarsInner({ t }: { t: (ko: string, en: string) => string }) {
  const account = useActiveAccount();
  return (
    <div style={{ marginTop: 24 }}>
      <ConnectButton
        client={thirdwebClient}
        accountAbstraction={{ chain: sepolia, sponsorGas: true }}
        theme={connectButtonTheme}
      />
      {!account && (
        <p className="sub" style={{ marginTop: 8 }}>
          {t(
            "위 Connect로 지갑을 연결하면 thirdweb이 ERC-4337 스마트 계정으로 감싸줍니다 — 아래 pillar들은 그 계정 기준입니다.",
            "Connect above and thirdweb wraps the wallet in an ERC-4337 smart account — the pillars below act on that account."
          )}
        </p>
      )}
      <Pillar2GasIndependence t={t} />
      <Pillar3AtomicIntent t={t} />
      <Pillar4Kya t={t} />
    </div>
  );
}

export default function AgenticPillars() {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  return (
    <ThirdwebProvider>
      <PillarsInner t={t} />
    </ThirdwebProvider>
  );
}
