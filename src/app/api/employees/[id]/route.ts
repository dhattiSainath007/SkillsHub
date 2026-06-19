/**
 * DELETE /api/employees/[id]
 * HR-only. Removes an employee account and ALL associated data:
 * profile, skills, projects (cascade), plus pending extractions and search logs
 * (no FK, so deleted explicitly). The user can no longer log in.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHR } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const guard = await requireHR();
  if (guard.error) return guard.error;
  const { session } = guard;

  const userId = params.id;

  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }
  if (target.role !== "EMPLOYEE") {
    return NextResponse.json(
      { error: "Only employee accounts can be deleted from this endpoint." },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.pendingExtraction.deleteMany({ where: { userId } }),
    prisma.searchLog.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  console.log(`[employees] ${session.user.email} deleted employee ${target.email} (${userId})`);
  return NextResponse.json({ deleted: true });
}
