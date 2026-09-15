"use client";

// J2 — 콘솔 프리플라이트.
//
// 이 줄이 존재하는 이유는 하나다: **가장 유력한 실패가 낡은 exchange 주소**다.
// verex 의 `reset.sh` 는 매번 새 주소로 배포하고, 캐시된 `verifyingContract` 로
// 서명하면 *틀린 메시지에 대한 완벽히 유효한 서명*이 나온다. 서버는 "signature
// invalid" 라고만 말하고 어디에도 구조체 이야기가 없다. 화면에 띄워 두면 그 추적이
// 한 번의 눈길로 끝난다.
import { useCallback, useEffect, useState } from "react";
import { useLang } from "../../../LangContext";
import { pick } from "@/lib/i18n";
import { fetchJson } from "./fetchJson";

export type PreflightData = {
  // 배포 사이트(로컬 전용 콘솔을 prod 에서 연 경우) 서버가 이 플래그로 답한다.
  localOnly?: boolean;
  agent: { address: string | null; keyIsPersistent: boolean; jusd: number | null; allowanceJusd: number | null; ctfApproved: boolean | null };
  verex:
    | { reachable: true; chainId: number; exchange: string | null; jusd: string | null; ctf: string | null; tradingEnabled: boolean }
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
  ownerAccount: { address: string; deployed: boolean; jusd: number | null } | null;
};

export function short(a?: string | null) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";
}

/// 주소 복사. reset.sh 마다 exchange/jUSD 주소가 바뀌어 cast·approve 명령에 붙여넣을
/// 일이 잦다 — 화면의 축약본을 눈으로 옮겨 적게 하면 이 패널의 목적(낡은 주소 잡기)과
/// 정반대의 실수를 만든다. 클릭 한 번이 전체 주소를 복사하고, 잠깐 ✓ 로 답한다.
export function Addr({ a }: { a?: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!a) return <>—</>;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(a);
    } catch {
      // http(비보안 컨텍스트)에서는 clipboard API 가 없다 — 구식 경로로 떨어진다.
      const ta = document.createElement("textarea");
      ta.value = a;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button
      onClick={copy}
      title={`${a} — click to copy`}
      style={{ all: "unset", cursor: "pointer", font: "inherit", color: "inherit" }}
    >
      {short(a)}
      {copied ? " ✓" : ""}
    </button>
  );
}

