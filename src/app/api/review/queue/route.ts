/**
 * GET /api/review/queue
 *
 * HR sees EMPLOYEE_APPROVED extractions (employee already self-reviewed,
 * waiting for HR final approval). Non-HR users get an empty list — they
 * see their own PENDING drafts on /my-profile, not here.
 */
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireAuth();
  if (guard.error) return guard.error;
  const { session } = guard;

  if (session.user.role !== "HR") {
    return NextResponse.json({ items: [] });
  }

  const items = await prisma.pendingExtraction.findMany({
    where: { status: "EMPLOYEE_APPROVED" },
    orderBy: { createdAt: "desc" },
  });

  const userIds = Array.from(new Set(items.map((i) => i.userId)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      createdAt: i.createdAt,
      uploader: userById.get(i.userId) ?? { id: i.userId, name: "(unknown)", email: "" },
      extracted: i.extracted,
    })),
  });
}
