# # BullMQ Implementation Guide: Modern Job Queue Architecture

**Issue #104** | **State:** OPEN | **Created:** 2026-02-02T07:41:07Z

**Labels:** documentation, enhancement

**Assignees:** linked0

**Updated:** 2026-02-02T11:25:52Z | **Closed:** N/A

---


## 📚 Educational Overview

This document explains **BullMQ**, a Redis-based job queue system, and how it will transform our background job processing from database polling to event-driven architecture.

---

## 🎯 What is BullMQ?

**BullMQ** is the industry-standard job queue library for Node.js applications. It uses Redis as a message broker to handle background jobs efficiently.

### **Core Concept**

Instead of constantly checking a database for pending jobs (polling), BullMQ uses **Redis Pub/Sub** to instantly notify workers when new jobs arrive (event-driven).

### **Real User Scenario** 👤

**Meet Sarah**: A user on Nostra who wants to trade on the market "Will Bitcoin reach $100k by end of 2026?"

**Current System** (Database Polling):
```
Sarah: [Opens market] "I think YES! Let me buy 100 shares at $0.65"
Sarah: [Clicks "Buy"] 🖱️
Browser: "Trade pending... ⏳" [Shows spinner]

[Meanwhile, in the backend...]
Transaction Processor: [Polling database every 3 seconds]
                      "Any trades? No... Any trades? No... Any trades? YES!"
                      [Finally processes after 0-3 second delay]
                      [Executes on blockchain - 2 seconds]

Sarah: [Still sees spinner for 2-5 seconds total]
Sarah: "Is this working? Why is it so slow?" 😟

[Finally...]
Browser: "Trade executed!" ✅
Sarah: [Refreshes page to see updated balance]
```

**With BullMQ** (Event-Driven):
```
Sarah: [Opens market] "I think YES! Let me buy 100 shares at $0.65"
Sarah: [Clicks "Buy"] 🖱️
Browser: "Executing trade..." ⏳

[Meanwhile, in the backend...]
API Server: [Adds job to Redis queue - <1ms]
Worker Service: [Instantly notified via Redis Pub/Sub] 🔔
               [Immediately starts executing on blockchain]

Browser: [WebSocket updates in real-time]
         "Preparing transaction... 20% ▓▓░░░░░░░░"
         "Broadcasting to blockchain... 50% ▓▓▓▓▓░░░░░"
         "Waiting for confirmation... 75% ▓▓▓▓▓▓▓░░░"
         "Updating balances... 90% ▓▓▓▓▓▓▓▓▓░"

[2 seconds later...]
Browser: "Trade executed! ✅ TX: 0xabc123..."
         [Balance updates automatically, no refresh needed]
         [Shows transaction link to BSC Testnet explorer]

Sarah: "Wow, that was fast! And I could see what was happening!" 😊
```

**The Difference**:
- Current: 2-5 seconds with no feedback = "Is it broken?" 😟
- BullMQ: ~2 seconds with real-time updates = "This is smooth!" 😊

### **Real-World Analogy: Nostra Prediction Market** 💡

**Current System (Database Polling)** = Transaction Processor Checking Database Every 3 Seconds
```
Transaction Processor Worker: "Are there pending trades?" [queries database]
Database: "No pending trades"
[3 seconds pass...]

Transaction Processor Worker: "Are there pending trades?" [queries database]
Database: "No pending trades"
[3 seconds pass...]

Transaction Processor Worker: "Are there pending trades?" [queries database]
Database: "Yes! User wants to buy 100 YES shares on 'Bitcoin $100k' market"
Transaction Processor Worker: [Finally starts executing trade on blockchain]

MEANWHILE:
User: [Placed trade 2.5 seconds ago, still waiting...] 😟
User's browser: "Trade pending... ⏳"

Result:
- Wasted database queries every 3 seconds (even when no trades)
- Delay: User's trade waits up to 3 seconds before blockchain execution starts
- If 10 API servers running: 10 workers all querying database simultaneously
- Database overload during high trading volume
```

**BullMQ (Event-Driven)** = Instant Trade Notification System
```
User: "Buy 100 YES shares on 'Bitcoin $100k'" [clicks button]
API Server: [Adds trade to Redis queue] 🔔 "NEW TRADE!"
Transaction Processor Worker: [Instantly notified] "Got it! Executing on blockchain..."
                              [Signs transaction, broadcasts to BSC Testnet]
                              [Transaction confirmed ✅]
API Server: [Receives completion event] → WebSocket → User
User's browser: "Trade executed! TX: 0xabc123..." ✅

MEANWHILE (if 10 API servers running):
- Only 1 worker picks up the trade (no duplicates)
- Other 9 workers remain idle (no wasted queries)
- Redis coordinates everything automatically

Result:
- Zero database polling (instant notification via Redis Pub/Sub)
- Instant processing (0ms delay)
- User sees "Trade executed!" within ~3 seconds (blockchain time, not queue time)
- 10 API servers = same performance as 1 server (Redis handles coordination)
```

### **Another Example: Price Snapshots** 📸

**Current System (node-cron polling)**:
```
Every 30 seconds, EACH API server runs:

API Server 1: "Time to capture price snapshots!" [queries all 50 active markets]
              [Inserts 100 rows to price_history table (YES + NO for each market)]

API Server 2: "Time to capture price snapshots!" [queries same 50 markets]
              [Inserts 100 rows to price_history table] ← DUPLICATE!

API Server 3-10: [All doing the same thing...] ← 10x DATABASE WRITES!

Database: [Overloaded with 1,000 duplicate price snapshots every 30 seconds] 💥

Result:
- 10x more database writes than needed
- Possible race conditions (duplicate data)
- Database performance degrades
```

