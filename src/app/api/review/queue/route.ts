/**
 * GET /api/review/queue
 * HR: all PENDING extractions across the org.
 * Employees: only their own PENDING extractions.
 */
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireAuth();
  if (guard.error) return guard.error;
  const { session } = guard;

  const where =
    session.user.role === "HR"
      ? { status: "PENDING" as const }
      : { status: "PENDING" as const, userId: session.user.id };

  const items = await prisma.pendingExtraction.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Join in the uploader's name/email for the HR view.
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
