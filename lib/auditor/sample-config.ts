// Dogfood input: Jayverse's own wallet / custody choices, hand-authored.
// Per the design doc — "our config choices are every user's custody reality" —
// this is the first public report and the config the UI renders by default.
//
// This mirrors the Jayverse Wallet service's stated posture: an embedded-wallet
// provider with an MPC/threshold custody model (provider is one signing party,
// not a unilateral custodian), no provider-side raw key export, guardian-based
// recovery, and a smart account owned by a timelock'd multisig with a scoped
// backend session key for the Rabbit agent.

import type { AuditorConfig } from "./types";
import { PROVIDERS } from "./providers";

export const jayverseConfig: AuditorConfig = {
  name: "Jayverse Wallet (self-audit)",
  embeddedWallet: {
    provider: "Privy",
    custodyModel: "mpc-tss",
    keyExportByProvider: false,
    keyExportByUser: true,
    recovery: "guardian",
    evidence: "https://docs.privy.io/guide/security/", // provider custody/export doc
  },
  contract: {
    ownerModel: "multisig",
    multisigThreshold: "2-of-3",
    upgradeable: true,
    proxyAdmin: "timelock",
    pauser: "role",
    evidence: "https://etherscan.io/", // stand-in explorer link for the deployed account
  },
  sessionKeys: {
    enabled: true,
    usableBy: ["backend-owner"], // the Rabbit agent draws against a scoped session key
    revocableBy: ["user", "backend-owner"],
    cap: "daily spend cap, revocable",
  },
};

// A deliberately worse config, useful for demoing the worst-first ordering and
// the critical/high severities (a fully custodial provider that can export keys).
export const riskyConfig: AuditorConfig = {
  name: "Custodial provider (example)",
  embeddedWallet: {
    provider: "Example Custodial",
    custodyModel: "provider-custodial",
    keyExportByProvider: true,
    keyExportByUser: false,
    recovery: "custodial",
    evidence: "https://example.com/custody",
  },
  contract: {
    ownerModel: "eoa",
    upgradeable: true,
    proxyAdmin: "owner",
    pauser: "owner",
    evidence: "https://etherscan.io/",
  },
  sessionKeys: {
    enabled: true,
    usableBy: ["backend-owner"],
    revocableBy: ["backend-owner"],
    cap: "no cap",
  },
};

// Each provider's out-of-the-box posture, offered in the picker so an operator
// can start from a vendor default and adjust (Phase 2 intake). No contract or
// session keys — those halves of the matrix show as unknown until supplied.
export const providerPresets: AuditorConfig[] = PROVIDERS.map((p) => ({
  name: `${p.label} (vendor default)`,
  embeddedWallet: p.defaults,
}));

export const presets: AuditorConfig[] = [
  jayverseConfig,
  riskyConfig,
  ...providerPresets,
];