**BullMQ (scheduled jobs)**:
```
Redis Scheduler: "Time for price snapshot!" [30 seconds elapsed]
                 [Publishes event to "price-snapshot" queue] 🔔

Worker Service: [Only 1 instance running] "Got it!"
                [Queries 50 active markets]
                [Inserts 100 rows to price_history table]
                [Done ✅]

API Servers 1-10: [Continue serving user requests, unaware of price snapshot]

Result:
- Exactly 1 snapshot per interval (no duplicates)
- API servers stay fast (not doing background work)
- Database load reduced by 90%
```

---

## 📊 Architecture Comparison

### **Current Architecture: Database Polling**

```
┌────────────────────────────────────────────────────────┐
│                  API SERVER                            │
│  User makes trade request                              │
│  ↓                                                     │
│  INSERT INTO transaction_queue (...)                   │
│  VALUES ('PENDING', {...})                             │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│              POSTGRESQL DATABASE                        │
│  ┌──────────────────────────────────────────────┐     │
│  │  transaction_queue table                     │     │
│  │  ┌────┬────────┬───────┬────────────────┐   │     │
│  │  │ id │ status │  data │   created_at   │   │     │
│  │  ├────┼────────┼───────┼────────────────┤   │     │
│  │  │ 1  │PENDING │ {...} │ 2024-01-30 ... │   │     │
│  │  │ 2  │PENDING │ {...} │ 2024-01-30 ... │   │     │
│  │  │ 3  │PENDING │ {...} │ 2024-01-30 ... │   │     │
│  │  └────┴────────┴───────┴────────────────┘   │     │
│  └──────────────────────────────────────────────┘     │
└──────────▲─────────────────────────────────────────────┘
           │
           │ SELECT * FROM transaction_queue
           │ WHERE status = 'PENDING'
           │ LIMIT 5
           │ (Every 3 seconds!)
           │
┌──────────┴─────────────────────────────────────────────┐
│            TRANSACTION PROCESSOR (Worker)               │
│  ┌──────────────────────────────────────────────┐     │
│  │  setInterval(() => {                         │     │
│  │    // Poll database every 3 seconds          │     │
│  │    const jobs = await db.getPending(5)       │     │
│  │    for (job of jobs) {                       │     │
│  │      await processJob(job)                   │     │
│  │    }                                          │     │
│  │  }, 3000)                                     │     │
│  └──────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────┘

⚠️ PROBLEMS:
❌ Database queried every 3 seconds (even when empty)
❌ Up to 3-second delay before job processing starts
❌ Multiple workers polling = Multiple redundant queries
❌ Database becomes bottleneck under load
❌ No job priorities (first-come-first-served only)
❌ Complex retry logic (manual implementation)
```

### **BullMQ Architecture: Event-Driven**

```
┌────────────────────────────────────────────────────────┐
│                  API SERVER                            │
│  User makes trade request                              │
│  ↓                                                     │
│  await tradeQueue.add('execute-trade', {...})         │
│  (Adds job to Redis - <1ms)                           │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│              REDIS (ElastiCache)                        │
│  In-Memory Job Queue                                   │
│  ┌──────────────────────────────────────────────┐     │
│  │  Queue: "trade-execution"                    │     │
│  │  ┌────────────────────────────────────┐     │     │
│  │  │ Job 1: PENDING (priority: 1)      │     │     │
│  │  │ Job 2: PENDING (priority: 1)      │     │     │
│  │  │ Job 3: ACTIVE  (worker processing)│     │     │
│  │  └────────────────────────────────────┘     │     │
│  │                                               │     │
│  │  Queue: "price-snapshot"                     │     │
│  │  ┌────────────────────────────────────┐     │     │
│  │  │ Job 1: PENDING (priority: 5)      │     │     │
│  │  └────────────────────────────────────┘     │     │
│  └──────────────────────────────────────────────┘     │
│                                                        │
│  Pub/Sub Channels (Event Broadcasting)                │
│  ┌──────────────────────────────────────────────┐     │
│  │ Channel: "queue:trade-execution:added"       │     │
│  │ Event: "New job available!" 🔔               │     │
│  └──────────────────────────────────────────────┘     │
└───────────┬────────────────────────────────────────────┘
            │
            │ INSTANT EVENT NOTIFICATION
            │ (0ms delay - Redis Pub/Sub)
            │
┌───────────▼────────────────────────────────────────────┐
│            TRANSACTION PROCESSOR (Worker)               │
│  ┌──────────────────────────────────────────────┐     │
│  │  const worker = new Worker(                  │     │
│  │    'trade-execution',                        │     │
│  │    async (job) => {                          │     │
│  │      // Process job IMMEDIATELY!             │     │
│  │      console.log('Got job:', job.id)         │     │
│  │      await executeTradeOnBlockchain(job.data)│     │
│  │    },                                         │     │
│  │    { concurrency: 10 }  // 10 parallel jobs  │     │
│  │  )                                            │     │
│  │                                               │     │
│  │  // Event listeners (automatic)              │     │
│  │  worker.on('completed', (job) => {           │     │
│  │    console.log('Job done!', job.id)          │     │
│  │  })                                           │     │
│  └──────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────┘

✅ BENEFITS:
✅ INSTANT job processing (0ms delay)
✅ No database polling (Redis notifies workers)
✅ Multiple workers coordinate automatically
✅ Built-in job priorities (urgent jobs first)
✅ Automatic retries with exponential backoff
✅ Redis scales to millions of jobs/second
✅ 90% cost reduction (Redis cheaper than DB polling)
```

---

## 🔑 Key Concepts Explained

