"use client";

import { useCallback, useEffect, useState } from "react";

// C4 관찰자 대시보드 — /api/relay 폴링 → builder 점유율·입찰가 분포·relay 지연 집계.
type Entry = {
  slot: string;
  blockNumber: string;
  blockHash: string;
  builder: string;
  valueWei: string;
  numTx: string;
};
type RelayResult = {
  name: string;
  url: string;
  host: string;
  ok: boolean;
  latencyMs: number;
  error: string | null;
  entries: Entry[];
};
type Resp = {
  network: string;
  endpoint: string;
  limit: number;
  relays: RelayResult[];
  fetchedAt: string;
};

const REFRESH_MS = 20000;

export default function RelayDashboard() {
  const [data, setData] = useState<Resp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/relay");
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
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const relays = data?.relays ?? [];

  // block_hash 기준 중복 제거 — 같은 블록이 여러 relay로 delivered될 수 있음.
  const byHash = new Map<string, { entry: Entry; relays: string[] }>();
  for (const r of relays) {
    if (!r.ok) continue;
    for (const e of r.entries) {
      const cur = byHash.get(e.blockHash);
      if (cur) cur.relays.push(r.name);
      else byHash.set(e.blockHash, { entry: e, relays: [r.name] });
    }
  }
  const unique = [...byHash.values()];
  const totalBlocks = unique.length;

  // builder 시장점유율
  const builderCount = new Map<string, number>();
  for (const u of unique)
    builderCount.set(u.entry.builder, (builderCount.get(u.entry.builder) ?? 0) + 1);
  const builderShare = [...builderCount.entries()]
    .map(([builder, count]) => ({ builder, count, pct: totalBlocks ? (count / totalBlocks) * 100 : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // 입찰가(value) 분포 — ETH
  const values = unique
    .map((u) => Number(u.entry.valueWei) / 1e18)
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b);
  const stat = values.length
    ? {
        min: values[0],
        median: values[Math.floor(values.length / 2)],
        max: values[values.length - 1],
        avg: values.reduce((s, v) => s + v, 0) / values.length,
      }
    : null;

  // 최근 delivered 블록 (슬롯 내림차순)
  const recent = [...unique]
    .sort((a, b) => Number(b.entry.slot) - Number(a.entry.slot))
    .slice(0, 15);

  return (
    <>
      <h1>🛰️ PBS Relay 관찰자 (C4)</h1>
      <p className="sub">
        공개 relay Data API 폴링 — 키 불필요, 20초 자동 갱신. 누가 블록을 만들었나(builder 점유율)·입찰가
        분포·relay별 지연을 집계. 설계: <code>docs/features/xyz-demo.md</code>
      </p>

      {/* 무엇을 관측하나 — 네트워크/데이터 출처 설명 */}
      <section className="panel">
        <h2>무엇을 보고 있나</h2>
        <ul className="muted" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>
            <b>네트워크:</b> {data?.network ?? "Ethereum Mainnet"} — mev-boost <b>PBS</b>(제안자–빌더 분리)
            경매가 실제로 도는 곳. 공개 Data API에 실 트래픽이 있어 테스트넷 대신 메인넷을 관측합니다.
          </li>
          <li>
            <b>데이터:</b> 각 relay의 <code>{data?.endpoint ?? "proposer_payload_delivered"}</code> —
            relay가 제안자에게 실제로 전달한(= 블록에 들어간) 페이로드. relay당 최근{" "}
            {data?.limit ?? 20}건.
          </li>
          <li>
            <b>Relay {data?.relays.length ?? 4}곳:</b>{" "}
            {(data?.relays ?? []).map((r) => r.name).join(" · ") ||
              "Flashbots · bloXroute · Agnostic · Ultra Sound"}{" "}
            — 브라우저 CORS를 피하려 서버(<code>/api/relay</code>)가 병렬로 프록시하며 지연을 측정합니다.
          </li>
          <li>
            <b>참고:</b> 표시 전용 · 키/지갑 불필요. 오픈소스{" "}
            <code>flashbots/relayscan</code>이 같은 데이터를 다룹니다.
          </li>
        </ul>
      </section>

      {error && <div className="err">{error}</div>}

      <section className="panel">
        <div className="kpis">
          <Kpi label="관측 블록(고유)" value={String(totalBlocks)} />
          <Kpi label="빌더 수" value={String(builderCount.size)} />
          <Kpi label="입찰가 중앙값" value={stat ? `${stat.median.toFixed(4)} ETH` : "—"} />
          <Kpi label="응답 relay" value={`${relays.filter((r) => r.ok).length}/${relays.length}`} />
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          {loading
            ? "불러오는 중…"
            : data
              ? `마지막 조회 ${new Date(data.fetchedAt).toLocaleTimeString("ko-KR")}`
              : ""}
        </p>
      </section>

      <section className="panel">
        <h2>Builder 시장점유율 (최근 {totalBlocks} 블록)</h2>
        <p className="muted" style={{ marginTop: -4 }}>
          delivered 블록을 <code>builder_pubkey</code>로 묶어 센 것 — 어느 빌더가 블록을 많이 이겼나.
        </p>
        {builderShare.length === 0 ? (
          <p className="muted">데이터 없음.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Builder</th>
                <th>블록</th>
                <th>점유율</th>
              </tr>
            </thead>
            <tbody>
              {builderShare.map((b) => (
                <tr key={b.builder}>
                  <td>
                    <code>{shortKey(b.builder)}</code>
                  </td>
                  <td>{b.count}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          background: "var(--pos, #38b26b)",
                          height: 8,
                          width: `${b.pct}%`,
                          minWidth: 2,
                          borderRadius: 4,
                        }}
                      />
                      <span className="muted">{b.pct.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h2>입찰가(value) 분포</h2>
        <p className="muted" style={{ marginTop: -4 }}>
          제안자에게 지급된 페이로드 가치(ETH) — PBS 경매에서 블록이 얼마에 팔렸나.
        </p>
        <div className="kpis">
          <Kpi label="최소" value={stat ? `${stat.min.toFixed(4)} ETH` : "—"} />
          <Kpi label="중앙값" value={stat ? `${stat.median.toFixed(4)} ETH` : "—"} />
          <Kpi label="평균" value={stat ? `${stat.avg.toFixed(4)} ETH` : "—"} />
          <Kpi label="최대" value={stat ? `${stat.max.toFixed(4)} ETH` : "—"} />
        </div>
      </section>

      <section className="panel">
        <h2>Relay별 지연 · 상태</h2>
        <p className="muted" style={{ marginTop: -4 }}>
          {data?.network ?? "Ethereum Mainnet"} relay별 응답 시간(서버→relay) — 어느 relay가 빠른가.
        </p>
        <table>
          <thead>
            <tr>
              <th>Relay</th>
              <th>호스트</th>
              <th>상태</th>
              <th>지연</th>
              <th>블록</th>
            </tr>
          </thead>
          <tbody>
            {relays.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td className="muted">
                  <code>{r.host}</code>
                </td>
                <td className={r.ok ? "pos" : "neg"}>{r.ok ? "OK" : (r.error ?? "실패")}</td>
                <td>{r.latencyMs} ms</td>
                <td>{r.entries.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>최근 delivered 블록</h2>
        <p className="muted" style={{ marginTop: -4 }}>
          {data?.network ?? "Ethereum Mainnet"}에서 최근 블록에 실제로 포함된 페이로드 (슬롯 내림차순).
        </p>
        {recent.length === 0 ? (
          <p className="muted">데이터 없음.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>슬롯</th>
                <th>블록</th>
                <th>Builder</th>
                <th>Value</th>
                <th>Tx</th>
                <th>Relay</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((u) => (
                <tr key={u.entry.blockHash}>
                  <td>{u.entry.slot}</td>
                  <td>{u.entry.blockNumber}</td>
                  <td>
                    <code>{shortKey(u.entry.builder)}</code>
                  </td>
                  <td>{(Number(u.entry.valueWei) / 1e18).toFixed(4)} ETH</td>
                  <td>{u.entry.numTx}</td>
                  <td className="muted">{u.relays.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

function shortKey(k: string): string {
  return k && k.length > 14 ? `${k.slice(0, 8)}…${k.slice(-6)}` : k;
}
