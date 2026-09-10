// Per-provider parsers — Phase 2.
//
// Each embedded-wallet vendor has its own authority model (can it export keys
// unilaterally? is signing threshold or custodial? how does recovery work?).
// A ProviderAdapter encapsulates that model two ways:
//   - `defaults`: the vendor's out-of-the-box posture, usable as a preset.
//   - `parseExport(json)`: map a *non-secret* exported config (tier 2) onto our
//     canonical EmbeddedWalletConfig, reading a small set of known fields and
//     falling back to `defaults` (with a warning) for anything it can't find.
//
// Everything here is DOC-ONLY: it reflects each vendor's documented default
// behaviour, not an on-chain or API read. On-chain verification is Phase 3.
// A confidently-wrong cell is worse than no cell (design §6), so unread fields
// fall back to a conservative default and are reported as warnings, never
// silently guessed.

import type {
  CustodyModel,
  EmbeddedWalletConfig,
  RecoveryModel,
} from "./types";

export interface ProviderAdapter {
  id: string;
  label: string;
  /** One line on the vendor's default authority model. */
  summary: string;
  /** Vendor custody/key-export documentation. */
  evidence: string;
  /** The vendor's out-of-the-box posture (also offered as a preset). */
  defaults: EmbeddedWalletConfig;
  /**
   * Vendor-specific JSON field names (dot paths) that map onto a canonical
   * field, tried in order. The canonical key itself is always tried first, so
   * a canonical JSON round-trips.
   */
  aliases: Partial<Record<CanonicalField, string[]>>;
}

type CanonicalField =
  | "custodyModel"
  | "keyExportByProvider"
  | "keyExportByUser"
  | "recovery";

export interface ParseResult {
  config: EmbeddedWalletConfig;
  warnings: string[];
}

const CUSTODY_MODELS: CustodyModel[] = [
  "provider-custodial",
  "shared-shards",
  "mpc-tss",
  "self-custodial",
];
const RECOVERY_MODELS: RecoveryModel[] = ["custodial", "guardian", "social", "none"];

export const PROVIDERS: ProviderAdapter[] = [
  {
    id: "privy",
    label: "Privy",
    summary:
      "Embedded wallets via TSS/MPC — Privy holds one share and cannot sign alone; user-side key export is available; no unilateral provider export by default.",
    evidence: "https://docs.privy.io/guide/security/",
    defaults: {
      provider: "Privy",
      custodyModel: "mpc-tss",
      keyExportByProvider: false,
      keyExportByUser: true,
      recovery: "social",
      evidence: "https://docs.privy.io/guide/security/",
    },
    aliases: {
      custodyModel: ["walletType", "embedded.custody", "custody"],
      keyExportByUser: ["allowKeyExport", "embedded.export.enabled", "keyExport"],
      keyExportByProvider: ["providerKeyExport"],
      recovery: ["recoveryMethod", "embedded.recovery"],
    },
  },
  {
    id: "dynamic",
    label: "Dynamic",
    summary:
      "Embedded wallets backed by MPC — the provider is one signing party, not a unilateral custodian; user export supported.",
    evidence: "https://docs.dynamic.xyz/wallets/embedded-wallets/overview",
    defaults: {
      provider: "Dynamic",
      custodyModel: "mpc-tss",
      keyExportByProvider: false,
      keyExportByUser: true,
      recovery: "social",
      evidence: "https://docs.dynamic.xyz/wallets/embedded-wallets/overview",
    },
    aliases: {
      custodyModel: ["walletKind", "mpc.mode", "custody"],
      keyExportByUser: ["exportEnabled", "keyExport"],
      keyExportByProvider: ["providerExport"],
      recovery: ["recovery.type"],
    },
  },
  {
    id: "web3auth",
    label: "Web3Auth",
    summary:
      "Key split by Shamir's Secret Sharing — a network share is held server-side; reconstruction needs cooperation; user export supported.",
    evidence: "https://web3auth.io/docs/infrastructure/",
    defaults: {
      provider: "Web3Auth",
      custodyModel: "shared-shards",
      keyExportByProvider: false,
      keyExportByUser: true,
      recovery: "social",
      evidence: "https://web3auth.io/docs/infrastructure/",
    },
    aliases: {
      custodyModel: ["keyType", "shareModel", "custody"],
      keyExportByUser: ["exportShare", "keyExport"],
      keyExportByProvider: ["providerExport"],
      recovery: ["recoveryShare", "recovery"],
    },
  },
  {
    id: "turnkey",
    label: "Turnkey",
    summary:
      "Keys live in the provider's secure enclaves gated by your org's policy quorum — treated conservatively as provider-held custody until the quorum is verified.",
    evidence: "https://docs.turnkey.com/security/our-approach",
    defaults: {
      provider: "Turnkey",
      custodyModel: "provider-custodial",
      keyExportByProvider: false,
      keyExportByUser: true,
      recovery: "custodial",
      evidence: "https://docs.turnkey.com/security/our-approach",
    },
    aliases: {
      custodyModel: ["custody", "enclave.model"],
      keyExportByUser: ["exportToEnclave", "keyExport"],
      keyExportByProvider: ["providerExport"],
      recovery: ["recovery"],
    },
  },
];

