/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║       function* and async function* — Complete Guide        ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    CONCEPT SUMMARY                          │
 * ├─────────────────────────────────────────────────────────────┤
 * │                                                             │
 * │  Normal function:       runs → returns ONE value → done     │
 * │  Generator function*:   runs → yields MANY values → done    │
 * │  Async function:        runs → awaits → returns ONE value   │
 * │  Async function*:       runs → awaits → yields MANY → done  │
 * │                                                             │
 * │  ── Why use generators? ──                                  │
 * │                                                             │
 * │  1. Lazy evaluation: produce values on demand, not all      │
 * │     at once. Good for large/infinite sequences.             │
 * │  2. Streaming: process data as it arrives (API responses,   │
 * │     file reading, WebSocket messages).                      │
 * │  3. Pause/resume: generator pauses at each yield and        │
 * │     resumes when consumer calls .next().                    │
 * │  4. Memory efficient: only one value in memory at a time.   │
 * │                                                             │
 * │  ── TypeScript types ──                                     │
 * │                                                             │
 * │  Generator<TYield, TReturn, TNext>                          │
 * │    TYield  = type of values coming OUT  (via yield)         │
 * │    TReturn = type of final value        (via return)        │
 * │    TNext   = type of values going IN    (via .next(val))    │
 * │                                                             │
 * │  AsyncGenerator<TYield, TReturn, TNext>                     │
 * │    Same, but each .next() returns a Promise.                │
 * │                                                             │
 * │  ── Analogy ──                                              │
 * │                                                             │
 * │  Normal function = vending machine (put money in, get one   │
 * │    item out)                                                │
 * │  Generator = conveyor belt (keeps pushing items out one     │
 * │    by one, you take each when ready)                        │
 * │  Async generator = conveyor belt that sometimes pauses      │
 * │    to wait for the next item to be manufactured             │
 * │                                                             │
 * └─────────────────────────────────────────────────────────────┘
 */

// ─────────────────────────────────────────────────────────────
// EXAMPLE 1: Basic function* (synchronous generator)
// ─────────────────────────────────────────────────────────────
// The simplest generator. yields values one at a time.
// The function PAUSES at each yield and RESUMES on .next().

function* countUpTo(max: number): Generator<number, string, unknown> {
  //                                         ↑       ↑       ↑
  //                                      TYield  TReturn  TNext
  for (let i = 1; i <= max; i++) {
    yield i;             // TYield: number — pauses here, sends i out
  }
  return "done counting"; // TReturn: string — final value when finished
}

async function demo1() {
  console.log("═══ EXAMPLE 1: Basic function* ═══\n");

  const gen = countUpTo(3);

  // Manual iteration with .next()
  console.log("  gen.next() =", gen.next());  // { value: 1, done: false }
  console.log("  gen.next() =", gen.next());  // { value: 2, done: false }
  console.log("  gen.next() =", gen.next());  // { value: 3, done: false }
  console.log("  gen.next() =", gen.next());  // { value: "done counting", done: true }
  //                                                  ↑ TReturn           ↑ finished!

  // Or use for...of (ignores the return value, only gets yields)
  console.log("\n  for...of:");
  for (const n of countUpTo(3)) {
    console.log(`    yielded: ${n}`);
  }
  console.log();
}


// ─────────────────────────────────────────────────────────────
// EXAMPLE 2: Infinite generator (lazy evaluation)
// ─────────────────────────────────────────────────────────────
// Generators can represent infinite sequences because they
// only compute the next value when asked.

function* fibonacci(): Generator<number> {
  let a = 0, b = 1;
  while (true) {       // infinite loop — but it's fine!
    yield a;           // pauses here each time
    [a, b] = [b, a + b];
  }
  // No return — Generator<number, void, unknown> implicitly
}

async function demo2() {
  console.log("═══ EXAMPLE 2: Infinite generator (fibonacci) ═══\n");

  const fib = fibonacci();
  const first10: number[] = [];

  for (let i = 0; i < 10; i++) {
    first10.push(fib.next().value as number);
  }
  console.log(`  First 10: [${first10.join(", ")}]`);

  // Helper: take N items from any generator
  function take<T>(n: number, gen: Generator<T>): T[] {
    const result: T[] = [];
    for (const val of gen) {
      result.push(val);
      if (result.length >= n) break;
    }
    return result;
  }

  console.log(`  take(7):  [${take(7, fibonacci()).join(", ")}]`);
  console.log();
}


// ─────────────────────────────────────────────────────────────
// EXAMPLE 3: Sending values INTO a generator (TNext)
// ─────────────────────────────────────────────────────────────
// yield is a two-way street:
//   - it sends a value OUT to the consumer
//   - it receives a value IN from the consumer via .next(val)

