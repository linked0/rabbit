"use client";

// 정산 큐 목업 — 논의용 (jay 요청, 2026-08-11). 설계: docs/tasks/current-plan.md.
//
// 아직 구현이 아니다. Relayer도 Monitor도 붙어 있지 않고, 아래 숫자는 전부 각본이다.
// 보여주려는 건 성능 자랑이 아니라 한 가지 사실이다: verex의 워커가 직렬인 이유는
// 논스 때문인데(worker.ts 헤더가 그렇게 말한다), 그 대가로 처리량이 "블록당 1건"에
// 묶인다. Relayer는 논스를 제대로 관리해서 그 묶임을 푼다 — 그리고 푸는 순간
// 직렬 레인이 덤으로 지켜주던 순서 보장까지 함께 사라진다. 그게 내일 사고 실험의 주제다.

import { useState } from "react";
import { useLang } from "../../LangContext";
import { pick } from "@/lib/i18n";

/// 한 틱 = 체인 블록 하나. Sepolia 기준 ~12초로 읽으면 된다.
const BLOCK_S = 12;
/// Relayer가 동시에 띄우는 트랜잭션 수 — 설정값이지, 공짜로 나오는 마법이 아니다.
const IN_FLIGHT = 3;

type Job = {
  id: string;
  type: "SETTLE_MATCH" | "RESOLVE" | "REDEEM";
  label: string;
  labelKo: string;
  /// 한 번 실패하고 재시도되는 잡 — 두 레인 모두에서 onFailed 경로가 살아 있음을 보여준다.
  failsOnce?: boolean;
};

const JOBS: Job[] = [
  { id: "j1", type: "SETTLE_MATCH", label: "match — BTC 100k? · 240 jUSD", labelKo: "체결 — BTC 10만? · 240 jUSD" },
  { id: "j2", type: "SETTLE_MATCH", label: "match — Fed cut? · 55 jUSD", labelKo: "체결 — 연준 인하? · 55 jUSD" },
  {
    id: "j3",
    type: "SETTLE_MATCH",
    label: "match — World Cup · 1,200 jUSD",
    labelKo: "체결 — 월드컵 · 1,200 jUSD",
    failsOnce: true,
  },
  { id: "j4", type: "SETTLE_MATCH", label: "match — ETH ETF? · 18 jUSD", labelKo: "체결 — ETH ETF? · 18 jUSD" },
  { id: "j5", type: "RESOLVE", label: "resolve — Fed cut? → No", labelKo: "확정 — 연준 인하? → 아니오" },
  { id: "j6", type: "REDEEM", label: "redeem — 0x9f3d, 55 jUSD", labelKo: "상환 — 0x9f3d, 55 jUSD" },
];

/// 각 잡이 "몇 번째 블록에 확정되는가". 두 레인의 차이는 오직 동시성이다 —
/// 체인 지연도, 가스도, 재시도 횟수도 같게 두고 계산한다. 그래야 비교가 정직하다.
function schedule(mode: "serial" | "relayer"): Map<string, number> {
  const out = new Map<string, number>();
  const lanes = mode === "serial" ? 1 : IN_FLIGHT;
  // 각 레인이 언제 비는지. 실패 잡은 블록 하나를 더 먹는다(재제출).
  const freeAt = new Array<number>(lanes).fill(1);
  for (const job of JOBS) {
    let lane = 0;
    for (let i = 1; i < lanes; i++) if (freeAt[i]! < freeAt[lane]!) lane = i;
    const cost = job.failsOnce ? 2 : 1;
    out.set(job.id, freeAt[lane]! + cost - 1);
    freeAt[lane] = freeAt[lane]! + cost;
  }
  return out;
}

const SERIAL = schedule("serial");
const RELAYER = schedule("relayer");
const LAST_BLOCK = Math.max(...SERIAL.values());

