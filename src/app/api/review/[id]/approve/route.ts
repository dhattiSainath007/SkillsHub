/**
 * POST /api/review/[id]/approve
 *
 * 1. Load the PendingExtraction
 * 2. Allow optional `overrides` in the body to let HR edit before saving
 * 3. Upsert the Profile (replace skills + projects atomically)
 * 4. Regenerate the embedding from the new profile text, write via raw SQL
 * 5. Mark the extraction APPROVED
 */
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import {
  ExtractedProfileSchema,
  generateEmbedding,
  type ExtractedProfile,
} from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function buildEmbeddingText(p: ExtractedProfile): string {
  const skills = p.skills
    .map((s) => `${s.name} (${s.proficiency}, ${s.yearsExperience} years)`)
    .join(", ");
  const projects = p.projects.map((pr) => pr.description).join(" ");
  return `${p.fullName}. ${p.summary} Skills: ${skills}. Projects: ${projects}`;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const t0 = Date.now();
  const guard = await requireAuth();
  if (guard.error) return guard.error;
  const { session } = guard;
  console.log(`[approve] ── ${session.user.email} approving extraction ${params.id}`);

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

  // Optional override body: HR may tweak fields before approving.
  const body = await req.json().catch(() => null);
  const overrides = body && typeof body === "object" ? (body as { overrides?: unknown }).overrides : undefined;

  const candidate = overrides ?? pending.extracted;
  const parsed = ExtractedProfileSchema.safeParse(candidate);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile data", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const existing = await prisma.profile.findUnique({ where: { userId: pending.userId } });

  const profile = await prisma.$transaction(async (tx) => {
    // Wipe-and-recreate skills+projects for a clean re-approval.
    if (existing) {
      await tx.skill.deleteMany({ where: { profileId: existing.id } });
      await tx.project.deleteMany({ where: { profileId: existing.id } });
    }

    const upserted = await tx.profile.upsert({
      where: { userId: pending.userId },
      create: {
        userId: pending.userId,
        fullName: data.fullName,
        location: data.location,
        yearsExperience: data.yearsExperience,
        summary: data.summary,
        skills: { create: data.skills },
        projects: { create: data.projects },
      },
      update: {
        fullName: data.fullName,
        location: data.location,
        yearsExperience: data.yearsExperience,
        summary: data.summary,
        skills: { create: data.skills },
        projects: { create: data.projects },
      },
    });

    await tx.pendingExtraction.update({
      where: { id: pending.id },
      data: {
        status: "APPROVED",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    });

    return upserted;
  });
  console.log(
    `[approve] profile upserted (${data.skills.length} skills, ${data.projects.length} projects) ` +
      `for ${profile.fullName}`,
  );

  // Generate + store embedding outside the transaction (external service call).
  let embeddingOk = false;
  try {
    const tEmbed = Date.now();
    const vec = await generateEmbedding(buildEmbeddingText(data));
    const literal = `[${vec.join(",")}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE profiles SET embedding = $1::vector WHERE id = $2`,
      literal,
      profile.id,
    );
    embeddingOk = true;
    console.log(`[approve] embedding regenerated in ${Date.now() - tEmbed}ms`);
  } catch (err) {
    console.error(`[approve] embedding generation FAILED:`, (err as Error).message);
  }

  console.log(`[approve] done — total ${Date.now() - t0}ms`);
  return NextResponse.json({ profileId: profile.id, embeddingOk });
}
