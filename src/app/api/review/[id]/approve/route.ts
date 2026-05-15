/**
 * POST /api/review/[id]/approve
 *
 * Two-step approval:
 *   PENDING            → employee (owner) approves → EMPLOYEE_APPROVED
 *   EMPLOYEE_APPROVED  → HR approves              → APPROVED + profile created
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

  const pending = await prisma.pendingExtraction.findUnique({ where: { id: params.id } });
  if (!pending) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (pending.status === "APPROVED" || pending.status === "REJECTED") {
    return NextResponse.json({ error: `Already ${pending.status.toLowerCase()}` }, { status: 409 });
  }

  const isOwner = pending.userId === session.user.id;
  const isHR = session.user.role === "HR";

  // ─── Step 1: PENDING → EMPLOYEE_APPROVED (employee only) ───
  if (pending.status === "PENDING") {
    if (!isOwner) {
      return NextResponse.json(
        { error: "Only the employee who uploaded this resume can submit it for HR review." },
        { status: 403 },
      );
    }
    await prisma.pendingExtraction.update({
      where: { id: pending.id },
      data: { status: "EMPLOYEE_APPROVED", reviewedAt: new Date() },
    });
    console.log(`[approve] step 1: ${session.user.email} submitted ${params.id} for HR review`);
    return NextResponse.json({ status: "EMPLOYEE_APPROVED", step: 1 });
  }

  // ─── Step 2: EMPLOYEE_APPROVED → APPROVED (HR only) ───
  if (pending.status !== "EMPLOYEE_APPROVED") {
    return NextResponse.json({ error: "Unexpected status" }, { status: 409 });
  }
  if (!isHR) {
    return NextResponse.json(
      { error: "Only HR can give final approval." },
      { status: 403 },
    );
  }

  console.log(`[approve] step 2: ${session.user.email} HR-approving ${params.id}`);

  // Optional override body: HR may tweak fields before final approval.
  const body = await req.json().catch(() => null);
  const overrides =
    body && typeof body === "object"
      ? (body as { overrides?: unknown }).overrides
      : undefined;

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
    `[approve] profile upserted (${data.skills.length} skills, ${data.projects.length} projects) for ${profile.fullName}`,
  );

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
  return NextResponse.json({ status: "APPROVED", step: 2, profileId: profile.id, embeddingOk });
}
