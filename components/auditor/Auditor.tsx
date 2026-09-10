"use client";

// Interactive auditor — Phase 2 config intake (tiers 1–2).
// Three ways in, all client-side over the pure evaluate() engine:
//   - Preset:  pick a dogfood/vendor-default config.
//   - Guided form (tier 1): edit the canonical config fields directly.
//   - Exported JSON (tier 2): pick a provider, paste its non-secret export;
//     the provider parser maps it onto the canonical config.
// No keys, no secrets, no network — evaluate() is pure and runs in the browser.

import { useMemo, useState } from "react";
import { MatrixTable } from "@/components/auditor/MatrixTable";
import { evaluate, findings } from "@/lib/auditor/evaluate";
import { jayverseConfig, presets } from "@/lib/auditor/sample-config";
import { PROVIDERS, getProvider, parseExport } from "@/lib/auditor/providers";
import {
  ACTION_LABELS,
  ACTOR_LABELS,
  type AdminModel,
  type AuditorConfig,
  type ContractConfig,
  type CustodyModel,
  type OwnerModel,
  type PauserModel,
  type RecoveryModel,
  type Verified,
} from "@/lib/auditor/types";

type Mode = "preset" | "form" | "json";

const CUSTODY: CustodyModel[] = ["provider-custodial", "shared-shards", "mpc-tss", "self-custodial"];
const RECOVERY: RecoveryModel[] = ["custodial", "guardian", "social", "none"];
const OWNER: OwnerModel[] = ["eoa", "multisig", "timelock", "none"];
const ADMIN: AdminModel[] = ["owner", "timelock", "none"];
const PAUSER: PauserModel[] = ["owner", "role", "none"];

const DEFAULT_CONTRACT: ContractConfig = {
  ownerModel: "multisig",
  upgradeable: true,
  proxyAdmin: "timelock",
  pauser: "role",
};

const labelStyle: React.CSSProperties = { display: "block", fontSize: ".8rem", marginBottom: 4 };
const fieldStyle: React.CSSProperties = { marginBottom: 12 };
const panel: React.CSSProperties = {
  background: "var(--panel)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "1rem",
  marginBottom: 16,
};

