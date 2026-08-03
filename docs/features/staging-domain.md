# Staging Domain — `staging.rabbit.jaylabs.xyz`

**Goal (jay):** give the Cloud Run URL (`https://rabbit-179807446244.asia-northeast3.run.app/`) a
memorable staging address, **`staging.rabbit.jaylabs.xyz`**, as a pre-domain testing tier ahead
of production (`www.jaylabs.xyz` + apex → rabbit, per the jun-19 plan).

*Source: jay's request, added 2026-07-07.*

## Constraint (verified in GCP docs, 2026-07-07)
Cloud Run's built-in **domain mapping does not support `asia-northeast3` (Seoul)** — the
service's region — so the free built-in path is out.

## Options considered
1. **Firebase Hosting rewrite → Cloud Run** (recommended) — works with any region, ~free,
   Google-managed TLS. Work: create a Firebase Hosting site, `firebase.json` rewrite
   `{ "source": "**", "run": { "serviceId": "rabbit", "region": "asia-northeast3" } }`, add the
   DNS records Firebase issues for `staging.rabbit.jaylabs.xyz`.
2. Global external HTTPS **load balancer** + serverless NEG — most control (CDN, Cloud Armor) but
   ~$18+/mo; overkill for a staging URL.
3. **Move the service to `asia-northeast1` (Tokyo)** to use built-in mapping — free, but gives up
   Seoul latency; not worth it just for a staging alias.

**Recommendation:** option 1 (Firebase Hosting). Note `AUTH_URL`/Google-OAuth redirect must
include the new origin when auth is used on staging (cloud mode).

## Status
**🚫 Not pursuing (2026-08-03)** — jay decided not to run a separate staging server. The
Firebase Hosting mechanism from option 1 above *was* built (`firebase.json` +
`scripts/setup-domain-firebase.sh`), but it ended up wired to **production**
(`www.jaylabs.xyz`), not this staging subdomain — no `staging.rabbit.jaylabs.xyz` DNS/site
exists. Left here as historical context in case a staging tier is wanted later; the reusable
script makes it cheap to revisit.
