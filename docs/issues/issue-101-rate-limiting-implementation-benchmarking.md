# Rate Limiting Implementation & Benchmarking

**Issue #101** | **State:** OPEN | **Created:** 2026-01-30T05:42:53Z

**Labels:** enhancement

**Assignees:** linked0, Abdulkarim4u

**Updated:** 2026-01-30T07:20:45Z | **Closed:** N/A

---

# Rate Limiting: Implementation Review & Industry Comparison

  ## 📊 Overview
  Document and validate our rate limiting implementation against industry leaders (Polymarket, Binance, Coinbase) to ensure optimal balance between user experience and platform protection.

  ## 🎯 Current Implementation

  ### Rate Limit Tiers

  | Endpoint Type | Current Limit | Window | Status |
  |--------------|---------------|---------|---------|
  | **General API** | 100 requests | 15 minutes | ✅ Implemented |
  | **Trade Execution** | 300 requests | 1 minute | ✅ Implemented |
  | **Order Creation** | 300 requests | 1 minute | ✅ Implemented |
  | **Read Operations** | 60 requests | 1 minute | ✅ Implemented |
  | **Health Checks** | Unlimited | - | ✅ Exempt |

  ### Implementation Details

  **Files:**
  - `api/src/middleware/rateLimiter.ts` (130+ lines)
  - `api/src/index.ts` (applied to routes)

  **Features:**
  - ✅ IP-based tracking using `express-rate-limit`
  - ✅ Different limits for development vs production
  - ✅ Security logging for all violations
  - ✅ HTTP 429 responses with `Retry-After` headers
  - ✅ Exemptions for localhost in development
  - ✅ Exemptions for read-only browsing endpoints (markets, categories, price history)
  - ✅ Standardized error responses with error codes

  **Protected Endpoints:**
  ```javascript
  // Trade endpoints (300 req/min)
  app.use('/api/trade/', tradeLimiter);
  app.use('/api/trades/', tradeLimiter);

  // Order creation endpoints (300 req/min)
  app.use('/api/orders/user/create', orderCreationLimiter);
  app.use('/api/orders/user/batch', orderCreationLimiter);

  Exempt Endpoints (No Rate Limiting):
  - /health - Health checks
  - /api/markets - Market listing and details
  - /api/market-groups - Market groups
  - /api/market-orders - Order books (read-only)
  - /price-history - Price charts
  - /api/categories - Categories
  - /api/sync/status - Sync status

  🏢 Industry Comparison

  Polymarket (Direct Competitor)

  API Rate Limits:
  - General API: ~600 requests/min
  - Trading: ~300 requests/min
  - WebSocket: Unlimited (real-time updates)
  - Strategy: Aggressive limits on write operations, lenient on reads

  Our Comparison:
  | Feature         | Polymarket  | Nostra                 | Status         |
  |-----------------|-------------|------------------------|----------------|
  | Trade Limit     | 300 req/min | 300 req/min            | ✅ Match       |
  | Order Creation  | 300 req/min | 300 req/min            | ✅ Match       |
  | Read Operations | Unlimited   | 60 req/min             | ⚠️ More Strict |
  | General API     | 600 req/min | 100 req/15min (~7/min) | ⚠️ More Strict |

  Binance (Crypto Exchange Leader)

  API Rate Limits:
  - General API: 1200 request weight/min (varies by endpoint)
  - Order Placement: 100 orders/10sec (~600/min)
  - WebSocket: 10 connections per IP
  - Strategy: Weight-based system (heavy operations cost more)

  Their Approach:
  Light request (GET /api/v3/ticker/price) = 2 weight
  Heavy request (POST /api/v3/order) = 1 weight
  Total budget: 1200 weight/min

  Our Comparison:
  | Feature         | Binance                 | Nostra      | Status                |
  |-----------------|-------------------------|-------------|-----------------------|
  | Order Placement | ~600 req/min            | 300 req/min | ✅ More Conservative  |
  | Read Operations | Variable (weight-based) | 60 req/min  | ⚠️ Different Approach |
  | Trade Execution | ~600 req/min            | 300 req/min | ✅ More Conservative  |

  Coinbase (Crypto Exchange)

  API Rate Limits:
  - Public Endpoints: 10 requests/sec (~600/min)
  - Private Endpoints: 15 requests/sec (~900/min)
  - Trading: 10 orders/sec (~600/min)
  - Strategy: Per-second limits with burst allowance

  Our Comparison:
  | Feature           | Coinbase    | Nostra      | Status               |
  |-------------------|-------------|-------------|----------------------|
  | Public Endpoints  | 600 req/min | 7 req/min   | ⚠️ Much More Strict  |
  | Private Endpoints | 900 req/min | 300 req/min | ✅ More Conservative |
  | Trading           | 600 req/min | 300 req/min | ✅ More Conservative |

  🔍 Analysis & Findings

  ✅ Strengths

  1. Trade Protection: 300 req/min matches Polymarket, more conservative than Binance/Coinbase
  2. DoS Prevention: Strict limits prevent abuse and high-frequency trading manipulation
  3. Development-Friendly: Localhost exempt in dev mode for easy testing
  4. User Experience: Read-only browsing endpoints unlimited (markets, price history)
  5. Industry-Aligned: Core trading limits match direct competitor (Polymarket)


  Nice to Have

  - User-based rate limiting (requires auth)
  - Burst protection with token bucket
  - Rate limit dashboard (monitoring)
  - Whitelist for trusted IPs/partners

  🔗 References

  Industry Standards:
  - https://docs.polymarket.com/#rate-limiting
  - https://binance-docs.github.io/apidocs/spot/en/#limits
  - https://docs.cloud.coinbase.com/exchange/docs/rate-limits

  Implementation:
  - Current: /api/src/middleware/rateLimiter.ts
  - Applied: /api/src/index.ts
  - Documentation: /docs/task/design/security-performance-audit.md

  💬 Discussion Points

  1. Should we match Polymarket's 600 req/min or be more conservative at 300?
    - Pro: Better UX, competitive feature parity
    - Con: Higher server load, more DoS risk
  2. Should read-only endpoints be unlimited like Polymarket?
    - Pro: Best UX for price monitoring
    - Con: Vulnerable to scraping bots
  3. When should we implement user-based rate limiting?
    - Depends on authentication implementation timeline
    - Could be Phase 2 after MVP

  ---
  Labels: enhancement, security, performance, rate-limiting
  Milestone: Post-MVP / Phase 2
  Assignee: Backend Team
  Priority: Medium