function* accumulator(): Generator<number, string, number> {
  //                               TYield  TReturn  TNext
  let total = 0;

  while (true) {
    const received = yield total;  // send total OUT, receive number IN
    //    ↑ TNext                    ↑ TYield

    if (received < 0) {
      return `final total: ${total}`; // TReturn — ends the generator
    }
    total += received;
  }
}

async function demo3() {
  console.log("═══ EXAMPLE 3: Two-way communication (TNext) ═══\n");

  const acc = accumulator();

  console.log("  .next()    =", acc.next());       // { value: 0, done: false } — first call, no input
  console.log("  .next(10)  =", acc.next(10));      // { value: 10, done: false }
  console.log("  .next(20)  =", acc.next(20));      // { value: 30, done: false }
  console.log("  .next(5)   =", acc.next(5));       // { value: 35, done: false }
  console.log("  .next(-1)  =", acc.next(-1));      // { value: "final total: 35", done: true }
  console.log();
}


// ─────────────────────────────────────────────────────────────
// EXAMPLE 4: async function* (the real deal)
// ─────────────────────────────────────────────────────────────
// Combines async (can await) + generator (can yield).
// Perfect for streaming data from APIs, databases, files.

interface StreamEvent {
  type: "chunk" | "status" | "error";
  data: string;
  timestamp: number;
}

// Simulates an LLM streaming response
async function* streamLLMResponse(
  prompt: string
): AsyncGenerator<StreamEvent, { reason: string; totalChunks: number }> {
  //               TYield: StreamEvent
  //               TReturn: { reason, totalChunks }

  const words = prompt.split(" ");
  let chunkCount = 0;

  yield {                               // yield #1: status event
    type: "status",
    data: "connected",
    timestamp: Date.now(),
  };

  for (const word of words) {
    await sleep(100);                   // simulate network delay
    chunkCount++;

    yield {                             // yield N: chunk events
      type: "chunk",
      data: word,
      timestamp: Date.now(),
    };
  }

  return {                              // TReturn: why it ended
    reason: "complete",
    totalChunks: chunkCount,
  };
}

async function demo4() {
  console.log("═══ EXAMPLE 4: async function* (LLM streaming) ═══\n");

  const stream = streamLLMResponse("The quick brown fox jumps");

  // for await...of — the async version of for...of
  for await (const event of stream) {
    if (event.type === "status") {
      console.log(`  [STATUS] ${event.data}`);
    } else {
      console.log(`  [CHUNK]  "${event.data}"`);
    }
  }

  // Note: for await...of doesn't capture the return value.
  // To get TReturn, you need manual iteration:
  console.log("\n  Manual iteration (captures return value):\n");

  const stream2 = streamLLMResponse("Hello world");
  let result: IteratorResult<StreamEvent, { reason: string; totalChunks: number }>;

  do {
    result = await stream2.next();
    if (!result.done) {
      console.log(`  [${result.value.type.toUpperCase()}] ${result.value.data}`);
    } else {
      console.log(`  [DONE] reason=${result.value.reason}, chunks=${result.value.totalChunks}`);
    }
  } while (!result.done);

  console.log();
}


// ─────────────────────────────────────────────────────────────
// EXAMPLE 5: Composing generators (yield*)
// ─────────────────────────────────────────────────────────────
// yield* delegates to another generator — like calling a
// sub-function, but for generators.

function* letters(): Generator<string> {
  yield "a";
  yield "b";
  yield "c";
}

function* numbers(): Generator<string> {
  yield "1";
  yield "2";
  yield "3";
}

function* combined(): Generator<string> {
  yield "[start]";
  yield* letters();   // delegates: yields a, b, c from letters()
  yield "[middle]";
  yield* numbers();   // delegates: yields 1, 2, 3 from numbers()
  yield "[end]";
}

async function demo5() {
  console.log("═══ EXAMPLE 5: Composing with yield* ═══\n");

  for (const val of combined()) {
    console.log(`  ${val}`);
  }
  console.log();
}


// ─────────────────────────────────────────────────────────────
// EXAMPLE 6: Real-world pattern — paginated API fetching
// ─────────────────────────────────────────────────────────────
// This is why async generators exist in practice.

interface User { id: number; name: string; }

