import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { startScheduler, stopScheduler, schedulerState } from "@/lib/agent-scheduler";
import type { TickSettings } from "@/lib/agent-tick";

export const dynamic = "force-dynamic";

// J2 / R-F — 스케줄러 제어. 시작·정지는 소유자만; 상태는 폴링용 GET.

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(schedulerState());
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | ({ action?: "start" | "stop"; intervalSec?: number } & Partial<TickSettings>)
    | null;

  if (body?.action === "stop") {
    stopScheduler();
    return NextResponse.json(schedulerState());
  }
  if (body?.action === "start") {
    if (!body.marketSlug) return NextResponse.json({ error: "marketSlug is required" }, { status: 400 });
    const { action: _a, intervalSec, ...settings } = body;
    startScheduler(settings as TickSettings, intervalSec ?? 60);
    return NextResponse.json(schedulerState());
  }
  return NextResponse.json({ error: 'action must be "start" or "stop"' }, { status: 400 });
}
