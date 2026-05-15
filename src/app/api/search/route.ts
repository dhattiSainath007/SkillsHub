/**
 * POST /api/search
 * Body: { query: string }
 *
 * 1. Embed the query
 * 2. Pull top-20 candidates via pgvector cosine distance
 * 3. Hydrate full profile data
 * 4. Re-rank with Gemini, get plain-English reasoning
 * 5. Log the search, return ranked results
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireHR } from "@/lib/api-auth";
import { generateEmbedding, rankCandidates, type CandidateForRanking, type RankedResult } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({ query: z.string().min(2).max(500) });

export async function POST(req: Request) {
  const t0 = Date.now();
  const guard = await requireHR();
  if (guard.error) return guard.error;
  const { session } = guard;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }
  const { query } = parsed.data;
  console.log(`[search] ── new query from ${session.user.email}: "${query}"`);

  let queryVec: number[];
  try {
    const tEmbed = Date.now();
    queryVec = await generateEmbedding(query);
    console.log(`[search] embedded query (${queryVec.length}-dim) in ${Date.now() - tEmbed}ms`);
  } catch (err) {
    console.error(`[search] embedding FAILED:`, (err as Error).message);
    return NextResponse.json(
      { error: "Embeddings service unavailable", detail: (err as Error).message },
      { status: 502 },
    );
  }

  const vecLiteral = `[${queryVec.join(",")}]`;

  // pgvector cosine distance: smaller = closer.
  const tVec = Date.now();
  const neighbors = await prisma.$queryRawUnsafe<Array<{ id: string; distance: number }>>(
    `SELECT id, (embedding <=> $1::vector) AS distance
       FROM profiles
      WHERE embedding IS NOT NULL
      ORDER BY distance ASC
      LIMIT 20`,
    vecLiteral,
  );
  console.log(
    `[search] pgvector returned ${neighbors.length} candidates in ${Date.now() - tVec}ms ` +
      `(closest distance=${neighbors[0]?.distance.toFixed(4) ?? "n/a"})`,
  );

  if (neighbors.length === 0) {
    return NextResponse.json({ query, results: [], note: "No profiles have embeddings yet." });
  }

  const ids = neighbors.map((n) => n.id);
  const profiles = await prisma.profile.findMany({
    where: { id: { in: ids } },
    include: { skills: true, projects: true },
  });
  // Preserve pgvector ordering (Prisma's `in` doesn't guarantee it).
  const byId = new Map(profiles.map((p) => [p.id, p]));
  const ordered = ids.map((id) => byId.get(id)!).filter(Boolean);

  const candidates: CandidateForRanking[] = ordered.map((p) => ({
    profileId: p.id,
    fullName: p.fullName,
    location: p.location,
    yearsExperience: p.yearsExperience,
    available: p.available,
    lastProjectEnd: p.lastProjectEnd,
    summary: p.summary,
    skills: p.skills.map((s) => ({
      name: s.name,
      proficiency: s.proficiency,
      yearsExperience: s.yearsExperience,
    })),
    projects: p.projects.map((pr) => ({
      name: pr.name,
      description: pr.description,
      technologies: pr.technologies,
    })),
  }));

  let ranked: RankedResult[];
  try {
    const tRank = Date.now();
    ranked = await rankCandidates(query, candidates);
    const topName = candidates.find((c) => c.profileId === ranked[0]?.profileId)?.fullName ?? "?";
    console.log(
      `[search] Groq reranked → ${ranked.length} results in ${Date.now() - tRank}ms ` +
        `(top: ${topName} @ ${ranked[0]?.matchScore ?? "?"})`,
    );
  } catch (err) {
    console.error(`[search] Groq rerank FAILED:`, (err as Error).message);
    return NextResponse.json(
      { error: "Ranking failed", detail: (err as Error).message },
      { status: 502 },
    );
  }

  // Stitch reasoning back onto full profile records for the UI.
  const results = ranked
    .map((r) => {
      const profile = byId.get(r.profileId);
      if (!profile) return null;
      return {
        profileId: r.profileId,
        matchScore: r.matchScore,
        reasoning: r.reasoning,
        profile: {
          id: profile.id,
          fullName: profile.fullName,
          location: profile.location,
          yearsExperience: profile.yearsExperience,
          summary: profile.summary,
          available: profile.available,
          lastProjectEnd: profile.lastProjectEnd,
          skills: profile.skills,
          projects: profile.projects,
        },
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  await prisma.searchLog.create({
    data: {
      userId: session.user.id,
      query,
      results: results.map((r) => ({
        profileId: r.profileId,
        matchScore: r.matchScore,
        reasoning: r.reasoning,
      })),
    },
  });

  console.log(`[search] done — ${results.length} results returned in ${Date.now() - t0}ms total`);
  return NextResponse.json({ query, results });
}