export default function Preflight({ owner, refreshKey }: { owner: string | null; refreshKey: number }) {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  const [data, setData] = useState<PreflightData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  // 패널 전체를 갈아치우는 err 와 분리한다 (jay, 2026-09-02): 승인 실패의 처방
  // (가스 넣기)이 바로 아래 참여자 패널에 있는데, 실패가 패널을 지우면 버튼도
  // 함께 사라져 되돌아올 길이 없다. 행동의 실패는 행동 옆에 적는다.
  const [approveErr, setApproveErr] = useState<string | null>(null);

  const load = useCallback(() => {
    const url = `/api/agent/preflight${owner ? `?owner=${owner}` : ""}`;
    fetchJson<PreflightData & { error?: string }>(url)
      .then((j) => (j.error ? setErr(j.error) : (setData(j), setErr(null))))
      .catch((e) => setErr(String(e)));
  }, [owner]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  /// scripts/agent-approve.mjs 의 두 승인을 서버가 보낸다 — 키는 서버에 있다(D2).
  async function approve() {
    setApproving(true);
    setApproveErr(null);
    try {
      const r = await fetchJson<{ error?: string }>("/api/agent/approve", { method: "POST" });
      if (r.error) setApproveErr(r.error);
      else load();
    } catch (e) {
      setApproveErr(String(e instanceof Error ? e.message : e));
    } finally {
      setApproving(false);
    }
  }

  if (err) return <div className="panel err">preflight: {err}</div>;
  if (!data) return <div className="panel sub">preflight…</div>;
  // 로컬 전용: 배포 사이트에서는 에이전트 키·anvil·verex 가 없어 아무 패널도 의미가
  // 없다. 날 500 대신 왜 그런지 한 줄로 설명한다 (jay, 2026-09-04).
  if (data.localOnly)
    return (
      <div className="panel">
        <strong>{t("프리플라이트", "Preflight")}</strong>
        <p className="sub" style={{ marginTop: 8, fontSize: 13 }}>
          {t(
            "이 콘솔은 로컬 전용입니다 — 배포된 사이트에는 에이전트 키도, anvil 도, verex API 도 없어 프리플라이트가 확인할 대상이 없습니다. 로컬에서 실행하세요: anvil + verex API + node scripts/deploy-delegation.mjs. 화면 구성만 보려면 위의 목업 페이지를 쓰세요.",
            "This console is local-only — the deployed site has no agent key, no anvil, and no verex API, so preflight has nothing to check. Run it locally: anvil + the verex API + node scripts/deploy-delegation.mjs. To just see the layout, use the mock page above.",
          )}
        </p>
      </div>
    );

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
        <Cell label="exchange" value={v.reachable ? <Addr a={v.exchange} /> : "—"} bad={v.reachable && !v.exchange} />
        <Cell label="jusd" value={v.reachable ? <Addr a={v.jusd} /> : "—"} />
        <Cell
          label="delegation"
          value={d.deployed ? <Addr a={d.delegationManager} /> : t("미배포", "not deployed")}
          bad={!d.deployed}
        />
        <Cell label="agent" value={<Addr a={data.agent.address} />} />
        <Cell label="agent jusd" value={data.agent.jusd === null ? "—" : data.agent.jusd.toFixed(2)} />
        {/* BUY 는 allowance, SELL 은 CTF operator — 서로 다른 표준의 서로 다른 승인이라
            하나가 다른 하나를 대신하지 못한다. 없는 쪽이 있으면 아래 버튼이 나타난다. */}
        <Cell
          label={t("승인", "approvals")}
          value={
            data.agent.allowanceJusd === null
              ? "—"
              : `jUSD ${data.agent.allowanceJusd.toFixed(0)} · CTF ${data.agent.ctfApproved ? "✓" : "✗"}`
          }
          bad={data.agent.allowanceJusd !== null && (data.agent.allowanceJusd <= 0 || data.agent.ctfApproved === false)}
        />
        {data.ownerAccount && (
          <>
            <Cell label={t("소유자 계정", "owner account")} value={<Addr a={data.ownerAccount.address} />} />
            <Cell label={t("소유자 jusd", "owner jusd")} value={data.ownerAccount.jusd?.toFixed(2) ?? "—"} />
          </>
        )}
      </div>

      {data.agent.allowanceJusd !== null && (data.agent.allowanceJusd <= 0 || data.agent.ctfApproved === false) && (
        <p className="sub" style={{ marginTop: 10, fontSize: 13 }}>
          <button onClick={approve} disabled={approving}>
            {approving ? "…" : t("거래소 승인", "Approve exchange")}
          </button>{" "}
          {t(
            "에이전트가 직접 내는 유일한 온체인 tx — jUSD approve(BUY)와 CTF operator(SELL). 없으면 모든 주문이 400 으로 거절됩니다.",
            "The one on-chain tx the agent pays for itself — jUSD approve (BUY) and CTF operator (SELL). Without them every order is refused with a 400.",
          )}
          {approveErr && (
            <span className="err" style={{ display: "block", marginTop: 6 }}>
              {approveErr}
            </span>
          )}
        </p>
      )}

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
          {t("상한을 강제하는 컨트랙트", "cap enforced by")} <code><Addr a={d.erc20TransferAmountEnforcer} /></code>
          {" · "}
          {t("만료를 강제하는 컨트랙트", "expiry enforced by")} <code><Addr a={d.timestampEnforcer} /></code>
        </p>
      )}
    </div>
  );
}