function Lane({
  title,
  sub,
  done,
  block,
  finishedAt,
}: {
  title: string;
  sub: string;
  done: Map<string, number>;
  block: number;
  finishedAt: number;
}) {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  const complete = block >= finishedAt;
  const confirmed = [...done.values()].filter((b) => b <= block).length;
  return (
    <div className="kpi" style={{ alignItems: "stretch" }}>
      <div className="label">{title}</div>
      <div className="value" style={{ fontSize: 15 }}>
        {complete ? (
          <span className="pos">
            {t(`${finishedAt}블록 (~${finishedAt * BLOCK_S}초)에 완료`, `done at block ${finishedAt} (~${finishedAt * BLOCK_S}s)`)}
          </span>
        ) : (
          <span className="muted">
            {t(`${confirmed}/${JOBS.length} 확정`, `${confirmed}/${JOBS.length} confirmed`)}
          </span>
        )}
      </div>
      <p className="sub" style={{ marginTop: 2, fontSize: 12.5 }}>
        {sub}
      </p>
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
        {JOBS.map((j) => {
          const at = done.get(j.id)!;
          const state = block >= at ? "done" : "waiting";
          return (
            <div
              key={j.id}
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 8,
                fontSize: 12.5,
                opacity: state === "done" ? 1 : 0.45,
              }}
            >
              <span style={{ fontFamily: "ui-monospace, monospace" }}>
                {state === "done" ? "✓" : "·"} {pick(lang, j.labelKo, j.label)}
                {j.failsOnce && <span className="neg"> {t("(1회 실패)", "(fails once)")}</span>}
              </span>
              <span className="muted" style={{ fontFamily: "ui-monospace, monospace", whiteSpace: "nowrap" }}>
                {t(`블록 ${at}`, `block ${at}`)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SettlementQueueMock() {
  const { lang } = useLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  const [block, setBlock] = useState(1);
  const done = block >= LAST_BLOCK;

  const serialFinish = Math.max(...SERIAL.values());
  const relayerFinish = Math.max(...RELAYER.values());

  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <strong>{t("정산 큐 — 같은 6건, 레인만 다르게", "The settlement queue — same six jobs, different lanes")}</strong>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setBlock((n) => n + 1)} disabled={done}>
            {done ? t("각본 끝", "End of script") : t("▶ 다음 블록", "▶ Next block")}
          </button>
          <button type="button" onClick={() => setBlock(1)}>
            {t("↺ 처음부터", "↺ Reset")}
          </button>
        </div>
      </div>
      <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
        {t(
          `한 틱 = 블록 하나(Sepolia ~${BLOCK_S}초). 체인 지연·가스·재시도 횟수는 양쪽을 같게 두었다 — 다른 건 동시에 띄우는 트랜잭션 수뿐이다. 3번 잡은 일부러 한 번 실패한다.`,
          `One tick = one block (~${BLOCK_S}s on Sepolia). Chain latency, gas, and retry count are identical on both sides — the only difference is how many transactions are in flight. Job 3 fails once on purpose.`
        )}
      </p>
      <div className="kpis" style={{ marginTop: 12 }}>
        <Lane
          title={t("오늘 — 단일 직렬 레인", "Today — one serial lane")}
          sub={t(
            "worker.ts가 그렇게 말한다: 레인이 하나라 논스 경합이 없다. 처리량은 블록당 1건에 묶인다.",
            "worker.ts says it outright: one lane, so no nonce races. Throughput is pinned at one job per block."
          )}
          done={SERIAL}
          block={block}
          finishedAt={serialFinish}
        />
        <Lane
          title={t(`Relayer — 동시 ${IN_FLIGHT}건`, `With a Relayer — ${IN_FLIGHT} in flight`)}
          sub={t(
            "논스를 릴레이어가 관리하므로 레인을 넓힐 수 있다. 공짜는 아니다 — 아래를 보라.",
            "The relayer owns the nonce, so the lane can widen. Not free — see below."
          )}
          done={RELAYER}
          block={block}
          finishedAt={relayerFinish}
        />
      </div>
      <div style={{ marginTop: 12, fontSize: 13 }}>
        <span className="label">{t("현재 블록", "Current block")}</span>{" "}
        <span style={{ fontFamily: "ui-monospace, monospace" }}>
          {block} / {LAST_BLOCK}
        </span>
      </div>
      {done && (
        <p className="sub" style={{ marginTop: 12, fontSize: 13 }}>
          {t(
            `${serialFinish}블록 대 ${relayerFinish}블록. 그런데 이 화면이 말하지 않는 게 있다 — 직렬 레인은 논스만 직렬화한 게 아니라 정산 순서까지 직렬화하고 있었다. 레인을 넓히는 순간 그 보장이 사라지고, 그게 진짜 질문이다.`,
            `Block ${serialFinish} against block ${relayerFinish}. But there is something this screen does not show — the serial lane was not only serializing nonces, it was serializing settlement order. Widening it removes that guarantee, and that is the real question.`
          )}
        </p>
      )}
    </div>
  );
}
