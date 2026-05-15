/**
 * POST /api/review/[id]/reject
 * Body: { notes?: string }
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

const bodySchema = z.object({ notes: z.string().max(1000).optional() });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;
  const { session } = guard;

  const pending = await prisma.pendingExtraction.findUnique({ where: { id: params.id } });
  if (!pending) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (pending.status !== "PENDING") {
    return NextResponse.json({ error: `Already ${pending.status.toLowerCase()}` }, { status: 409 });
  }

  const isOwner = pending.userId === session.user.id;
  const isHR = session.user.role === "HR";
  if (!isOwner && !isHR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  await prisma.pendingExtraction.update({
    where: { id: pending.id },
    data: {
      status: "REJECTED",
      reviewNotes: parsed.data.notes ?? null,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
