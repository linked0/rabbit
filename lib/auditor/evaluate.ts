// The rules engine core: evaluate(config) -> Matrix.
// Pure function, no I/O. Phase 1 has no on-chain reads, so every cell is
// "doc-only" (inferred from the config) or "not-verified" (config is silent).
//
// A confidently-wrong cell is worse than no cell (see design doc §6 risk note),
// so anything the config does not let us determine is emitted as `unknown` /
// `not-verified`, never a guessed verdict.

import {
  ACTIONS,
  ACTORS,
  type Action,
  type Actor,
  type AuditorConfig,
  type Cell,
  type Matrix,
  type Severity,
  type Verdict,
  type Verified,
} from "./types";

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  info: 0,
};

const VERDICT_RANK: Record<Verdict, number> = {
  alone: 3,
  cooperation: 2,
  unknown: 1,
  cannot: 0,
};

/** Worst-first: higher severity first, then worse verdict. */
export function compareCellsWorstFirst(a: Cell, b: Cell): number {
  const s = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
  if (s !== 0) return s;
  return VERDICT_RANK[b.verdict] - VERDICT_RANK[a.verdict];
}

/**
 * Severity is a pure function of (action, actor, verdict), per the design's
 * rubric:
 *  - critical: a single third party (provider) can move funds or export keys alone
 *  - high:     a single party can change-policy / upgrade / pause alone
 *  - medium:   a dangerous action needs cooperation (residual, non-trivial risk)
 *  - info:     expected, well-scoped authority (incl. "cannot" / "nobody")
 */
export function computeSeverity(
  action: Action,
  actor: Actor,
  verdict: Verdict,
): Severity {
  if (verdict === "cannot") return "info";

  const fundMoving = action === "sign" || action === "export-key";
  const policyControl =
    action === "change-policy" || action === "upgrade" || action === "pause";

  if (verdict === "alone") {
    if (fundMoving && actor === "provider") return "critical";
    if (action === "export-key" && actor === "backend-owner") return "critical";
    if (fundMoving && actor === "backend-owner") return "high";
    if (policyControl) return "high";
    if (action === "recover" && (actor === "provider" || actor === "backend-owner"))
      return "high";
    if (action === "sign" && actor === "user") return "info"; // expected
    return "medium";
  }

  if (verdict === "cooperation") {
    if (fundMoving || policyControl || action === "recover") return "medium";
    return "info";
  }

  // unknown
  return "medium";
}

interface RawVerdict {
  verdict: Verdict;
  ruleId: string;
  note?: string;
}

