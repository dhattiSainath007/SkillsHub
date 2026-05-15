/**
 * POST /api/review/[id]/reject
 * Body: { notes?: string }
 *
 * Allowed:
 *   PENDING            → employee (owner) discards their own draft
 *   EMPLOYEE_APPROVED  → HR declines the submission
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
  if (pending.status === "APPROVED" || pending.status === "REJECTED") {
    return NextResponse.json({ error: `Already ${pending.status.toLowerCase()}` }, { status: 409 });
  }

  const isOwner = pending.userId === session.user.id;
  const isHR = session.user.role === "HR";

  if (pending.status === "PENDING" && !isOwner) {
    return NextResponse.json(
      { error: "Only the uploader can discard a draft." },
      { status: 403 },
    );
  }
  if (pending.status === "EMPLOYEE_APPROVED" && !isHR) {
    return NextResponse.json(
      { error: "Only HR can reject a submitted extraction." },
      { status: 403 },
    );
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
