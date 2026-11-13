"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

// Left card list on every Demo page (jay, 2026-10-29, sketch: "Card list (panel)" beside the
// agent console). Labels and hrefs come from the server layout; this component only needs the
// pathname to mark the open demo, which is why it is the one client piece.

export type RailSub = { key: string; href: string; label: string };
export type RailItem = { key: string; href: string; label: string; subs?: RailSub[] };

export default function LiveRail({ title, allLabel, items }: { title: string; allLabel: string; items: RailItem[] }) {
  const path = usePathname();
  const sp = useSearchParams();
  const ref = useRef<HTMLElement>(null);

  // Longest-prefix match: /live/aa/scenarios/* lights AA, while /live/agent/console still
  // beats /live/agent because its href is longer. "All demos" stays an exact match on /live.
  const activeHref = items
    .map((i) => i.href)
    .filter((h) => path === h || path.startsWith(h + "/"))
    .sort((a, b) => b.length - a.length)[0];

  // On a phone the rail is a horizontal strip that opens scrolled to the start, so the open
  // demo's chip is often off-screen. Centre it. scrollLeft on the strip, not scrollIntoView,
  // which would also scroll the page; the overflow guard makes this a no-op on the desktop rail.
  useEffect(() => {
    const rail = ref.current;
    const a = rail?.querySelector<HTMLElement>("a.active");
    if (!rail || !a || rail.scrollWidth <= rail.clientWidth) return;
    rail.scrollLeft +=
      a.getBoundingClientRect().left - rail.getBoundingClientRect().left - (rail.clientWidth - a.offsetWidth) / 2;
  }, [path]);

  return (
    <aside className="live-rail" aria-label={title} ref={ref}>
      <div className="live-rail-title">{title}</div>
      <ol>
        <li>
          <Link href="/live" className={path === "/live" ? "active" : undefined} aria-current={path === "/live" ? "page" : undefined}>
            {allLabel}
          </Link>
        </li>
        {items.map((it) => {
          const active = it.href === activeHref;
          return (
            <li key={it.key}>
              {/* ?from=live keeps the Demo tab lit on pages outside /live (/market, /xyz, /til/…),
                  the same convention DemoCard uses on the /live grid. */}
              <Link href={`${it.href}?from=live`} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
                {it.label}
              </Link>
              {/* 하위 메뉴 — 지금은 Bird View 의 세 시나리오뿐. 어느 것이 열렸는지는 ?s= 로 안다. */}
              {it.subs && (
                <ol className="live-rail-sub">
                  {it.subs.map((sub) => {
                    const on = path === it.href && (sp.get("s") ?? it.subs![0].key) === sub.key; // s 가 없으면 첫 항목이 열린 판
                    return (
                      <li key={sub.key}>
                        <Link href={`${sub.href}&from=live`} className={on ? "active" : undefined} aria-current={on ? "page" : undefined}>
                          {sub.label}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
