# Implement structured logging with error levels (debug, info, warn, error)

**Issue #93** | **State:** CLOSED | **Created:** 2026-01-26T08:32:00Z

**Assignees:** linked0, Abdulkarim4u

**Updated:** 2026-02-02T08:05:04Z | **Closed:** 2026-02-02T08:05:04Z

---

# Description

   ## Problem
   Currently, the application uses inconsistent logging with basic `console.log()` and `console.error()` statements. This makes it difficult to:
   - Filter logs by severity level in production
   - Debug issues in production environments
   - Monitor and alert on critical errors
   - Trace request flows across services
   - Disable verbose logs in production while keeping them in development

   ## Proposed Solution
   Implement a structured logging system with standardized log levels and formatting.

   ### Log Levels
   1. **DEBUG** - Detailed information for diagnosing problems (dev only)
   2. **INFO** - General informational messages (service started, config loaded)
   3. **WARN** - Warning messages for potentially harmful situations
   4. **ERROR** - Error events that might still allow the app to continue
   5. **FATAL** - Severe errors that cause application termination

   ### Features
   - ✅ Consistent log formatting across all services
   - ✅ Timestamp with each log entry
   - ✅ Request ID tracking for tracing user actions
   - ✅ Contextual metadata (user ID, market ID, transaction hash)
   - ✅ Environment-based log level control (verbose in dev, minimal in prod)
   - ✅ Structured JSON output for log aggregation tools (optional)
   - ✅ Color-coded console output for readability in development

   ## Example Usage

   ```typescript
   // Before
   console.log('User placed order:', orderId);
   console.error('Failed to execute trade:', error);

   // After
   logger.info('User placed order', { orderId, userId, marketId });
   logger.error('Failed to execute trade', { error: error.message, orderId, txHash });
   logger.debug('Market maker bot checking prices', { outcomeId, currentPrice });
   logger.warn('High gas price detected', { gasPrice, threshold });
   ```

   ## Suggested Libraries
   - **Winston** - Most popular, flexible, supports multiple transports
   - **Pino** - Fastest, JSON-based, great for production
   - **Bunyan** - JSON logging with CLI tool for viewing

