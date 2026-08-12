"use client";

import { useCallback, useEffect, useState } from "react";
import { fmtUSD, fmtPct } from "@/lib/coins";
import type { PerpContext, PerpPosition, UserState } from "@/lib/hyperliquid";

type PerpResp = {
  context: PerpContext;
  user: UserState | null;
  address: string | null;
  fetchedAt: string;
};

export default function PerpClient() {
  const [data, setData] = useState<PerpResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/perp");
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "조회 실패");
      setData(j);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // 30초마다 갱신
    return () => clearInterval(t);
  }, [load]);

  const c = data?.context;

  return (
    <main>
      <h1>⚡ Hyperliquid ETH-PERP</h1>
      <p className="sub">
        표시 전용 (Phase 1 · 키 불필요) — 30초 자동 갱신. 거래(Phase 2)는 테스트넷 우선.
      </p>

      {error && <div className="err">{error}</div>}

      {/* 시세 */}
      <section className="panel">
        <h2>ETH-PERP 시세</h2>
        <div className="kpis">
          <Kpi label="마크 가격" value={c ? fmtUSD(c.markPx) : "—"} />
          <Kpi
            label="24h 변동"
            value={c ? fmtPct(c.dayChangePct) : "—"}
            tone={c?.dayChangePct ?? null}
          />
          <Kpi
            label="펀딩 (시간당)"
            value={c?.funding != null ? `${(c.funding * 100).toFixed(4)}%` : "—"}
            tone={c?.funding ?? null}
          />
          <Kpi
            label="미결제약정 (OI)"
            value={c?.openInterest != null ? c.openInterest.toLocaleString("en-US") + " ETH" : "—"}
          />
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          {loading ? "불러오는 중…" : data ? `마지막 조회 ${new Date(data.fetchedAt).toLocaleTimeString("ko-KR")}` : ""}
        </p>
      </section>

      {/* 내 포지션 (HL_ACCOUNT_ADDRESS 설정 시) */}
      <section className="panel">
        <h2>내 ETH-PERP 포지션</h2>
        {!data?.address ? (
          <p className="muted">
            <code>HL_ACCOUNT_ADDRESS</code>(공개 지갑 주소)를 <code>.env</code>에 설정하면
            포지션이 표시됩니다. <b>서명 키는 필요 없습니다</b> (읽기 전용).
          </p>
        ) : !data.user || data.user.positions.length === 0 ? (
          <p className="muted">열린 ETH-PERP 포지션이 없습니다. (계정가치 {fmtUSD(data.user?.accountValue ?? null)})</p>
        ) : (
          <>
            <div className="kpis" style={{ marginBottom: 14 }}>
              <Kpi label="계정 가치" value={fmtUSD(data.user.accountValue)} />
            </div>
            <table>
              <thead>
                <tr>
                  <th>방향</th>
                  <th>수량</th>
                  <th>진입가</th>
                  <th>포지션 가치</th>
                  <th>미실현 손익</th>
                  <th>레버리지</th>
                </tr>
              </thead>
              <tbody>
                {data.user.positions.map((p: PerpPosition, i) => (
                  <tr key={i}>
                    <td className={p.szi >= 0 ? "pos" : "neg"}>{p.szi >= 0 ? "롱" : "숏"}</td>
                    <td>{Math.abs(p.szi)}</td>
                    <td>{fmtUSD(p.entryPx)}</td>
                    <td>{fmtUSD(p.positionValue)}</td>
                    <td className={toneClass(p.unrealizedPnl)}>{fmtUSD(p.unrealizedPnl)}</td>
                    <td>{p.leverage != null ? `${p.leverage}x` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </main>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: number | null }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className={`value ${toneClass(tone)}`}>{value}</div>
    </div>
  );
}

function toneClass(n?: number | null): string {
  if (n === undefined || n === null || n === 0) return "";
  return n > 0 ? "pos" : "neg";
}