### **1. Queue (Job Storage)**

**What it is**: A Redis list that stores pending jobs in order.

**Nostra Platform Example**:
```typescript
import { Queue } from 'bullmq';

// Create trade execution queue
const tradeQueue = new Queue('trade-execution', {
  connection: { host: 'localhost', port: 6379 }
});

// User clicks "Buy 100 YES shares" on "Bitcoin reaches $100k by 2026?" market
await tradeQueue.add('execute-trade', {
  userId: 'user-abc123',
  marketId: 'bitcoin-100k-2026',
  outcomeId: 'yes-outcome-xyz',
  side: 'BUY',
  shares: 100,
  price: 0.65,  // $0.65 per share
  totalCost: 65  // 100 shares × $0.65 = $65 USDC
}, {
  priority: 1,        // Urgent! Trades are highest priority
  attempts: 3,        // Retry 3 times if blockchain tx fails
  backoff: {
    type: 'exponential',
    delay: 2000       // Wait 2s, then 4s, then 8s between retries
  }
});

console.log('Trade queued! User sees: "Trade pending..." ⏳');
// Output: Job added instantly (<1ms)
// User's browser receives immediate response
// Worker picks up job and executes on blockchain
```

### **2. Worker (Job Processor)**

**What it is**: A background process that listens for jobs and processes them.

**Nostra Platform Example**:
```typescript
import { Worker } from 'bullmq';
import { executeTradeOnBlockchain } from '../services/TradeExecutionService';
import { websocketService } from '../services/WebSocketService';

// Create trade execution worker
const tradeWorker = new Worker('trade-execution', async (job) => {
  console.log(`⚡ Processing trade ${job.id} for user ${job.data.userId}`);
  console.log(`   Market: ${job.data.marketId}`);
  console.log(`   Action: ${job.data.side} ${job.data.shares} shares @ $${job.data.price}`);

  // Step 1: Prepare signed orders
  await job.updateProgress(20);
  const signedOrders = await prepareOrders(job.data);

  // Step 2: Execute on BSC Testnet blockchain
  await job.updateProgress(50);
  const txHash = await executeTradeOnBlockchain(signedOrders);
  console.log(`   TX broadcasted: ${txHash}`);

  // Step 3: Wait for confirmation
  await job.updateProgress(75);
  const receipt = await waitForConfirmation(txHash);

  // Step 4: Update database
  await job.updateProgress(90);
  await updateTradeInDatabase(job.data, receipt);

  // Done!
  await job.updateProgress(100);
  return {
    txHash,
    shares: job.data.shares,
    price: job.data.price,
    totalCost: job.data.totalCost
  };
}, {
  connection: { host: 'localhost', port: 6379 },
  concurrency: 10  // Process 10 trades simultaneously
});

// Listen to events
tradeWorker.on('completed', (job, result) => {
  console.log(`✅ Trade ${job.id} executed! TX: ${result.txHash}`);

  // Notify user via WebSocket
  websocketService.sendToUser(job.data.userId, {
    type: 'TRADE_COMPLETED',
    tradeId: job.id,
    txHash: result.txHash,
    message: `Successfully bought ${result.shares} shares for $${result.totalCost}`
  });

  // User sees: "Trade executed! ✅" in their browser
});

tradeWorker.on('failed', (job, error) => {
  console.error(`❌ Trade ${job.id} failed:`, error.message);

  // Notify user of failure
  websocketService.sendToUser(job.data.userId, {
    type: 'TRADE_FAILED',
    tradeId: job.id,
    error: error.message,
    message: 'Trade failed. Your funds have not been spent.'
  });

  // User sees: "Trade failed ❌" with error details
});

tradeWorker.on('progress', (job, progress) => {
  console.log(`🔄 Trade ${job.id}: ${progress}% complete`);

  // Send real-time progress to user
  websocketService.sendToUser(job.data.userId, {
    type: 'TRADE_PROGRESS',
    tradeId: job.id,
    progress,
    message: progress === 50 ? 'Broadcasting to blockchain...' :
             progress === 75 ? 'Waiting for confirmation...' :
             progress === 90 ? 'Updating balances...' : ''
  });

  // User sees progress bar updating in real-time
});
```

### **3. Broadcaster (Event Publisher)**

**What it is**: Component that publishes events to Redis when something happens.

**How it works**: BullMQ automatically broadcasts events when jobs are added, completed, or failed.

**Example** (Automatic - No code needed):
```typescript
// When you add a job, BullMQ automatically broadcasts:
await tradeQueue.add('execute-trade', { ... });
// Redis Pub/Sub: "queue:trade-execution:added" event

// When worker completes job, BullMQ automatically broadcasts:
return result;
// Redis Pub/Sub: "queue:trade-execution:completed" event
```

**Custom Broadcasting** (When needed for cross-service communication):
```typescript
// Worker needs to notify API servers about trade completion
import Redis from 'ioredis';

const redis = new Redis();

tradeWorker.on('completed', (job, result) => {
  // Broadcast to all API servers (10 instances)
  redis.publish('nostra:trade:completed', JSON.stringify({
    userId: job.data.userId,
    marketId: job.data.marketId,
    outcomeId: job.data.outcomeId,
    tradeId: job.id,
    txHash: result.txHash,
    shares: result.shares,
    price: result.price
  }));

  // All 10 API servers receive this event
  // Each server checks if user is connected to their WebSocket
  // Only the server with active WebSocket connection sends notification
});
```

### **4. Listener (Event Subscriber)**

**What it is**: Component that listens for events from Redis Pub/Sub.

**How it works**: Workers automatically listen for job events. You only need to define handlers.

