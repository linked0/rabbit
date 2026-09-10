// Authority matrix model — Phase 1 (MVP).
// A matrix answers: for each ACTION (row), which ACTOR (column) can do it,
// alone / in cooperation / not at all / unknown — with a severity and a
// verification status. No on-chain reads in Phase 1: cells are "doc-only"
// (inferred from a hand-authored config) or "not-verified".

export type Verdict = "alone" | "cooperation" | "cannot" | "unknown";
export type Severity = "critical" | "high" | "medium" | "info";
export type Verified = "test" | "on-chain" | "doc-only" | "not-verified";

export type Action =
  | "sign"
  | "recover"
  | "export-key"
  | "change-policy"
  | "pause"
  | "upgrade";

export type Actor = "user" | "provider" | "backend-owner" | "guardians" | "nobody";

export const ACTIONS: Action[] = [
  "sign",
  "recover",
  "export-key",
  "change-policy",
  "pause",
  "upgrade",
];

export const ACTORS: Actor[] = [
  "user",
  "provider",
  "backend-owner",
  "guardians",
  "nobody",
];

export const ACTION_LABELS: Record<Action, string> = {
  sign: "Sign a transaction",
  recover: "Recover the account",
  "export-key": "Export the private key",
  "change-policy": "Change the policy",
  pause: "Pause",
  upgrade: "Upgrade / change code",
};

export const ACTOR_LABELS: Record<Actor, string> = {
  user: "User",
  provider: "Provider",
  "backend-owner": "Backend / owner key",
  guardians: "Guardians",
  nobody: "Nobody",
};

export interface Cell {
  action: Action;
  actor: Actor;
  verdict: Verdict;
  severity: Severity;
  verified: Verified;
  ruleId: string; // which rule produced this cell
  evidence?: string; // URL: provider doc, explorer link, or test id
  note?: string;
}

export interface Matrix {
  config: string; // config name
  cells: Cell[];
  generatedAt: string; // ISO timestamp
}

// ---- Config shape (Phase 1: hand-authored, one canonical form) ----

export type CustodyModel =
  | "provider-custodial" // provider alone can reconstruct/sign
  | "shared-shards" // provider holds a shard; needs cooperation to sign
  | "mpc-tss" // threshold signature; provider is one party
  | "self-custodial"; // only the user holds the key material

export type RecoveryModel = "custodial" | "guardian" | "social" | "none";

export type OwnerModel = "eoa" | "multisig" | "timelock" | "none";
export type AdminModel = "owner" | "timelock" | "none";
export type PauserModel = "owner" | "role" | "none";

export interface EmbeddedWalletConfig {
  provider: string; // e.g. "Privy"
  custodyModel: CustodyModel;
  keyExportByProvider: boolean; // can the provider export a user's key alone?
  keyExportByUser: boolean; // can the user export their own key?
  recovery: RecoveryModel;
  evidence?: string; // link to the provider's custody/export doc
}

export interface ContractConfig {
  ownerModel: OwnerModel;
  multisigThreshold?: string; // e.g. "2-of-3"
  upgradeable: boolean;
  proxyAdmin: AdminModel;
  pauser: PauserModel;
  evidence?: string; // explorer / source link
}

export interface SessionKeyConfig {
  enabled: boolean;
  usableBy: Actor[]; // who can sign with a session key (e.g. backend-owner)
  revocableBy: Actor[]; // who can revoke it
  cap?: string; // spend cap description
}

export interface AuditorConfig {
  name: string;
  embeddedWallet: EmbeddedWalletConfig;
  contract?: ContractConfig;
  sessionKeys?: SessionKeyConfig;
}
