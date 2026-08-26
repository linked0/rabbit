"use client";

// J2 — 콘솔 프리플라이트.
//
// 이 줄이 존재하는 이유는 하나다: **가장 유력한 실패가 낡은 exchange 주소**다.
// verex 의 `reset.sh` 는 매번 새 주소로 배포하고, 캐시된 `verifyingContract` 로
// 서명하면 *틀린 메시지에 대한 완벽히 유효한 서명*이 나온다. 서버는 "signature
// invalid" 라고만 말하고 어디에도 구조체 이야기가 없다. 화면에 띄워 두면 그 추적이
// 한 번의 눈길로 끝난다.
import { useEffect, useState } from "react";
import { useLang } from "../../../LangContext";
import { pick } from "@/lib/i18n";

export type PreflightData = {
  agent: { address: string; keyIsPersistent: boolean; usdc: number | null };
  verex:
    | { reachable: true; chainId: number; exchange: string | null; usdc: string | null; ctf: string | null; tradingEnabled: boolean }
    | { reachable: false; error: string };
  delegation:
    | {
        deployed: true;
        chainId: number;
        delegationManager: string;
        erc20TransferAmountEnforcer: string;
        timestampEnforcer: string;
        matchesVerexChain: boolean | null;
      }
    | { deployed: false; hint: string };
  ownerAccount: { address: string; deployed: boolean; usdc: number | null } | null;
};

export function short(a?: string | null) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";
}

export default function Preflight({ owner, refreshKey }: { owner: string | null; refreshKey: number }) {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  const [data, setData] = useState<PreflightData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const url = `/api/agent/preflight${owner ? `?owner=${owner}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((j) => (j.error ? setErr(j.error) : (setData(j), setErr(null))))
      .catch((e) => setErr(String(e)));
  }, [owner, refreshKey]);

  if (err) return <div className="panel err">preflight: {err}</div>;
  if (!data) return <div className="panel sub">preflight…</div>;

  const v = data.verex;
  const d = data.delegation;
  // 두 체인이 다르면 상한은 다른 체인의 토큰을 지키고 거래는 여기서 일어난다 —
  // "체인이 막는다"가 거짓이 되는 유일한 조합이라 가장 큰 경고다.
  const chainMismatch = d.deployed && d.matchesVerexChain === false;

  const Cell = ({ label, value, bad }: { label: string; value: React.ReactNode; bad?: boolean }) => (
    <div style={{ minWidth: 150 }}>
      <div className="sub" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, color: bad ? "#b91c1c" : undefined }}>{value}</div>
    </div>
  );

  return (
    <div className="panel" style={{ borderColor: chainMismatch ? "#b91c1c" : undefined }}>
      <strong>{t("프리플라이트", "Preflight")}</strong>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 10 }}>
        <Cell label="verex" value={v.reachable ? `chain ${v.chainId}` : t("연결 안 됨", "unreachable")} bad={!v.reachable} />
        {/* 이 한 칸이 이 컴포넌트의 존재 이유다. */}
        <Cell label="exchange" value={v.reachable ? short(v.exchange) : "—"} bad={v.reachable && !v.exchange} />
        <Cell label="usdc" value={v.reachable ? short(v.usdc) : "—"} />
        <Cell
          label="delegation"
          value={d.deployed ? short(d.delegationManager) : t("미배포", "not deployed")}
          bad={!d.deployed}
        />
        <Cell label="agent" value={short(data.agent.address)} />
        <Cell label="agent usdc" value={data.agent.usdc === null ? "—" : data.agent.usdc.toFixed(2)} />
        {data.ownerAccount && (
          <>
            <Cell label={t("소유자 계정", "owner account")} value={short(data.ownerAccount.address)} />
            <Cell label={t("소유자 usdc", "owner usdc")} value={data.ownerAccount.usdc?.toFixed(2) ?? "—"} />
          </>
        )}
      </div>

      {chainMismatch && (
        <p className="err" style={{ marginTop: 10 }}>
          {t(
            `체인 불일치 — verex 는 ${v.reachable ? v.chainId : "?"}, 위임 프레임워크는 ${d.deployed ? d.chainId : "?"}. 이 상태에서는 상한이 다른 체인의 토큰을 지키므로 "체인이 막는다"가 거짓입니다.`,
            `Chain mismatch — verex is on ${v.reachable ? v.chainId : "?"}, the delegation framework on ${d.deployed ? d.chainId : "?"}. The cap would govern a different chain's token than the one being traded, so "the chain enforces it" would be false.`,
          )}
        </p>
      )}

      {!d.deployed && (
        <p className="sub" style={{ marginTop: 10, fontSize: 13 }}>
          {t("위임 프레임워크가 아직 없습니다 — 실행: ", "The delegation framework is not deployed yet — run: ")}
          <code>{d.hint}</code>
        </p>
      )}

      {!data.agent.keyIsPersistent && (
        <p className="sub" style={{ marginTop: 8, fontSize: 13, color: "#b45309" }}>
          {t(
            "AGENT_PRIVATE_KEY 가 설정되지 않았습니다 — 에이전트 키가 재시작과 함께 사라지고, 이미 부여된 mandate 는 존재하지 않는 주소를 가리키게 됩니다.",
            "AGENT_PRIVATE_KEY is unset — the agent key dies on restart, and any mandate already granted will point at an address that no longer exists.",
          )}
        </p>
      )}

      {d.deployed && (
        <p className="sub" style={{ marginTop: 8, fontSize: 12 }}>
          {t("상한을 강제하는 컨트랙트", "cap enforced by")} <code>{short(d.erc20TransferAmountEnforcer)}</code>
          {" · "}
          {t("만료를 강제하는 컨트랙트", "expiry enforced by")} <code>{short(d.timestampEnforcer)}</code>
        </p>
      )}
    </div>
  );
}