export function getProvider(id: string): ProviderAdapter | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

/** Read a dot-path (e.g. "embedded.export.enabled") out of a parsed object. */
function readPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/** First defined value across the canonical key + the vendor aliases. */
function firstValue(
  raw: Record<string, unknown>,
  field: CanonicalField,
  aliases: string[] | undefined,
): unknown {
  for (const path of [field, ...(aliases ?? [])]) {
    const v = readPath(raw, path);
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function coerceBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

/**
 * Map a vendor's exported (non-secret) config JSON onto our canonical
 * EmbeddedWalletConfig. Unread fields fall back to the vendor default and are
 * reported in `warnings` — never silently guessed.
 */
export function parseExport(adapter: ProviderAdapter, raw: unknown): ParseResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Exported config must be a JSON object.");
  }
  const obj = raw as Record<string, unknown>;
  const d = adapter.defaults;
  const warnings: string[] = [];

  // custodyModel (enum)
  let custodyModel = d.custodyModel;
  const rawCustody = firstValue(obj, "custodyModel", adapter.aliases.custodyModel);
  if (typeof rawCustody === "string" && CUSTODY_MODELS.includes(rawCustody as CustodyModel)) {
    custodyModel = rawCustody as CustodyModel;
  } else if (rawCustody !== undefined) {
    warnings.push(`Unrecognised custody model "${String(rawCustody)}"; kept default "${d.custodyModel}".`);
  } else {
    warnings.push(`custodyModel not found in export; kept vendor default "${d.custodyModel}".`);
  }

  // recovery (enum)
  let recovery = d.recovery;
  const rawRecovery = firstValue(obj, "recovery", adapter.aliases.recovery);
  if (typeof rawRecovery === "string" && RECOVERY_MODELS.includes(rawRecovery as RecoveryModel)) {
    recovery = rawRecovery as RecoveryModel;
  } else if (rawRecovery !== undefined) {
    warnings.push(`Unrecognised recovery model "${String(rawRecovery)}"; kept default "${d.recovery}".`);
  } else {
    warnings.push(`recovery not found in export; kept vendor default "${d.recovery}".`);
  }

  // key export (booleans)
  let keyExportByUser = d.keyExportByUser;
  const rawExportUser = coerceBool(firstValue(obj, "keyExportByUser", adapter.aliases.keyExportByUser));
  if (rawExportUser !== undefined) keyExportByUser = rawExportUser;
  else warnings.push(`keyExportByUser not found in export; kept vendor default "${d.keyExportByUser}".`);

  let keyExportByProvider = d.keyExportByProvider;
  const rawExportProvider = coerceBool(
    firstValue(obj, "keyExportByProvider", adapter.aliases.keyExportByProvider),
  );
  if (rawExportProvider !== undefined) keyExportByProvider = rawExportProvider;
  else warnings.push(`keyExportByProvider not found in export; kept vendor default "${d.keyExportByProvider}".`);

  const provider =
    typeof obj.provider === "string" && obj.provider.trim() ? obj.provider : d.provider;

  return {
    config: {
      provider,
      custodyModel,
      keyExportByProvider,
      keyExportByUser,
      recovery,
      evidence: d.evidence,
    },
    warnings,
  };
}
