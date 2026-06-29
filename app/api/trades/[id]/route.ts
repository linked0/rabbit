import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// DELETE /api/trades/:id — 본인 거래만 삭제
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 소유자 확인 후 삭제 (남의 행 삭제 방지)
  const result = await prisma.trade.deleteMany({
    where: { id: params.id, userEmail: email },
  });
  if (result.count === 0)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