**Example** (Automatic listening):
```typescript
// Workers automatically listen for new jobs
const worker = new Worker('trade-execution', async (job) => {
  // This runs automatically when a job is added!
  await processJob(job);
});

// You just define event handlers
worker.on('completed', (job) => {
  console.log('Job completed!');
});
```

**Custom Listening** (API servers listen for trade completions):
```typescript
// API Server (packages/api/src/services/WebSocketService.ts)
import Redis from 'ioredis';

const subscriber = new Redis();
subscriber.subscribe('nostra:trade:completed');

subscriber.on('message', (channel, message) => {
  const trade = JSON.parse(message);
  console.log(`📡 Trade completed event received: ${trade.tradeId}`);

  // Check if this user is connected to THIS API instance
  const userSocket = websocketService.getConnection(trade.userId);

  if (userSocket) {
    // User is connected to THIS server - send notification!
    userSocket.send(JSON.stringify({
      type: 'TRADE_COMPLETED',
      tradeId: trade.tradeId,
      txHash: trade.txHash,
      market: trade.marketId,
      outcome: trade.outcomeId,
      shares: trade.shares,
      price: trade.price,
      message: `Trade executed! TX: ${trade.txHash.slice(0, 10)}...`,
      explorerUrl: `https://testnet.bscscan.com/tx/${trade.txHash}`
    }));

    console.log(`✅ Notified user ${trade.userId} on this server`);

    // User's browser receives WebSocket message
    // UI updates: "Trade executed! ✅" with transaction link
  } else {
    // User not connected to this server (connected to another API instance)
    console.log(`⏭️  User ${trade.userId} not on this server, skipping`);
  }
});

// Real-world scenario:
// - User connected to API Server #3
// - Trade executes in Worker Service
// - Worker broadcasts to Redis channel
// - All 10 API servers receive event
// - API Server #3 has user's WebSocket → sends notification ✅
// - API Servers #1, #2, #4-10 don't have user → skip ⏭️
```

---

## 🎬 Complete Trade Execution Flow: Current vs BullMQ

### **Current Flow (Database Polling)** ❌

```
User Browser                API Server               Database                Transaction Processor
     │                          │                        │                            │
     │  "Buy 100 YES shares"    │                        │                            │
     ├─────────────────────────►│                        │                            │
     │                          │  INSERT INTO           │                            │
     │                          │  transaction_queue     │                            │
     │                          ├───────────────────────►│                            │
     │                          │                        │                            │
     │  HTTP 200 OK             │                        │                            │
     │◄─────────────────────────┤                        │                            │
     │  "Trade pending..."      │                        │                            │
     │                          │                        │                            │
     │  [User waits...]         │                        │    [Polling every 3s]      │
     │         ⏳               │                        │    "Any pending jobs?"     │
     │                          │                        │◄───────────────────────────┤
     │                          │                        │    SELECT * WHERE          │
     │                          │                        │    status='PENDING'        │
     │                          │                        │───────────────────────────►│
     │                          │                        │    No results              │
     │                          │                        │                            │
     │  [3 seconds pass...]     │                        │                            │
     │         ⏳               │                        │    "Any pending jobs?"     │
     │                          │                        │◄───────────────────────────┤
     │                          │                        │    SELECT * WHERE...       │
     │                          │                        │───────────────────────────►│
     │                          │                        │    Found 1 job! (finally)  │
     │                          │                        │                            │
     │                          │                        │    [Execute on blockchain] │
     │                          │                        │    [Wait 2-3 seconds]      │
     │                          │                        │    TX: 0xabc123... ✅      │
     │                          │                        │                            │
     │                          │                        │◄───────────────────────────┤
     │                          │                        │    UPDATE status=CONFIRMED │
     │                          │◄───────────────────────┤                            │
     │                          │    [Manual query]      │                            │
     │                          │                        │                            │
     │  [Still waiting...]      │                        │                            │
     │         ⏳               │                        │                            │
     │                          │                        │                            │

Total time: ~5-6 seconds (3s polling delay + 2-3s blockchain)
User experience: "Slow... is it working?" 😟
```

### **BullMQ Flow (Event-Driven)** ✅

```
User Browser           API Server #3          Redis Queue         Worker Service        Blockchain
     │                      │                      │                      │                    │
     │  "Buy 100 YES"       │                      │                      │                    │
     │  shares              │                      │                      │                    │
     ├─────────────────────►│                      │                      │                    │
     │                      │  queue.add()         │                      │                    │
     │                      │  (<1ms)              │                      │                    │
     │                      ├─────────────────────►│                      │                    │
     │                      │                      │  🔔 NEW JOB!         │                    │
     │  HTTP 200 OK         │                      │  (Instant notify)    │                    │
     │◄─────────────────────┤                      ├─────────────────────►│                    │
     │  "Executing..."      │                      │                      │  Execute trade     │
     │                      │                      │                      ├───────────────────►│
     │                      │                      │                      │  Sign TX           │
     │  WebSocket: 20%      │                      │                      │  Broadcast         │
     │◄─────────────────────┼──────────────────────┼──────────────────────┤  (2-3 seconds)     │
     │  "Preparing..."      │                      │                      │                    │
     │                      │                      │                      │                    │
     │  WebSocket: 50%      │                      │                      │  Waiting for TX    │
     │◄─────────────────────┼──────────────────────┼──────────────────────┤                    │
     │  "Broadcasting..."   │                      │                      │                    │
     │                      │                      │                      │                    │
     │                      │                      │                      │  Confirmed! ✅     │
     │                      │                      │                      │◄───────────────────┤
     │                      │                      │                      │  TX: 0xabc123...   │
     │                      │                      │                      │                    │
     │                      │  Redis Pub/Sub       │                      │  Broadcast event   │
     │                      │  "trade:completed"   │                      │  to all servers    │
     │                      │◄─────────────────────┼──────────────────────┤                    │
     │                      │  (Instant!)          │                      │                    │
     │                      │                      │                      │                    │
     │  WebSocket: 100%     │                      │                      │                    │
     │◄─────────────────────┤                      │                      │                    │
     │  "Trade executed!"   │                      │                      │                    │
     │  TX Link: 0xabc...   │                      │                      │                    │
     │         ✅           │                      │                      │                    │

