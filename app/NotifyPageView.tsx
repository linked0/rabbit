import { headers } from "next/headers";
import { notifyPageView } from "@/lib/visitor-notify";

// Fire-and-forget Telegram page-view ping for a top-menu page (Home is excluded — see
// lib/visitor-notify.ts). Server component: reading headers() makes the host page dynamic,
// which is what we want — a ping per real visit, not per build. Debounced per (path, IP).
// Drop it into a top-menu page's server component:  <NotifyPageView path="/live" />
export default function NotifyPageView({ path }: { path: string }) {
  notifyPageView(path, headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown");
  return null;
}
