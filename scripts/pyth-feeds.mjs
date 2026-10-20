#!/usr/bin/env node
// 키로 실제로 보이는 Pyth 피드를 찍는다. 심볼 표기를 추측하지 않기 위한 도구.
//   node scripts/pyth-feeds.mjs              FEEDS 의 후보를 전부 해석 시도
//   node scripts/pyth-feeds.mjs KOSPI 005930 임의 질의로 검색
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
for (const f of [".env", ".env.local"]) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const BASE = process.env.PYTH_HERMES_URL ?? "https://pyth.dourolabs.app/hermes";
const KEY = process.env.PYTH_API_KEY;
if (!KEY) {
  console.error("PYTH_API_KEY 없음 — .env 또는 .env.local 에 넣을 것");
  process.exit(1);
}

async function search(query) {
  const res = await fetch(`${BASE}/v2/price_feeds?query=${encodeURIComponent(query)}`, {
    headers: { accept: "application/json", authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    id: String(r?.id ?? ""),
    symbol: String(r?.attributes?.symbol ?? ""),
    assetType: String(r?.attributes?.asset_type ?? ""),
  }));
}

const args = process.argv.slice(2);
if (args.length) {
  for (const q of args) {
    process.stdout.write(`\n=== query "${q}" ===\n`);
    try {
      const rows = await search(q);
      if (!rows.length) console.log("  (없음)");
      for (const r of rows.slice(0, 40)) console.log(`  ${r.symbol}  [${r.assetType}]  ${r.id.slice(0, 16)}…`);
      if (rows.length > 40) console.log(`  … +${rows.length - 40}`);
    } catch (e) {
      console.log("  ERROR", String(e.message));
    }
  }
} else {
  const { FEEDS } = await import("../lib/market-feeds.ts").catch(() => ({ FEEDS: null }));
  if (!FEEDS) {
    console.error("lib/market-feeds.ts 를 직접 import 할 수 없다 (ts). 질의 인자를 주고 쓸 것.");
    process.exit(1);
  }
}