Total time: ~2-3 seconds (just blockchain time, 0ms queue delay)
User experience: "Fast! I can see real-time progress!" 😊
```

---

## 🔧 Our 6 Background Jobs: BullMQ Migration Examples

### **Job 1: Price Snapshot Job** 📸

**Current Implementation** (node-cron):
```typescript
// api/src/jobs/priceSnapshotJob.ts
import cron from 'node-cron';

let cronJob = null;

export function startPriceSnapshotJob() {
  cronJob = cron.schedule('*/30 * * * * *', async () => {
    console.log('📸 Capturing price snapshots...');
    await PriceHistoryService.captureAllSnapshots();
  });
}

// Problems:
// ❌ Runs in API process (competes with HTTP requests)
// ❌ If API scales to 10 instances, runs 10 times
// ❌ No retry logic
// ❌ Hard to monitor
```

**BullMQ Implementation**:
```typescript
// packages/shared/src/queue/priceSnapshot.queue.ts
import { Queue, Worker } from 'bullmq';
import { connection } from './connection';
import { PriceHistoryService } from '../services/PriceHistoryService';

// Define Queue
export const priceSnapshotQueue = new Queue('price-snapshot', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,  // Keep last 100 completed
    removeOnFail: 500       // Keep last 500 failed for debugging
  }
});

// Schedule repeating job (runs once, not per instance)
export async function schedulePriceSnapshots() {
  await priceSnapshotQueue.add(
    'capture-snapshots',
    {},
    {
      repeat: {
        pattern: '*/30 * * * * *'  // Every 30 seconds
      },
      priority: 5  // Medium priority
    }
  );
  console.log('✅ Price snapshot job scheduled (every 30s)');
}

// Define Worker (only runs in worker service)
export const priceSnapshotWorker = new Worker(
  'price-snapshot',
  async (job) => {
    console.log(`📸 [${job.id}] Capturing price snapshots...`);

    const startTime = Date.now();
    const result = await PriceHistoryService.captureAllSnapshots();
    const duration = Date.now() - startTime;

    console.log(`✅ [${job.id}] Captured ${result.count} snapshots in ${duration}ms`);
    return result;
  },
  {
    connection,
    concurrency: 1  // Only 1 snapshot job at a time
  }
);

// Event listeners
priceSnapshotWorker.on('completed', (job, result) => {
  console.log(`✅ Price snapshot completed: ${result.count} outcomes`);
});

priceSnapshotWorker.on('failed', (job, error) => {
  console.error(`❌ Price snapshot failed:`, error.message);
  // Alert monitoring system
});

// Benefits:
// ✅ Runs ONLY in worker service (not in API)
// ✅ Only 1 instance runs, even with 10 API servers
// ✅ Automatic retries (3 attempts)
// ✅ Progress tracking
// ✅ Built-in monitoring
```

---

### **Job 2: Blockchain Sync** ⏰

**Current Implementation** (setInterval):
```typescript
// api/src/services/SyncService.ts
startPeriodicSync(intervalMs: number = 30000): NodeJS.Timeout {
  console.log('⏰ Starting periodic blockchain sync...');
  return setInterval(async () => {
    await this.syncFromBlockchain();
  }, intervalMs);
}

// Problems:
// ❌ Runs in API process
// ❌ No error handling
// ❌ Can't prioritize urgent syncs
// ❌ No visibility into sync status
```

**BullMQ Implementation**:
```typescript
// packages/shared/src/queue/blockchainSync.queue.ts
import { Queue, Worker } from 'bullmq';
import { connection } from './connection';
import { getSyncService } from '../services/SyncService';

// Define Queue
export const blockchainSyncQueue = new Queue('blockchain-sync', {
  connection
});

// Schedule periodic sync
export async function scheduleBlockchainSync() {
  await blockchainSyncQueue.add(
    'sync-blockchain',
    {},
    {
      repeat: { pattern: '*/30 * * * * *' },  // Every 30 seconds
      priority: 2  // High priority (after trades)
    }
  );
  console.log('✅ Blockchain sync scheduled (every 30s)');
}

// Worker
export const blockchainSyncWorker = new Worker(
  'blockchain-sync',
  async (job) => {
    console.log(`⏰ [${job.id}] Syncing blockchain state...`);

    const syncService = getSyncService();
    const result = await syncService.syncFromBlockchain();

    console.log(`✅ [${job.id}] Synced ${result.newBlocks} blocks, ${result.newTrades} trades`);
    return result;
  },
  {
    connection,
    concurrency: 1  // Only sync one at a time
  }
);

// Allow on-demand urgent syncs
export async function triggerUrgentSync() {
  await blockchainSyncQueue.add(
    'urgent-sync',
    {},
    { priority: 1 }  // Highest priority - process immediately
  );
}

blockchainSyncWorker.on('completed', (job, result) => {
  console.log(`✅ Blockchain sync: ${result.newBlocks} blocks, ${result.newTrades} trades`);

  // If critical updates, broadcast to API servers
  if (result.newTrades > 0) {
    redis.publish('blockchain:updated', JSON.stringify(result));
  }
});

