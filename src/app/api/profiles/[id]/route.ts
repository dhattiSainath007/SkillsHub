/**
 * GET    /api/profiles/[id]  → full profile with skills + projects + user
 * PATCH  /api/profiles/[id]  → update `available` flag (HR or owner)
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  const profile = await prisma.profile.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
      skills: { orderBy: [{ category: "asc" }, { yearsExperience: "desc" }] },
      projects: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json({ profile });
}

const patchSchema = z.object({
  available: z.boolean().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;
  const { session } = guard;

  const profile = await prisma.profile.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const isOwner = profile.userId === session.user.id;
  const isHR = session.user.role === "HR";
  if (!isOwner && !isHR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: parsed.data,
  });
  return NextResponse.json({ profile: updated });
}