export function Auditor() {
  const [mode, setMode] = useState<Mode>("preset");
  const [config, setConfig] = useState<AuditorConfig>(jayverseConfig);
  const [providerId, setProviderId] = useState(PROVIDERS[0].id);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const matrix = useMemo(() => evaluate(config), [config]);
  const topFindings = useMemo(() => findings(matrix), [matrix]);

  const counts = matrix.cells.reduce(
    (acc, c) => {
      acc[c.verified] = (acc[c.verified] ?? 0) + 1;
      return acc;
    },
    {} as Record<Verified, number>,
  );

  // ---- config editing helpers (guided form) ----
  const setWallet = (patch: Partial<AuditorConfig["embeddedWallet"]>) =>
    setConfig((c) => ({ ...c, embeddedWallet: { ...c.embeddedWallet, ...patch } }));
  const setContract = (patch: Partial<ContractConfig>) =>
    setConfig((c) => ({ ...c, contract: { ...(c.contract ?? DEFAULT_CONTRACT), ...patch } }));
  const toggleContract = (on: boolean) =>
    setConfig((c) => ({ ...c, contract: on ? (c.contract ?? DEFAULT_CONTRACT) : undefined }));
  const setSession = (patch: Partial<NonNullable<AuditorConfig["sessionKeys"]>>) =>
    setConfig((c) => ({
      ...c,
      sessionKeys: { enabled: false, usableBy: ["backend-owner"], revocableBy: ["user"], ...c.sessionKeys, ...patch },
    }));

  function runImport() {
    setJsonError(null);
    setWarnings([]);
    const adapter = getProvider(providerId);
    if (!adapter) return;
    let raw: unknown;
    try {
      raw = JSON.parse(jsonText);
    } catch {
      setJsonError("Not valid JSON — paste the provider's exported config object.");
      return;
    }
    try {
      const { config: wallet, warnings: w } = parseExport(adapter, raw);
      setConfig({ name: `${adapter.label} (imported)`, embeddedWallet: wallet });
      setWarnings(w);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Could not parse the exported config.");
    }
  }

  const w = config.embeddedWallet;
  const c = config.contract;

  return (
    <>
      <div style={panel}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {(["preset", "form", "json"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: mode === m ? "var(--accent, #2563eb)" : "transparent",
                color: mode === m ? "#fff" : "inherit",
                cursor: "pointer",
              }}
            >
              {m === "preset" ? "Preset" : m === "form" ? "Guided form" : "Exported JSON"}
            </button>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 0 }}>
          Read-only. We never ask for keys, seed phrases, or signatures.
        </p>

        {mode === "preset" && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Preset config</label>
            <select
              value={config.name}
              onChange={(e) => {
                const p = presets.find((x) => x.name === e.target.value);
                if (p) {
                  setConfig(p);
                  setWarnings([]);
                }
              }}
              style={{ padding: "6px 8px", minWidth: 320 }}
            >
              {presets.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
            {/* jay (2026-09-10): the matrix is computed from this object and nothing
                else, so showing it beside the picker is what makes the tool's input
                inspectable — the reader sees the real values, not a label. */}
            <details style={{ marginTop: 10 }} open>
              <summary className="small" style={{ cursor: "pointer", opacity: 0.8 }}>
                The config this preset feeds to the rules engine (the matrix is computed
                from these values only)
              </summary>
              <pre
                className="small"
                style={{
                  marginTop: 8,
                  padding: "10px 12px",
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  overflowX: "auto",
                }}
              >
                {JSON.stringify(config, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {mode === "form" && (
          <div>
            <h3 style={{ margin: "8px 0" }}>Embedded wallet</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Provider</label>
                <input value={w.provider} onChange={(e) => setWallet({ provider: e.target.value })} style={{ padding: "6px 8px", width: "100%" }} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Custody model</label>
                <select value={w.custodyModel} onChange={(e) => setWallet({ custodyModel: e.target.value as CustodyModel })} style={{ padding: "6px 8px", width: "100%" }}>
                  {CUSTODY.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Recovery</label>
                <select value={w.recovery} onChange={(e) => setWallet({ recovery: e.target.value as RecoveryModel })} style={{ padding: "6px 8px", width: "100%" }}>
                  {RECOVERY.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
              <label style={{ ...fieldStyle, alignSelf: "end" }}>
                <input type="checkbox" checked={w.keyExportByProvider} onChange={(e) => setWallet({ keyExportByProvider: e.target.checked })} /> Provider can export keys alone
              </label>
              <label style={{ ...fieldStyle, alignSelf: "end" }}>
                <input type="checkbox" checked={w.keyExportByUser} onChange={(e) => setWallet({ keyExportByUser: e.target.checked })} /> User can export their own key
              </label>
            </div>

            <h3 style={{ margin: "8px 0" }}>
              <label style={{ fontWeight: 600 }}>
                <input type="checkbox" checked={!!c} onChange={(e) => toggleContract(e.target.checked)} /> Smart-contract / account config
              </label>
            </h3>
            {c && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Owner model</label>
                  <select value={c.ownerModel} onChange={(e) => setContract({ ownerModel: e.target.value as OwnerModel })} style={{ padding: "6px 8px", width: "100%" }}>
                    {OWNER.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Multisig threshold (optional)</label>
                  <input value={c.multisigThreshold ?? ""} onChange={(e) => setContract({ multisigThreshold: e.target.value || undefined })} placeholder="e.g. 2-of-3" style={{ padding: "6px 8px", width: "100%" }} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Proxy admin</label>
                  <select value={c.proxyAdmin} onChange={(e) => setContract({ proxyAdmin: e.target.value as AdminModel })} style={{ padding: "6px 8px", width: "100%" }}>
                    {ADMIN.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Pauser</label>
                  <select value={c.pauser} onChange={(e) => setContract({ pauser: e.target.value as PauserModel })} style={{ padding: "6px 8px", width: "100%" }}>
                    {PAUSER.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
                <label style={{ ...fieldStyle, alignSelf: "end" }}>
                  <input type="checkbox" checked={c.upgradeable} onChange={(e) => setContract({ upgradeable: e.target.checked })} /> Upgradeable
                </label>
              </div>
            )}

            <h3 style={{ margin: "8px 0" }}>
              <label style={{ fontWeight: 600 }}>
                <input type="checkbox" checked={!!config.sessionKeys?.enabled} onChange={(e) => setSession({ enabled: e.target.checked })} /> Backend session key enabled
              </label>
            </h3>
            {config.sessionKeys?.enabled && (
              <div style={fieldStyle}>
                <label style={labelStyle}>Spend cap (optional)</label>
                <input value={config.sessionKeys.cap ?? ""} onChange={(e) => setSession({ cap: e.target.value || undefined })} placeholder="e.g. daily spend cap, revocable" style={{ padding: "6px 8px", width: "100%", maxWidth: 360 }} />
              </div>
            )}
          </div>
        )}

        {mode === "json" && (
          <div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Provider</label>
              <select value={providerId} onChange={(e) => setProviderId(e.target.value)} style={{ padding: "6px 8px", minWidth: 220 }}>
                {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <p className="small muted" style={{ marginBottom: 0 }}>{getProvider(providerId)?.summary}</p>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Exported config JSON (non-secret)</label>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={8}
                placeholder='{ "custodyModel": "mpc-tss", "keyExportByUser": true, "recovery": "social" }'
                style={{ width: "100%", fontFamily: "monospace", fontSize: ".85rem", padding: 8 }}
              />
            </div>
            <button onClick={runImport} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--accent, #2563eb)", color: "#fff", cursor: "pointer" }}>
              Parse &amp; audit
            </button>
            {jsonError && <p className="small" style={{ color: "var(--critical-fg, #b91c1c)" }}>{jsonError}</p>}
          </div>
        )}
      </div>

      {warnings.length > 0 && (
        <div style={{ ...panel, borderColor: "var(--medium-fg, #b45309)" }}>
          <strong className="small">Parser fell back to vendor defaults for:</strong>
          <ul className="small" style={{ margin: "6px 0 0" }}>
            {warnings.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
      )}

      <h2>{matrix.config}</h2>
      {/* generatedAt is stamped at render time, so the SSR pass and the client
          hydration pass are milliseconds apart by construction — the mismatch is
          unavoidable, not a bug in the data. Suppressing keeps the server's
          timestamp instead of regenerating the whole tree on the client. */}
      <p className="small muted" suppressHydrationWarning>
        Generated {matrix.generatedAt} · {matrix.cells.length} cells ·{" "}
        {counts["doc-only"] ?? 0} doc-only · {counts["not-verified"] ?? 0} not-verified ·{" "}
        0 on-chain-verified (on-chain reads are Phase 3)
      </p>

      <h2>Top findings (worst first)</h2>
      {topFindings.length === 0 ? (
        <p className="muted">No critical or high single-points-of-failure found.</p>
      ) : (
        <ul>
          {topFindings.map((cell, i) => (
            <li key={i}>
              <strong>{cell.severity.toUpperCase()}</strong> — {ACTION_LABELS[cell.action]} →{" "}
              {ACTOR_LABELS[cell.actor]}: <strong>{cell.verdict}</strong>
              {cell.note ? <> — <span className="muted">{cell.note}</span></> : null}
            </li>
          ))}
        </ul>
      )}

      <h2>Authority matrix</h2>
      <MatrixTable matrix={matrix} />

      <h2>The config that produced it</h2>
      <pre style={{ ...panel, overflowX: "auto", fontSize: ".85rem" }}>{JSON.stringify(config, null, 2)}</pre>
    </>
  );
}