// Simulated paginated API
async function fetchPage(page: number): Promise<{ users: User[]; hasMore: boolean }> {
  await sleep(80);
  const allUsers: User[] = [
    { id: 1, name: "Alice" }, { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" }, { id: 4, name: "Diana" },
    { id: 5, name: "Eve" },
  ];
  const pageSize = 2;
  const start = (page - 1) * pageSize;
  return {
    users: allUsers.slice(start, start + pageSize),
    hasMore: start + pageSize < allUsers.length,
  };
}

// The consumer doesn't need to know about pagination at all!
async function* getAllUsers(): AsyncGenerator<User> {
  let page = 1;
  while (true) {
    const { users, hasMore } = await fetchPage(page);
    for (const user of users) {
      yield user;        // yield one user at a time
    }
    if (!hasMore) return; // done — no more pages
    page++;
  }
}

async function demo6() {
  console.log("═══ EXAMPLE 6: Paginated API (real-world) ═══\n");

  // Clean consumer code — no pagination logic leaked!
  for await (const user of getAllUsers()) {
    console.log(`  User #${user.id}: ${user.name}`);
  }
  console.log();
}


// ─────────────────────────────────────────────────────────────
// EXAMPLE 7: The Claude Code pattern — agent loop
// ─────────────────────────────────────────────────────────────
// This is the pattern from the leaked source.
// An agent that yields events as it works, then returns
// a terminal reason.

type AgentEvent =
  | { type: "thinking"; content: string }
  | { type: "tool_call"; tool: string; args: string }
  | { type: "tool_result"; tool: string; result: string }
  | { type: "response"; content: string };

type Terminal = { reason: "complete" | "max_turns" | "error"; turns: number };

async function* agentLoop(
  userMessage: string,
  maxTurns: number = 3,
): AsyncGenerator<AgentEvent, Terminal> {
  //               ↑ yielded events  ↑ final status
  let turn = 0;

  while (turn < maxTurns) {
    turn++;

    // Think
    yield { type: "thinking", content: `Analyzing: "${userMessage}" (turn ${turn})` };
    await sleep(50);

    // Decide if we need a tool
    if (turn === 1 && userMessage.includes("file")) {
      yield { type: "tool_call", tool: "read_file", args: "index.ts" };
      await sleep(100);
      yield { type: "tool_result", tool: "read_file", result: "file contents..." };
    }

    // Respond
    if (turn >= 2 || !userMessage.includes("file")) {
      yield { type: "response", content: `Here's my answer about "${userMessage}"` };
      return { reason: "complete", turns: turn };
    }
  }

  return { reason: "max_turns", turns: turn };
}

async function demo7() {
  console.log("═══ EXAMPLE 7: Agent loop (Claude Code pattern) ═══\n");

  // With for await — clean but loses the return value
  console.log("  Query: 'read the file'\n");

  const agent = agentLoop("read the file");
  let finalResult: Terminal | undefined;

  while (true) {
    const { value, done } = await agent.next();
    if (done) {
      finalResult = value;
      break;
    }
    const event = value;
    switch (event.type) {
      case "thinking":
        console.log(`  🧠 ${event.content}`);
        break;
      case "tool_call":
        console.log(`  🔧 Calling ${event.tool}(${event.args})`);
        break;
      case "tool_result":
        console.log(`  📄 ${event.tool} → ${event.result}`);
        break;
      case "response":
        console.log(`  💬 ${event.content}`);
        break;
    }
  }

  console.log(`\n  Terminal: reason=${finalResult!.reason}, turns=${finalResult!.turns}`);
  console.log();
}


// ─────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// ─────────────────────────────────────────────────────────────
// Run all demos
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log();
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║     function* and async function* — 7 Examples              ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log();

  await demo1();   // Basic function*
  await demo2();   // Infinite generator
  await demo3();   // Two-way communication (TNext)
  await demo4();   // async function* (LLM streaming)
  await demo5();   // Composing with yield*
  await demo6();   // Paginated API (real-world)
  await demo7();   // Agent loop (Claude Code pattern)

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                     CHEAT SHEET                             ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║                                                              ║");
  console.log("║  function*        → Generator<TYield, TReturn, TNext>       ║");
  console.log("║  async function*  → AsyncGenerator<TYield, TReturn, TNext>  ║");
  console.log("║                                                              ║");
  console.log("║  yield value      → sends value OUT, pauses                  ║");
  console.log("║  yield* other()   → delegates to another generator           ║");
  console.log("║  return value     → ends generator, sends TReturn            ║");
  console.log("║                                                              ║");
  console.log("║  for...of         → consumes sync generator (loses TReturn)  ║");
  console.log("║  for await...of   → consumes async generator (loses TReturn) ║");
  console.log("║  .next()          → manual step (captures everything)        ║");
  console.log("║  .next(val)       → manual step + sends TNext value in       ║");
  console.log("║                                                              ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log();
}

main().catch(console.error);