blockchainSyncWorker.on('failed', (job, error) => {
  console.error(`❌ Blockchain sync failed:`, error.message);

  // Critical failure - alert immediately
  if (job.attemptsMade >= 3) {
    alertMonitoring('CRITICAL: Blockchain sync failing', error);
  }
});

// Benefits:
// ✅ Separated from API
// ✅ Can trigger urgent syncs
// ✅ Automatic retries
// ✅ Broadcasts updates to API servers
```

---

### **Job 3: Transaction Processor** ⚡

**Current Implementation** (setInterval polling):
```typescript
// api/src/services/TransactionProcessor.ts
start(): void {
  this.intervalId = setInterval(() => {
    this.processQueue();
  }, 3000);  // Check every 3 seconds
}

private async processQueue(): Promise<void> {
  const pending = await transactionQueueRepository.getPending(5);
  for (const tx of pending) {
    await this.processTransaction(tx);
  }
}

// Problems:
// ❌ Polls database every 3 seconds (wasted queries)
// ❌ Up to 3 second delay before processing
// ❌ Can't handle burst traffic (only 5 at a time)
// ❌ Complex state management in database
```

**BullMQ Implementation**:
```typescript
// packages/shared/src/queue/tradeExecution.queue.ts
import { Queue, Worker } from 'bullmq';
import { connection } from './connection';
import { executeTradeOnBlockchain } from '../services/TradeExecutionService';

// Define Queue
export const tradeExecutionQueue = new Queue('trade-execution', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: 5000
  }
});

// Worker
export const tradeExecutionWorker = new Worker(
  'trade-execution',
  async (job) => {
    console.log(`⚡ [${job.id}] Executing trade for user ${job.data.userId}...`);

    const { orderPairs, outcomeId, userId } = job.data;

    // Update progress
    await job.updateProgress(10); // Preparing transaction

    const result = await executeTradeOnBlockchain(orderPairs, outcomeId);

    await job.updateProgress(100); // Complete

    console.log(`✅ [${job.id}] Trade executed: ${result.txHash}`);
    return result;
  },
  {
    connection,
    concurrency: 10  // Process 10 trades in parallel
  }
);

// Event listeners
tradeExecutionWorker.on('completed', (job, result) => {
  console.log(`✅ Trade completed: ${result.txHash}`);

  // Broadcast to API servers (for WebSocket notifications)
  redis.publish('trade:completed', JSON.stringify({
    userId: job.data.userId,
    tradeId: job.id,
    txHash: result.txHash,
    outcomeId: job.data.outcomeId
  }));

  // Trigger immediate price snapshot for this outcome
  priceSnapshotQueue.add('capture-snapshot', {
    outcomeId: job.data.outcomeId,
    urgent: true
  }, {
    priority: 1  // Process immediately
  });
});

tradeExecutionWorker.on('failed', (job, error) => {
  console.error(`❌ Trade failed:`, error.message);

  // Notify user via WebSocket
  redis.publish('trade:failed', JSON.stringify({
    userId: job.data.userId,
    tradeId: job.id,
    error: error.message
  }));
});

tradeExecutionWorker.on('progress', (job, progress) => {
  console.log(`🔄 Trade ${job.id}: ${progress}% complete`);

  // Send progress update to user
  redis.publish('trade:progress', JSON.stringify({
    userId: job.data.userId,
    tradeId: job.id,
    progress
  }));
});

// API endpoint usage
// packages/api/src/routes/trade.ts
import { tradeExecutionQueue } from '@nostra/shared/queue';

router.post('/execute', async (req, res) => {
  const { orderPairs, outcomeId } = req.body;

  // Add job to queue (INSTANT response to user)
  const job = await tradeExecutionQueue.add('execute-trade', {
    userId: req.user.id,
    orderPairs,
    outcomeId
  }, {
    priority: 1  // Trades are highest priority
  });

  // Return immediately (don't wait for blockchain)
  res.json({
    success: true,
    jobId: job.id,
    message: 'Trade queued for execution'
  });

  // User receives updates via WebSocket as job progresses
});

// Benefits:
// ✅ INSTANT API response (job queued in <1ms)
// ✅ No database polling
// ✅ 10 parallel trades (not 5 sequential)
// ✅ Real-time progress updates
// ✅ Automatic retries
```

---

### **Job 4: Batch Processor** 🏭

**Current Implementation** (setInterval polling):
```typescript
// api/src/services/BatchProcessor.ts
public start() {
  this.interval = setInterval(() => this.processQueue(), 5000);
}

private async processQueue() {
  const job = await prisma.batchJob.findFirst({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' }
  });

  if (job) {
    await this.processMarketCreation(job);
  }
}

// Problems:
// ❌ Polls every 5 seconds
// ❌ Only processes 1 job at a time
// ❌ No progress tracking
// ❌ Hard to monitor batch status
```

**BullMQ Implementation**:
```typescript
// packages/shared/src/queue/marketCreation.queue.ts
import { Queue, Worker } from 'bullmq';
import { connection } from './connection';
import { createMarketOnBlockchain } from '../services/MarketCreationService';

// Define Queue
export const marketCreationQueue = new Queue('market-creation', {
  connection
});

