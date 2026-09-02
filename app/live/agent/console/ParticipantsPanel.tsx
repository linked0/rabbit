"use client";

// J2 — 참여자 패널 (jay, 2026-09-02). Operator · User · Agent 의 ETH/USDC 잔고와
// 자금 버튼. 세 역할이 한 화면에 없으면 "돈이 어디 있지"가 매번 cast 조회였다.
// ETH 는 ANVIL_FIRST_PRIVATE_KEY(anvil #0, .env §17)가 실제 전송으로 보내고,
// USDC 는 verex faucet 이 발행한다.
import { useCallback, useEffect, useState } from "react";
import { useLang } from "../../../LangContext";
import { pick } from "@/lib/i18n";
import { fetchJson } from "./fetchJson";
import { Addr } from "./Preflight";

type Row = { role: string; address: string | null; eth: number | null; usdc: number | null };

export default function ParticipantsPanel({
  owner,
  refreshKey,
  onChanged,
}: {
  owner: string | null;
  refreshKey: number;
  onChanged: () => void;
}) {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // `${role}:${what}`

  const load = useCallback(() => {
    fetchJson<{ error?: string; rows: Row[] }>(`/api/agent/participants${owner ? `?owner=${owner}` : ""}`)
      .then((j) => (j.error ? setErr(j.error) : (setRows(j.rows), setErr(null))))
      .catch((e) => setErr(String(e)));
  }, [owner]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function fund(row: Row, what: "eth" | "usdc") {
    if (!row.address) return;
    setBusy(`${row.role}:${what}`);
    setErr(null);
    try {
      const r = await fetchJson<{ error?: string }>("/api/agent/fund", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to: row.address, what }),
      });
      if (r.error) setErr(r.error);
      else {
        load();
        onChanged();
      }
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(null);
    }
  }

  const roleLabel = (role: string) =>
    role === "operator" ? t("오퍼레이터", "Operator") : role === "user" ? t("사용자", "User") : t("에이전트", "Agent");

  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <strong>{t("참여자", "Participants")}</strong>
      <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
        {t(
          "누가 무엇을 들고 있나 — 오퍼레이터(verex 배포자·MM), 사용자(위임하는 소유자), 에이전트. ETH 는 anvil #0(자금 출처, .env 의 ANVIL_FIRST_PRIVATE_KEY)이 보내고, USDC 는 verex faucet 이 발행합니다.",
          "Who holds what — the operator (verex deployer & MM), the user (the owner who grants), and the agent. ETH is sent by anvil #0 (the fund source, ANVIL_FIRST_PRIVATE_KEY in .env), USDC by the verex faucet.",
        )}
      </p>
      {err && <p className="err" style={{ marginTop: 8 }}>{err}</p>}
      {!rows ? (
        <p className="sub" style={{ marginTop: 8 }}>…</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 10 }}>
          <table style={{ borderCollapse: "collapse", minWidth: 520 }}>
            <thead>
              <tr className="sub" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, textAlign: "left" }}>
                <th style={{ padding: "4px 16px 4px 0" }}>{t("역할", "role")}</th>
                <th style={{ padding: "4px 16px 4px 0" }}>{t("주소", "address")}</th>
                <th style={{ padding: "4px 16px 4px 0" }}>ETH</th>
                <th style={{ padding: "4px 16px 4px 0" }}>USDC</th>
                <th style={{ padding: "4px 0" }} />
              </tr>
            </thead>
            <tbody style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }}>
              {rows.map((r) => (
                <tr key={r.role}>
                  <td style={{ padding: "4px 16px 4px 0", fontFamily: "inherit" }}>{roleLabel(r.role)}</td>
                  <td style={{ padding: "4px 16px 4px 0" }}>
                    {r.address ? <Addr a={r.address} /> : r.role === "user" ? t("USER_PRIVATE_KEY 설정 또는 지갑 연결 필요", "set USER_PRIVATE_KEY or connect MetaMask") : "—"}
                  </td>
                  <td style={{ padding: "4px 16px 4px 0" }}>{r.eth === null ? "—" : r.eth.toFixed(4)}</td>
                  <td style={{ padding: "4px 16px 4px 0" }}>{r.usdc === null ? "—" : r.usdc.toFixed(2)}</td>
                  <td style={{ padding: "4px 0", whiteSpace: "nowrap" }}>
                    <button onClick={() => fund(r, "eth")} disabled={!r.address || busy !== null} style={{ marginRight: 6 }}>
                      {busy === `${r.role}:eth` ? "…" : "+1 ETH"}
                    </button>
                    <button onClick={() => fund(r, "usdc")} disabled={!r.address || busy !== null}>
                      {busy === `${r.role}:usdc` ? "…" : "+1000 USDC"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
