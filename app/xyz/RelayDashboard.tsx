"use client";

import { useCallback, useEffect, useState } from "react";
import { useLang } from "../LangContext";
import { pick } from "@/lib/i18n";

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
  const { lang } = useLang();
  const [data, setData] = useState<Resp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/relay");
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "fetch failed");
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

  const net = data?.network ?? "Ethereum Mainnet";
  const noData = pick(lang, "데이터 없음.", "No data.");

  return (
    <>
      <h1>{pick(lang, "🛰️ PBS Relay 관찰자 (C4)", "🛰️ PBS Relay Observer (C4)")}</h1>
      <p className="sub">
        {pick(
          lang,
          "공개 relay Data API 폴링 — 키 불필요, 20초 자동 갱신. 누가 블록을 만들었나(builder 점유율)·입찰가 분포·relay별 지연을 집계. 설계: ",
          "Polls public relay Data APIs — no key, auto-refresh every 20s. Aggregates who built the block (builder share), bid distribution, and per-relay latency. Design: "
        )}
        <code>docs/features/xyz-demo.md</code>
      </p>

      {/* 무엇을 관측하나 — 네트워크/데이터 출처 설명 */}
      <section className="panel">
        <h2>{pick(lang, "무엇을 보고 있나", "What you're looking at")}</h2>
        <ul className="muted" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>
            <b>{pick(lang, "네트워크:", "Network:")}</b> {net} —{" "}
            {pick(
              lang,
              "mev-boost PBS(제안자–빌더 분리) 경매가 실제로 도는 곳. 공개 Data API에 실 트래픽이 있어 테스트넷 대신 메인넷을 관측합니다.",
              "where the mev-boost PBS (proposer–builder separation) auction actually runs. The public Data API has real traffic, so we observe mainnet rather than a testnet."
            )}
          </li>
          <li>
            <b>{pick(lang, "데이터:", "Data:")}</b>{" "}
            <code>{data?.endpoint ?? "proposer_payload_delivered"}</code> —{" "}
            {pick(
              lang,
              `relay가 제안자에게 실제로 전달한(= 블록에 들어간) 페이로드. relay당 최근 ${data?.limit ?? 20}건.`,
              `payloads the relay actually delivered to a proposer (= made it into a block). Last ${data?.limit ?? 20} per relay.`
            )}
          </li>
          <li>
            <b>{pick(lang, `Relay ${data?.relays.length ?? 4}곳:`, `${data?.relays.length ?? 4} relays:`)}</b>{" "}
            {(data?.relays ?? []).map((r) => r.name).join(" · ") ||
              "Flashbots · bloXroute · Agnostic · Ultra Sound"}{" "}
            {pick(
              lang,
              "— 브라우저 CORS를 피하려 서버(",
              "— the server ("
            )}
            <code>/api/relay</code>
            {pick(lang, ")가 병렬로 프록시하며 지연을 측정합니다.", ") proxies them in parallel and measures latency, avoiding browser CORS.")}
          </li>
          <li>
            <b>{pick(lang, "참고:", "Note:")}</b>{" "}
            {pick(lang, "표시 전용 · 키/지갑 불필요. 오픈소스 ", "Display-only · no key/wallet. The open-source ")}
            <code>flashbots/relayscan</code>
            {pick(lang, "이 같은 데이터를 다룹니다.", " works with the same data.")}
          </li>
        </ul>
      </section>

      {error && <div className="err">{error}</div>}

      <section className="panel">
        <div className="kpis">
          <Kpi label={pick(lang, "관측 블록(고유)", "Blocks (unique)")} value={String(totalBlocks)} />
          <Kpi label={pick(lang, "빌더 수", "Builders")} value={String(builderCount.size)} />
          <Kpi label={pick(lang, "입찰가 중앙값", "Median bid")} value={stat ? `${stat.median.toFixed(4)} ETH` : "—"} />
          <Kpi label={pick(lang, "응답 relay", "Relays up")} value={`${relays.filter((r) => r.ok).length}/${relays.length}`} />
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          {loading
            ? pick(lang, "불러오는 중…", "Loading…")
            : data
              ? pick(
                  lang,
                  `마지막 조회 ${new Date(data.fetchedAt).toLocaleTimeString("ko-KR")}`,
                  `Last fetch ${new Date(data.fetchedAt).toLocaleTimeString("en-US")}`
                )
              : ""}
        </p>
      </section>

      <section className="panel">
        <h2>{pick(lang, `Builder 시장점유율 (최근 ${totalBlocks} 블록)`, `Builder market share (last ${totalBlocks} blocks)`)}</h2>
        <p className="muted" style={{ marginTop: -4 }}>
          {pick(lang, "delivered 블록을 ", "Delivered blocks grouped by ")}
          <code>builder_pubkey</code>
          {pick(lang, "로 묶어 센 것 — 어느 빌더가 블록을 많이 이겼나.", " — which builder won the most blocks.")}
        </p>
        {builderShare.length === 0 ? (
          <p className="muted">{noData}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Builder</th>
                <th>{pick(lang, "블록", "Blocks")}</th>
                <th>{pick(lang, "점유율", "Share")}</th>
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
        <h2>{pick(lang, "입찰가(value) 분포", "Bid value distribution")}</h2>
        <p className="muted" style={{ marginTop: -4 }}>
          {pick(
            lang,
            "제안자에게 지급된 페이로드 가치(ETH) — PBS 경매에서 블록이 얼마에 팔렸나.",
            "payload value paid to the proposer (ETH) — what the block sold for in the PBS auction."
          )}
        </p>
        <div className="kpis">
          <Kpi label={pick(lang, "최소", "Min")} value={stat ? `${stat.min.toFixed(4)} ETH` : "—"} />
          <Kpi label={pick(lang, "중앙값", "Median")} value={stat ? `${stat.median.toFixed(4)} ETH` : "—"} />
          <Kpi label={pick(lang, "평균", "Avg")} value={stat ? `${stat.avg.toFixed(4)} ETH` : "—"} />
          <Kpi label={pick(lang, "최대", "Max")} value={stat ? `${stat.max.toFixed(4)} ETH` : "—"} />
        </div>
      </section>

      <section className="panel">
        <h2>{pick(lang, "Relay별 지연 · 상태", "Relay latency · status")}</h2>
        <p className="muted" style={{ marginTop: -4 }}>
          {pick(
            lang,
            `${net} relay별 응답 시간(서버→relay) — 어느 relay가 빠른가.`,
            `${net} response time per relay (server→relay) — which relay is fastest.`
          )}
        </p>
        <table>
          <thead>
            <tr>
              <th>Relay</th>
              <th>{pick(lang, "호스트", "Host")}</th>
              <th>{pick(lang, "상태", "Status")}</th>
              <th>{pick(lang, "지연", "Latency")}</th>
              <th>{pick(lang, "블록", "Blocks")}</th>
            </tr>
          </thead>
          <tbody>
            {relays.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td className="muted">
                  <code>{r.host}</code>
                </td>
                <td className={r.ok ? "pos" : "neg"}>{r.ok ? "OK" : (r.error ?? pick(lang, "실패", "failed"))}</td>
                <td>{r.latencyMs} ms</td>
                <td>{r.entries.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>{pick(lang, "최근 delivered 블록", "Recent delivered blocks")}</h2>
        <p className="muted" style={{ marginTop: -4 }}>
          {pick(
            lang,
            `${net}에서 최근 블록에 실제로 포함된 페이로드 (슬롯 내림차순).`,
            `Payloads actually included in recent blocks on ${net} (slot descending).`
          )}
        </p>
        {recent.length === 0 ? (
          <p className="muted">{noData}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{pick(lang, "슬롯", "Slot")}</th>
                <th>{pick(lang, "블록", "Block")}</th>
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
