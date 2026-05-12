# Source Map Leak Demo Project (2026-04-02)

> **Category**: Research
>
> Built a hands-on demo project reproducing the Claude Code npm source map leak incident (2026-03-31) — showing how `.map` files in production packages expose full original source code, and how to prevent it.

---

## What was done

- Created a TypeScript project simulating a proprietary AI agent system with internal prompts, tool routing, and orchestration logic — mimicking the structure exposed in the Claude Code leak
- Built `build:vulnerable` script that compiles with `sourceMap` + `inlineSources` enabled, embedding full original TypeScript in `.map` files
- Created `extract-from-sourcemap.js` — reads `.map` files, parses `sourcesContent`, and prints the complete recovered source code
- Built `strip-sourcemaps.js` — the fix script that deletes `.map` files and strips `sourceMappingURL` references from compiled JS
- Added `compare-packages.js` to inspect `.tgz` package contents and flag included source maps
- Verified both vulnerable and safe build paths work end-to-end

## Techniques & Learnings

- **Source map structure**: `.map` files are JSON with a `sourcesContent` array containing full original source as strings — trivial to extract with a few lines of JS.
- **TypeScript's `inlineSources`**: This `tsconfig` option embeds original TS directly in source maps, making recovery even easier than following `sources` file paths.
- **Defense layers**: Multiple independent safeguards are needed — `.npmignore`, build scripts, `package.json` `files` allowlist, and CI/CD checks. Any single one can fail silently.
- **"Open source" vs. open source**: Publishing plugin systems and configuration templates while keeping core logic proprietary is a common pattern — the source map leak revealed the gap between the two.

---

## How Source Map Deciphering Works

### Anatomy of a `.map` file

A source map is just JSON. Every field plays a role in mapping compiled output back to the original source:

```json
{
  "version":        3,                          // always 3 (current spec)
  "file":           "templates.js",              // compiled output filename
  "sources":        ["../../src/prompts/templates.ts"], // original file path(s)
  "names":          [],                          // original variable/function names
  "mappings":       "AAAA;GAMG;AAEU,QAAA...",    // Base64 VLQ encoded positions
  "sourcesContent": ["full original source..."]  // THE JACKPOT
}
```

Two independent ways to recover the original code from this structure exist. The Claude Code leak exposed **both**.

### Method 1 (EASY): `sourcesContent`

The `sourcesContent` array contains the **complete original source files as plain strings**. No decoding. No reverse engineering. One line of code:

```js
// That's it. The entire original TypeScript file.
const original = JSON.parse(fs.readFileSync("templates.js.map")).sourcesContent[0];
```

This is what the Claude Code incident exposed. The `.map` files shipped in the npm package had every internal TypeScript file — system prompts, agent orchestration, tool routing — embedded verbatim in this field.

### Method 2 (HARD): `mappings` (Base64 VLQ)

Even without `sourcesContent`, the `mappings` field encodes a precise position-by-position mapping from every character in the compiled JS back to the original source. It uses **Base64 VLQ** (Variable-Length Quantity) encoding.

**Step 1 — delimiters**:
- `,` segment separator (multiple mappings on one line)
- `;` line separator (each `;` = next line in compiled JS)

**Step 2 — decode Base64 VLQ**: each segment (e.g. `AAEU`) is a sequence of Base64 characters. Each character encodes 6 bits:

| Bit | Purpose |
|-----|---------|
| Bit 6 (highest) | Continuation flag — is there another character after this? |
| Bits 1-5 | Data payload — 5 bits of the actual number |
| Bit 1 (first char only) | Sign bit — 0 = positive, 1 = negative |

Base64 alphabet: `A`=0, `B`=1, ..., `Z`=25, `a`=26, ..., `z`=51, `0`=52, ..., `9`=61, `+`=62, `/`=63.

**Step 3 — interpret deltas**: each decoded segment produces 4 or 5 numbers, all relative to the previous segment:

| Position | Meaning |
|----------|---------|
| `[0]` | Generated column (in compiled `.js`) |
| `[1]` | Source file index (which original file in `sources` array) |
| `[2]` | Original line (in original `.ts`) |
| `[3]` | Original column (in original `.ts`) |
| `[4]` | Names index (optional — into the `names` array) |

By walking every segment in the `mappings` string, you reconstruct a complete line-by-line, column-by-column correspondence between compiled output and original source. Combined with the `names` array, an attacker can recover significant structure even without `sourcesContent`.

### Why source maps exist at all

Source maps exist for one reason: **debugging**. When your production app crashes, the browser shows you something useless:

```
Error at dist/bundle.min.js:1:24853
```

Line 1, column 24,853 of a minified file. Impossible to debug. With a source map, the browser's DevTools reads the `mappings` and translates:

