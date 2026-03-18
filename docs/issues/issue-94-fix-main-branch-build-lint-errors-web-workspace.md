# Fix Main Branch Build & Lint Errors (Web Workspace)

**Issue #94** | **State:** OPEN | **Created:** 2026-01-26T08:42:16Z

**Assignees:** Abdulkarim4u

**Updated:** 2026-01-26T08:58:41Z | **Closed:** N/A

---

## Problem
The `git push` is currently failing due to the `pre-push` hook triggering ESLint errors in the `web` workspace. The build process (Next.js) is identifying several blocking issues that need to be resolved to restore a clean CI/CD pipeline.

## Error Categories
The following issues were identified in the build log:
1. **Implicit `any` Types (Blocking)**: `Unexpected any` errors in `src/app/market/[id]/page.tsx`.
2. **Next.js Image Optimization**: Multiple warnings about using `<img>` instead of `<Image />`.
3. **Unused Variables**: `decrement`, `Loader2`, `Legend`, `useTradeUpdates`, etc.
4. **Missing Dependencies**: `useEffect` and `useMemo` hooks missing dependencies arrays.

## Logs
```
[web]: ./src/app/market/[id]/page.tsx
[web]: 193:69  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[web]: 194:71  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
...
husky - pre-push script failed (code 1)
```

## Action Items
- [ ] Fix explicit `any` types in `market/[id]/page.tsx` (Priority High).
- [ ] Remove or comment out unused variables and imports.
- [ ] Replace `<img>` tags with Next.js `<Image />` component or disable the rule if necessary.
- [ ] Audit and fix `useEffect`/`useMemo` dependency arrays.
- [ ] Verify `yarn build` and `git push` pass without `--no-verify`.

---

## Comments

### @linked0 — 2026-01-26T08:54:49Z

There is also the same problem for `git commit`.

---

### @Abdulkarim4u — 2026-01-26T08:56:24Z

Oh great , sounds about right, to use --no-verify henceforth.

---

