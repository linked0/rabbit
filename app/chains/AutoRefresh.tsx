"use client";

// Re-fetch the server-rendered dashboard on a timer.
//
// The page is a server component with `force-dynamic`, so router.refresh()
// re-runs it and React swaps in the new output without losing scroll position
// or remounting anything — no polling endpoint and no client-side copy of the
// chain state to keep in sync.
//
// It stops while the tab is hidden. A status page nobody is looking at should
// not be asking the devnet for blocks every few seconds; the refresh on
// becoming visible again means you never read a stale number either.

import * as React from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter();

  React.useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => router.refresh(), seconds * 1000);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        router.refresh(); // catch up immediately, then resume the timer
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, seconds]);

  return null;
}