```
dist/bundle.min.js:1:24853  →  src/auth/login.ts:42:8
```

Tools that use mappings:

| Tool | Uses mappings for |
|------|-------------------|
| Chrome DevTools | Show original source in debugger, set breakpoints in `.ts` files |
| Error monitoring (Sentry, etc.) | Convert minified stack traces to readable ones |
| Node.js `--enable-source-maps` | Show original file/line in server-side errors |

Source maps were designed for **development environments**. The mistake is shipping them to production where anyone can read them.

### Why `sourcesContent` is the real vulnerability

In an npm package, you typically only get:

```
node_modules/some-package/
  dist/
    index.js          ← compiled JS
    index.js.map      ← source map
    index.d.ts        ← type declarations
```

The `src/` folder with original `.ts` files is **not shipped**. So the `sources` field pointing to `"../../src/prompts/templates.ts"` is a dead path. That's exactly why `sourcesContent` is the critical field:

| Field | Points to | Available in npm package? |
|-------|-----------|---------------------------|
| `sources` | `"../../src/prompts/templates.ts"` | **No** — `src/` not shipped |
| `sourcesContent` | Full original TypeScript as a string | **Yes** — embedded right in the `.map` JSON |

Without `sourcesContent`, the `.map` file is mostly harmless. The mistake was that TypeScript's `inlineSources: true` in `tsconfig.json` baked the full source into `sourcesContent`, and the build pipeline didn't strip the `.map` files before `npm publish`.

### Two levels of exposure — summary

| Level | Field | What it reveals | Effort to exploit |
|-------|-------|-----------------|-------------------|
| EASY | `sourcesContent` | Complete original source code, verbatim | Zero — `JSON.parse()` and read |
| HARD | `mappings` + `names` | Line/column mapping + variable names | Decode Base64 VLQ, reconstruct structure |

The Claude Code npm package contained **both**. Full source recovery was trivial.

---

## TypeScript Patterns Found in the Leaked Code

### `async function*` — The Agent Loop Pattern

The leaked Claude Code source revealed a core pattern: the agent's main loop is an **async generator**:

```typescript
export async function* query(
  params: QueryParams,
): AsyncGenerator<
  | StreamEvent
  | RequestStartEvent
  | Message
  | ToolUseSummaryMessage,   // TYield — values that come out
  Terminal                    // TReturn — final "why it stopped"
>
```

Keyword breakdown:

| Keyword | What it does |
|---------|--------------|
| `export` | Makes the function importable from other files |
| `async` | Can use `await` inside (handles Promises) |
| `function*` | A **generator** — can `yield` multiple values over time instead of returning once |
| `async function*` | Both combined: can `await` async operations AND `yield` values one at a time |

```
Normal function:    runs → returns ONE value → done
Generator function*: runs → yields MANY values → done
Async function:     runs → awaits → returns ONE value
Async function*:    runs → awaits → yields MANY → done
```

`AsyncGenerator<TYield, TReturn>`:

| Type param | Position | Meaning |
|------------|----------|---------|
| `TYield` | 1st | Type of values coming **out** each time you call `yield` |
| `TReturn` | 2nd | Type of the **final** value when the generator is done |

Inside the function body:

```typescript
yield { type: "thinking", content: "analyzing..." };
yield { type: "tool_call", tool: "read_file" };
yield { type: "response", content: "Here's the answer" };

return { reason: "complete", turns: 3 };  // Terminal
```

Consumer side:

```typescript
const agent = query(params);
const { value, done } = await agent.next();
// When done === true: value is Terminal (the return value — why it stopped)
```

**Analogy**: A normal function is a vending machine (put money in, get one item out). A generator is a conveyor belt (keeps pushing items out one by one, you take each when ready). An async generator is a conveyor belt that sometimes pauses to wait for the next item to be manufactured.

### TypeScript Generics — `<T>`

```typescript
function take<T>(n: number, gen: Generator<T>): T[] {
  const result: T[] = [];
  for (const val of gen) {
    result.push(val);
    if (result.length >= n) break;
  }
  return result;
}
```

`<T>` is a **generic** — a placeholder for "whatever type the generator yields." It lets one function work with any generator:

```typescript
take(5, fibonacci())            // T = number → returns number[]
take(3, someStringGenerator())  // T = string → returns string[]
```

Without generics, you'd need separate functions per type. With generics, one function handles all. TypeScript **infers** `T` automatically from what you pass in.

---

## Idiom of the Day

> *"Let the cat out of the bag"* — to accidentally reveal a secret that was supposed to stay hidden.

**In context**: Anthropic's build pipeline let the cat out of the bag — a single overlooked `.map` file exposed the entire internal architecture that was meant to stay proprietary.

---

[← Back to Daily Log Summary](../summary.md)