// Worker
export const marketCreationWorker = new Worker(
  'market-creation',
  async (job) => {
    console.log(`🏭 [${job.id}] Creating market batch...`);

    const { name, outcomes, categoryId, imageUrl } = job.data;
    const totalMarkets = outcomes.length;

    await job.updateProgress(0);

    const results = [];
    for (let i = 0; i < outcomes.length; i++) {
      const outcome = outcomes[i];

      // Create market on blockchain
      const result = await createMarketOnBlockchain({
        name,
        outcome,
        categoryId,
        imageUrl
      });

      results.push(result);

      // Update progress
      const progress = Math.round(((i + 1) / totalMarkets) * 100);
      await job.updateProgress(progress);

      console.log(`📊 Progress: ${i + 1}/${totalMarkets} markets created`);
    }

    return {
      totalCreated: results.length,
      markets: results
    };
  },
  {
    connection,
    concurrency: 3  // Process 3 batch jobs in parallel
  }
);

marketCreationWorker.on('progress', (job, progress) => {
  console.log(`🏭 Batch ${job.id}: ${progress}% complete`);

  // Broadcast progress to admin dashboard
  redis.publish('batch:progress', JSON.stringify({
    batchId: job.id,
    progress
  }));
});

marketCreationWorker.on('completed', (job, result) => {
  console.log(`✅ Batch completed: ${result.totalCreated} markets created`);

  // Notify admin
  redis.publish('batch:completed', JSON.stringify({
    batchId: job.id,
    result
  }));
});

// API endpoint usage
// packages/api/src/routes/batch.ts
router.post('/create-markets', async (req, res) => {
  const { name, outcomes, categoryId, imageUrl } = req.body;

  // Add job to queue
  const job = await marketCreationQueue.add('create-market-batch', {
    name,
    outcomes,
    categoryId,
    imageUrl
  }, {
    priority: 7  // Low priority (not urgent)
  });

  res.json({
    success: true,
    batchId: job.id,
    message: 'Batch creation started'
  });
});

// Benefits:
// ✅ Real-time progress updates (shown in admin UI)
// ✅ Multiple batches in parallel
// ✅ No database polling
// ✅ Better monitoring
```

---

### **Job 5: Cleanup Job** 🧹

**Current Implementation** (node-cron):
```typescript
// api/src/jobs/priceSnapshotJob.ts
let cleanupJob = null;

export function startCleanupJob(daysToKeep: number = 90) {
  cleanupJob = cron.schedule('0 2 * * 0', async () => {
    console.log('🧹 Cleaning up old price history data...');
    await PriceHistoryService.cleanupOldData(daysToKeep);
  });
}

// Problems:
// ❌ Runs in API process
// ❌ No monitoring of cleanup progress
// ❌ Can't see what was deleted
```

**BullMQ Implementation**:
```typescript
// packages/shared/src/queue/cleanup.queue.ts
import { Queue, Worker } from 'bullmq';
import { connection } from './connection';
import { PriceHistoryService } from '../services/PriceHistoryService';

// Define Queue
export const cleanupQueue = new Queue('cleanup', {
  connection
});

// Schedule weekly cleanup
export async function scheduleCleanup() {
  await cleanupQueue.add(
    'cleanup-old-data',
    { daysToKeep: 90 },
    {
      repeat: {
        pattern: '0 2 * * 0'  // Sundays at 2 AM
      },
      priority: 10  // Lowest priority
    }
  );
  console.log('✅ Cleanup job scheduled (weekly, Sundays at 2 AM)');
}

// Worker
export const cleanupWorker = new Worker(
  'cleanup',
  async (job) => {
    console.log(`🧹 [${job.id}] Starting cleanup...`);

    const { daysToKeep } = job.data;
    const startTime = Date.now();

    // Cleanup old price history
    await job.updateProgress(30);
    const priceHistoryDeleted = await PriceHistoryService.cleanupOldData(daysToKeep);

    // Cleanup old transaction queue
    await job.updateProgress(60);
    const transactionQueueDeleted = await transactionQueueRepository.cleanupOld(30);

    // Cleanup old batch jobs
    await job.updateProgress(90);
    const batchJobsDeleted = await batchJobRepository.cleanupOld(30);

    const duration = Date.now() - startTime;

    return {
      priceHistoryDeleted,
      transactionQueueDeleted,
      batchJobsDeleted,
      duration
    };
  },
  {
    connection,
    concurrency: 1
  }
);

cleanupWorker.on('completed', (job, result) => {
  console.log('✅ Cleanup completed:');
  console.log(`   - Price history: ${result.priceHistoryDeleted} records deleted`);
  console.log(`   - Transaction queue: ${result.transactionQueueDeleted} records deleted`);
  console.log(`   - Batch jobs: ${result.batchJobsDeleted} records deleted`);
  console.log(`   - Duration: ${result.duration}ms`);

  // Alert monitoring system with cleanup stats
  alertMonitoring('Cleanup completed', result);
});

// Benefits:
// ✅ Detailed cleanup stats
// ✅ Progress tracking
// ✅ Monitoring alerts
// ✅ Separated from API
```

---

### **Job 6: WebSocket Heartbeat** 💓

**Current Implementation** (setInterval):
```typescript
// api/src/services/WebSocketService.ts
this.heartbeatInterval = setInterval(() => {
  this.clients.forEach((client) => {
    if (!client.isAlive) client.terminate();
    client.isAlive = false;
    client.ping();
  });
}, 30000);

