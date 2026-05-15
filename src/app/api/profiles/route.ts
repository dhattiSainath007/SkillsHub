/**
 * GET /api/profiles
 * Lists profiles with their skills (for directory view).
 * Supports ?q=<keyword> for simple substring filtering on name or skill.
 */
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();

  const where: Prisma.ProfileWhereInput = q
    ? {
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
          { skills: { some: { name: { contains: q, mode: "insensitive" } } } },
        ],
      }
    : {};

  const profiles = await prisma.profile.findMany({
    where,
    include: {
      skills: { take: 6, orderBy: { yearsExperience: "desc" } },
      _count: { select: { projects: true } },
    },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json({ profiles });
}
