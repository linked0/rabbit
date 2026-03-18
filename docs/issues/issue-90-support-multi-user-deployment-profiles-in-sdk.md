# Support Multi-User Deployment Profiles in SDK

**Issue #90** | **State:** OPEN | **Created:** 2026-01-26T07:06:23Z

**Labels:** enhancement

**Assignees:** linked0

**Updated:** 2026-02-02T11:24:02Z | **Closed:** N/A

---

**Context**
Currently, multiple developers (e.g., Dev A and Dev B) working on the same network (e.g., `bscTestnet`) conflict because they may be using different contract deployments (isolated environments).
The current solution (using different SDK versions) causes 'local uncommitted package.json' changes and versioning hell.

**Proposed Solution: Deployment Profiles**
Implement **Named Profiles** within `nostra-contracts` and the SDK to allow switching environments via an environment variable, without changing code.

**1. Update `deployments.json` Schema**
Structure the JSON to support named overrides:
```json
{
  "bscTestnet": {
    "default": { "ConditionalTokens": "0x123..." },
    "dev_A": { "ConditionalTokens": "0xABC..." },
    "dev_B": { "ConditionalTokens": "0xXYZ..." }
  }
}
```

**2. Update SDK Logic**
Modify `contracts.ts` / `addresses.ts` to read `process.env.DEPLOYMENT_PROFILE`.
- If `DEPLOYMENT_PROFILE='dev_A'`, load addresses from `deployments.bscTestnet.dev_A`.
- Fallback to `default` if profiles or keys are missing.

**3. Developer Usage**
Developers simply run:
```bash
DEPLOYMENT_PROFILE=dev_A yarn dev
```
This keeps `package.json` and `deployments.json` clean and shared, while allowing isolation.

**Tasks**
- [ ] Update `nostra-contracts` deployment scripts to support saving to named profiles.
- [ ] Update `deployments.json` schema.
- [ ] Update `@nostra-dev/sdk` to parse `DEPLOYMENT_PROFILE`.
- [ ] Document usage for the team.

