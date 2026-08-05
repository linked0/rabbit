"use client";

// EIP-7702 §3-보조 — "계정에 코드가 붙었는지" 직접 확인하는 인스펙터.
// 7702는 지갑 안에서 조용히 일어나 눈에 안 보인다는 게 이 데모의 출발점이라, 여기서는
// eth_getCode 결과를 그대로 보여준다 — 위임 지정자(0xef0100 + 구현체 주소)가 있으면 업그레이드된 계정.
// 가스도 서명도 필요 없는 읽기 전용이라, 지갑이 없는 방문자도 주소만 넣으면 볼 수 있다.
import { useEffect, useRef, useState } from "react";
import { createPublicClient, http, isAddress } from "viem";
import { sepolia } from "viem/chains";
import { useLang } from "../../LangContext";
import { pick } from "@/lib/i18n";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// 공개 읽기 전용 RPC — 키 불필요.
const PUBLIC_SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
// EIP-7702가 계정 코드 슬롯에 심는 3바이트 매직 프리픽스. 뒤에 20바이트 구현체 주소가 붙어 총 23바이트.
const DESIGNATOR_PREFIX = "ef0100";

type Result =
  | { kind: "eoa" }
  | { kind: "delegated"; implementation: string; raw: string }
  | { kind: "contract"; bytes: number };

export default function AccountInspector() {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사용자가 주소를 직접 입력한 뒤에는 지갑 계정으로 덮어쓰지 않는다.
  const touched = useRef(false);

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;
    // 팝업 없이, 이미 이 사이트에 연결된 계정이 있으면 입력란을 채워준다.
    eth
      .request({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        if (accounts?.[0] && !touched.current) setAddress(accounts[0]);
      })
      .catch(() => {});
  }, []);

  async function connect() {
    setError(null);
    if (!window.ethereum) {
      setError(t("MetaMask가 설치되어 있지 않습니다.", "MetaMask is not installed."));
      return;
    }
    try {
      const [addr] = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      if (addr) setAddress(addr);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }

  async function inspect() {
    setError(null);
    setResult(null);
    if (!isAddress(address)) {
      setError(t("올바른 주소 형식이 아닙니다.", "That is not a valid address."));
      return;
    }
    setBusy(true);
    try {
      const client = createPublicClient({ chain: sepolia, transport: http(PUBLIC_SEPOLIA_RPC) });
      const code = await client.getCode({ address: address as `0x${string}` });

      // viem은 코드가 없으면 undefined 또는 "0x"를 준다 — 둘 다 평범한 EOA.
      if (!code || code === "0x") {
        setResult({ kind: "eoa" });
      } else if (code.slice(2, 8).toLowerCase() === DESIGNATOR_PREFIX) {
        setResult({ kind: "delegated", implementation: `0x${code.slice(8, 48)}`, raw: code });
      } else {
        setResult({ kind: "contract", bytes: (code.length - 2) / 2 });
      }
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel" style={{ marginTop: 24, maxWidth: 620 }}>
      <strong>{t("계정에 코드가 붙어 있는지 확인", "Check whether an account has code")}</strong>
      <p className="sub" style={{ marginTop: 4 }}>
        {t(
          "Sepolia에서 eth_getCode를 호출할 뿐입니다 — 가스도, 서명도, 지갑도 필요 없습니다. 아무 주소나 넣어보세요.",
          "This just calls eth_getCode on Sepolia — no gas, no signature, no wallet required. Try any address."
        )}
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <input
          value={address}
          onChange={(e) => {
            touched.current = true;
            setAddress(e.target.value.trim());
          }}
          placeholder="0x…"
          spellCheck={false}
          style={{ flex: "1 1 320px", fontFamily: "ui-monospace, monospace", fontSize: 13, padding: "6px 8px" }}
        />
        <button type="button" onClick={inspect} disabled={busy}>
          {t("확인", "Inspect")}
        </button>
        <button type="button" onClick={connect} disabled={busy}>
          {t("내 지갑 주소 넣기", "Use my wallet")}
        </button>
      </div>

      {result?.kind === "eoa" && (
        <div style={{ marginTop: 16 }}>
          <strong>{t("평범한 EOA — 코드 없음", "Plain EOA — no code")}</strong>
          <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
            {t(
              "eth_getCode가 빈 값을 돌려줬습니다. 서명은 할 수 있지만 실행은 못 하는, 업그레이드되지 않은 계정입니다.",
              "eth_getCode returned empty. This account can sign but cannot execute — it has not been upgraded."
            )}
          </p>
        </div>
      )}

      {result?.kind === "delegated" && (
        <div style={{ marginTop: 16 }}>
          <strong>{t("EIP-7702로 위임된 계정 ✅", "Delegated via EIP-7702 ✅")}</strong>
          <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
            {t(
              "코드 슬롯에 23바이트짜리 위임 지정자가 들어 있습니다 — 이 주소로 오는 호출은 아래 구현체의 코드를 실행합니다.",
              "The code slot holds a 23-byte delegation designator — calls to this address run the implementation below."
            )}
          </p>
          <p className="sub" style={{ marginTop: 8, fontSize: 13, fontFamily: "ui-monospace, monospace" }}>
            <span style={{ opacity: 0.7 }}>0xef0100</span>
            {result.implementation.slice(2)}
          </p>
          <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
            {t("구현체", "Implementation")}:{" "}
            <a
              href={`https://sepolia.etherscan.io/address/${result.implementation}`}
              target="_blank"
              rel="noreferrer"
            >
              {result.implementation} ↗
            </a>
          </p>
        </div>
      )}

      {result?.kind === "contract" && (
        <div style={{ marginTop: 16 }}>
          <strong>{t("컨트랙트 계정", "Contract account")}</strong>
          <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
            {t(
              `코드가 ${result.bytes}바이트 들어 있지만 7702 지정자는 아닙니다 — 일반적으로 배포된 컨트랙트입니다.`,
              `It holds ${result.bytes} bytes of code, but not a 7702 designator — this is an ordinary deployed contract.`
            )}
          </p>
        </div>
      )}

      {error && (
        <p className="sub" style={{ marginTop: 16, color: "#dc2626" }}>
          {error}
        </p>
      )}

      <p className="sub" style={{ marginTop: 16, fontSize: 12 }}>
        {t(
          "팁: /poc/aa에서 세션 키 권한을 부여하기 전과 후에 각각 본인 주소를 확인해 보세요 — 그 사이에 일어난 변화가 EIP-7702입니다.",
          "Tip: inspect your own address before and after granting a session key on /poc/aa — the difference between the two is EIP-7702."
        )}
      </p>
    </div>
  );
}