// This should STAY as-is!
// ✅ WebSocket heartbeat needs to run in API process
// ✅ Checks connection status of clients connected to THIS instance
// ✅ Not suitable for job queue (needs to be per-instance)
```

**Recommendation**: **KEEP AS-IS** ✅

WebSocket heartbeat should remain in the API process because:
- Each API instance needs to ping its own connected clients
- Not a background job (it's connection management)
- Latency-sensitive (needs immediate response)
- Instance-specific (not shared across workers)

---

## 📊 Performance Comparison

### **Current System (Database Polling)**

| Job | Interval | DB Queries/Hour | Delay | Issues |
|-----|----------|----------------|-------|--------|
| Price Snapshot | 30s | 120 | 0-30s | Runs 10x with 10 API instances |
| Blockchain Sync | 30s | 120 | 0-30s | High DB load |
| Transaction Processor | 3s | 1,200 | 0-3s | Constant polling |
| Batch Processor | 5s | 720 | 0-5s | Slow progress tracking |
| **TOTAL** | - | **2,160/hour** | - | **Database overload** |

**At scale (10 API instances)**:
- Total DB queries: **21,600/hour** (6 queries/second!)
- Database IOPS cost: ~$50/month
- Average job delay: 2 seconds

### **BullMQ System (Event-Driven)**

| Job | Trigger | Redis Operations | Delay | Benefits |
|-----|---------|-----------------|-------|----------|
| Price Snapshot | Event | 2/execution | 0ms | Instant processing |
| Blockchain Sync | Event | 2/execution | 0ms | Only when needed |
| Transaction Processor | Event | 2/execution | 0ms | Real-time |
| Batch Processor | Event | 2/execution | 0ms | Progress tracking |
| **TOTAL** | - | **~240/hour** | - | **90% reduction** |

**At scale (10 API instances + 1 worker)**:
- Total operations: **240/hour** (0.07 ops/second)
- Redis cost: ~$13/month
- Average job delay: 0ms (instant)
- **Savings: $37/month + 10x better performance**

---

## 🚀 Migration Strategy

### **Phase 1: Setup Infrastructure** (1 hour)

```bash
# Install BullMQ
yarn workspace @nostra/shared add bullmq ioredis

# Add Redis to environment
echo "REDIS_URL=redis://localhost:6379" >> .env

# Start Redis locally
docker run -d -p 6379:6379 redis:7-alpine
```

### **Phase 2: Create Shared Queue Infrastructure** (2 hours)

```typescript
// packages/shared/src/queue/connection.ts
import Redis from 'ioredis';

export const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// packages/shared/src/queue/index.ts
export * from './priceSnapshot.queue';
export * from './blockchainSync.queue';
export * from './tradeExecution.queue';
export * from './marketCreation.queue';
export * from './cleanup.queue';
```

### **Phase 3: Migrate One Job (Proof of Concept)** (2 hours)

Start with **Transaction Processor** (highest impact):

```typescript
// packages/shared/src/queue/tradeExecution.queue.ts
import { Queue, Worker } from 'bullmq';
import { connection } from './connection';

export const tradeExecutionQueue = new Queue('trade-execution', {
  connection
});

export const tradeExecutionWorker = new Worker(
  'trade-execution',
  async (job) => {
    // Migrate processTransaction logic here
    await executeTradeOnBlockchain(job.data);
  },
  { connection, concurrency: 10 }
);

// packages/worker/src/index.ts
import { tradeExecutionWorker } from '@nostra/shared/queue';

console.log('✅ Trade execution worker started');

// Test it works, then migrate other jobs
```

### **Phase 4: Migrate Remaining Jobs** (4-6 hours)

One by one, migrate:
1. ✅ Transaction Processor (done in Phase 3)
2. Price Snapshot Job
3. Blockchain Sync
4. Batch Processor
5. Cleanup Job

### **Phase 5: Add Monitoring Dashboard** (1 hour)

```bash
# Install Bull Board (monitoring UI)
yarn add @bull-board/express @bull-board/api

# Access at http://localhost:4001/admin/queues
```

```typescript
// packages/api/src/routes/admin.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(tradeExecutionQueue),
    new BullMQAdapter(priceSnapshotQueue),
    new BullMQAdapter(blockchainSyncQueue),
    new BullMQAdapter(marketCreationQueue),
    new BullMQAdapter(cleanupQueue)
  ],
  serverAdapter
});

app.use('/admin/queues', serverAdapter.getRouter());
```

---

## 🎓 Learning Resources

### **Official Documentation**
- BullMQ Docs: https://docs.bullmq.io/
- Redis Documentation: https://redis.io/docs/
- Bull Board (UI): https://github.com/felixmosh/bull-board

### **Video Tutorials**
- BullMQ Crash Course: https://www.youtube.com/watch?v=oUJbuFMyBDk
- Redis Pub/Sub Explained: https://www.youtube.com/watch?v=Gho0ojr-WGo

### **Example Projects**
- BullMQ Examples: https://github.com/taskforcesh/bullmq/tree/master/docs/gitbook/patterns
- Real-world implementations: https://github.com/topics/bullmq

---

## 📝 Summary

### **What is BullMQ?**
✅ Redis-based job queue system
✅ Event-driven (no database polling)
✅ Industry standard (used by Stripe, Shopify, Uber)

### **Why Do We Need It?**
✅ 90% reduction in database queries
✅ Instant job processing (0ms delay)
✅ Better scalability (millions of jobs/second)
✅ Built-in monitoring and debugging

### **What Are Broadcaster/Listener?**
✅ Automatic in BullMQ (no manual setup needed)
✅ Redis Pub/Sub for worker coordination
✅ Only customize for cross-service communication

### **Migration Effort**
⏱️ **10-15 hours total**
📊 **ROI: ~$40/month savings + 10x better performance**
🎯 **Break-even: Immediately (better UX + reliability)**

---

## Comments

### @linked0 — 2026-02-02T11:18:39Z

This is exactly what we've been looking for. Thanks! Given the performance benefits, it looks like we need to apply this as soon as possible.

---

### @Abdulkarim4u — 2026-02-02T11:21:57Z

yes exactly, my old company thats how we used to do it from scratch for both testnet and production, so there would be no need to redo it when launching.

---