/** Resolve the verdict for one (action, actor) pair from the config. */
function resolveVerdict(
  action: Action,
  actor: Actor,
  cfg: AuditorConfig,
): RawVerdict {
  const w = cfg.embeddedWallet;
  const c = cfg.contract;
  const sk = cfg.sessionKeys;

  switch (action) {
    case "sign": {
      if (actor === "user") {
        return { verdict: "alone", ruleId: "sign.user.owns-key", note: "The user authorizes their own transactions." };
      }
      if (actor === "provider") {
        switch (w.custodyModel) {
          case "provider-custodial":
            return { verdict: "alone", ruleId: "sign.provider.custodial", note: "Provider can reconstruct the key and sign unilaterally." };
          case "shared-shards":
          case "mpc-tss":
            return { verdict: "cooperation", ruleId: "sign.provider.threshold", note: "Provider holds one share; a signature needs another party." };
          case "self-custodial":
            return { verdict: "cannot", ruleId: "sign.provider.self-custodial", note: "Provider holds no key material." };
        }
      }
      if (actor === "backend-owner") {
        if (sk?.enabled && sk.usableBy.includes("backend-owner")) {
          return { verdict: "alone", ruleId: "sign.backend.session-key", note: `Backend can sign within the session-key scope${sk.cap ? ` (cap: ${sk.cap})` : ""}.` };
        }
        return { verdict: "cannot", ruleId: "sign.backend.no-session-key", note: "No session key grants the backend signing rights." };
      }
      return { verdict: "cannot", ruleId: "sign.default.cannot" };
    }

    case "recover": {
      switch (w.recovery) {
        case "custodial":
          if (actor === "provider")
            return { verdict: "alone", ruleId: "recover.provider.custodial", note: "Custodial recovery: provider can restore access alone." };
          break;
        case "guardian":
        case "social":
          if (actor === "guardians")
            return { verdict: "cooperation", ruleId: "recover.guardians.threshold", note: "Recovery requires a threshold of guardians." };
          break;
        case "none":
          if (actor === "user")
            return { verdict: "alone", ruleId: "recover.user.self", note: "Only the user can recover (e.g. from their own backup)." };
          if (actor === "nobody")
            return { verdict: "cannot", ruleId: "recover.none", note: "No recovery path configured." };
          break;
      }
      return { verdict: "cannot", ruleId: "recover.default.cannot" };
    }

    case "export-key": {
      if (actor === "provider") {
        return w.keyExportByProvider
          ? { verdict: "alone", ruleId: "export.provider.enabled", note: "Provider can export raw key material unilaterally." }
          : { verdict: "cannot", ruleId: "export.provider.disabled", note: "Provider cannot export raw key material." };
      }
      if (actor === "user") {
        return w.keyExportByUser
          ? { verdict: "alone", ruleId: "export.user.enabled", note: "User can export their own key." }
          : { verdict: "cannot", ruleId: "export.user.disabled", note: "Key export is not exposed to the user." };
      }
      return { verdict: "cannot", ruleId: "export.default.cannot" };
    }

    case "change-policy": {
      if (actor === "backend-owner") {
        if (!c) return { verdict: "unknown", ruleId: "policy.no-contract", note: "No contract config supplied; policy owner is undetermined." };
        switch (c.ownerModel) {
          case "eoa":
            return { verdict: "alone", ruleId: "policy.owner.eoa", note: "A single owner EOA can change policy alone." };
          case "multisig":
            return { verdict: "cooperation", ruleId: "policy.owner.multisig", note: `Policy changes need a multisig quorum${c.multisigThreshold ? ` (${c.multisigThreshold})` : ""}.` };
          case "timelock":
            return { verdict: "cooperation", ruleId: "policy.owner.timelock", note: "Timelock turns a change into cooperation + a warning window." };
          case "none":
            return { verdict: "cannot", ruleId: "policy.owner.none", note: "Policy is fixed; no owner can change it." };
        }
      }
      if (actor === "nobody" && c?.ownerModel === "none") {
        return { verdict: "cannot", ruleId: "policy.nobody.immutable", note: "Policy is immutable." };
      }
      return { verdict: "cannot", ruleId: "policy.default.cannot" };
    }

    case "pause": {
      if (!c) return { verdict: actor === "nobody" ? "cannot" : "unknown", ruleId: "pause.no-contract", note: "No contract config supplied." };
      if (actor === "backend-owner") {
        if (c.pauser === "owner" || c.pauser === "role")
          return { verdict: "alone", ruleId: "pause.backend.holds-role", note: "Owner / a PAUSER role can pause alone." };
        return { verdict: "cannot", ruleId: "pause.backend.no-role" };
      }
      if (actor === "nobody" && c.pauser === "none")
        return { verdict: "cannot", ruleId: "pause.none", note: "No pause authority exists." };
      return { verdict: "cannot", ruleId: "pause.default.cannot" };
    }

    case "upgrade": {
      if (!c) return { verdict: actor === "nobody" ? "cannot" : "unknown", ruleId: "upgrade.no-contract", note: "No contract config supplied." };
      if (!c.upgradeable) {
        if (actor === "nobody")
          return { verdict: "cannot", ruleId: "upgrade.immutable", note: "Contract is non-upgradeable." };
        return { verdict: "cannot", ruleId: "upgrade.immutable.actor" };
      }
      if (actor === "backend-owner") {
        switch (c.proxyAdmin) {
          case "owner":
            return { verdict: "alone", ruleId: "upgrade.admin.owner", note: "Proxy admin is the owner key — can upgrade code alone." };
          case "timelock":
            return { verdict: "cooperation", ruleId: "upgrade.admin.timelock", note: "Upgrades go through a timelock delay." };
          case "none":
            return { verdict: "unknown", ruleId: "upgrade.admin.unknown", note: "Upgradeable but proxy admin is unspecified." };
        }
      }
      return { verdict: "cannot", ruleId: "upgrade.default.cannot" };
    }
  }
}

/**
 * Verification status. Phase 1 does no reads, so a determinable verdict is
 * "doc-only" and an `unknown` verdict is "not-verified".
 */
function resolveVerified(verdict: Verdict): Verified {
  return verdict === "unknown" ? "not-verified" : "doc-only";
}

/** Pick the most relevant evidence link the config offers for a cell. */
function resolveEvidence(action: Action, cfg: AuditorConfig): string | undefined {
  const contractActions: Action[] = ["change-policy", "pause", "upgrade"];
  if (contractActions.includes(action)) return cfg.contract?.evidence;
  return cfg.embeddedWallet.evidence;
}

/** Build the full actions x actors matrix from a config. Pure. */
export function evaluate(cfg: AuditorConfig): Matrix {
  const cells: Cell[] = [];
  for (const action of ACTIONS) {
    for (const actor of ACTORS) {
      const raw = resolveVerdict(action, actor, cfg);
      const verified = resolveVerified(raw.verdict);
      cells.push({
        action,
        actor,
        verdict: raw.verdict,
        severity: computeSeverity(action, actor, raw.verdict),
        verified,
        ruleId: raw.ruleId,
        evidence: resolveEvidence(action, cfg),
        note: raw.note,
      });
    }
  }
  return {
    config: cfg.name,
    cells,
    generatedAt: new Date().toISOString(),
  };
}

/** The highest-severity, actionable cells in worst-first order (for the findings list). */
export function findings(matrix: Matrix): Cell[] {
  return matrix.cells
    .filter((c) => c.verdict === "alone" || c.verdict === "cooperation" || c.verdict === "unknown")
    .filter((c) => c.severity === "critical" || c.severity === "high")
    .sort(compareCellsWorstFirst);
}

/** Look up a single cell. */
export function cellAt(matrix: Matrix, action: Action, actor: Actor): Cell | undefined {
  return matrix.cells.find((c) => c.action === action && c.actor === actor);
}
