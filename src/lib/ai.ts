/**
 * Provider-agnostic AI surface for SkillsHub.
 *
 * - extractResumeData(text)   → calls Groq, validates with Zod, retries once
 * - generateEmbedding(text)   → calls Python embeddings service (384-dim)
 * - rankCandidates(query, c)  → calls Groq for re-ranking + reasoning
 *
 * Swap providers by editing only the `chatJson()` helper below.
 */
import { z } from "zod";

const EMBEDDINGS_URL = process.env.EMBEDDINGS_URL ?? "http://localhost:8000";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

// ──────────────────────────────────────────────────────────────────────
// LLM wrapper (Groq, OpenAI-compatible)
// ──────────────────────────────────────────────────────────────────────

async function chatJson(systemPrompt: string, userPrompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");

  const t0 = Date.now();
  console.log(`[ai] → Groq (${GROQ_MODEL}, prompt ${userPrompt.length} chars)`);
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    console.error(`[ai] Groq HTTP ${res.status}: ${detail.slice(0, 200)}`);
    throw new Error(`Groq returned ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("Groq returned empty response");
  console.log(
    `[ai] ← Groq ${Date.now() - t0}ms ` +
      `(${data.usage?.prompt_tokens ?? "?"} prompt + ${data.usage?.completion_tokens ?? "?"} completion tokens)`,
  );
  return content;
}

// ──────────────────────────────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────────────────────────────

const SkillCategoryEnum = z.enum([
  "LANGUAGE",
  "FRAMEWORK",
  "PLATFORM",
  "TOOL",
  "DOMAIN",
]);
const ProficiencyEnum = z.enum(["NOVICE", "INTERMEDIATE", "EXPERT"]);

// LLMs often return slightly-off enum values ("METHODOLOGY", "DATABASE",
// "ADVANCED", "SENIOR"). Map them to the closest valid value rather than
// failing the whole extraction.
const CATEGORY_ALIASES: Record<string, z.infer<typeof SkillCategoryEnum>> = {
  // Languages
  LANG: "LANGUAGE",
  PROGRAMMING_LANGUAGE: "LANGUAGE",
  QUERY_LANGUAGE: "LANGUAGE",
  MARKUP: "LANGUAGE",
  MARKUP_LANGUAGE: "LANGUAGE",
  SCRIPTING: "LANGUAGE",
  // Frameworks / libraries
  LIBRARY: "FRAMEWORK",
  LIB: "FRAMEWORK",
  SDK: "FRAMEWORK",
  UI_LIBRARY: "FRAMEWORK",
  FRONTEND_FRAMEWORK: "FRAMEWORK",
  BACKEND_FRAMEWORK: "FRAMEWORK",
  // Platforms
  CLOUD: "PLATFORM",
  CLOUD_PLATFORM: "PLATFORM",
  DATABASE: "PLATFORM",
  DB: "PLATFORM",
  OS: "PLATFORM",
  OPERATING_SYSTEM: "PLATFORM",
  RUNTIME: "PLATFORM",
  INFRASTRUCTURE: "PLATFORM",
  SERVICE: "PLATFORM",
  // Tools
  IDE: "TOOL",
  EDITOR: "TOOL",
  CLI: "TOOL",
  VCS: "TOOL",
  TESTING: "TOOL",
  CI_CD: "TOOL",
  DEVOPS: "TOOL",
  // Domains / methodologies / soft skills
  METHODOLOGY: "DOMAIN",
  CONCEPT: "DOMAIN",
  PRACTICE: "DOMAIN",
  PRINCIPLE: "DOMAIN",
  PATTERN: "DOMAIN",
  CERTIFICATION: "DOMAIN",
  PROTOCOL: "DOMAIN",
  STANDARD: "DOMAIN",
  ARCHITECTURE: "DOMAIN",
  SOFT_SKILL: "DOMAIN",
  PROCESS: "DOMAIN",
  INDUSTRY: "DOMAIN",
  AREA: "DOMAIN",
  SPECIALIZATION: "DOMAIN",
  OTHER: "DOMAIN",
};

const PROFICIENCY_ALIASES: Record<string, z.infer<typeof ProficiencyEnum>> = {
  BEGINNER: "NOVICE",
  JUNIOR: "NOVICE",
  BASIC: "NOVICE",
  ENTRY: "NOVICE",
  LEARNING: "NOVICE",
  FAMILIAR: "NOVICE",
  MID: "INTERMEDIATE",
  MID_LEVEL: "INTERMEDIATE",
  COMPETENT: "INTERMEDIATE",
  PROFICIENT: "INTERMEDIATE",
  WORKING: "INTERMEDIATE",
  ADVANCED: "EXPERT",
  SENIOR: "EXPERT",
  MASTER: "EXPERT",
  GURU: "EXPERT",
  PRINCIPAL: "EXPERT",
  LEAD: "EXPERT",
};

function normalizeEnum<T extends string>(
  raw: unknown,
  allowed: readonly T[],
  aliases: Record<string, T>,
  fallback: T,
): T {
  if (typeof raw !== "string") return fallback;
  const upper = raw.toUpperCase().replace(/[\s-]+/g, "_").trim();
  if ((allowed as readonly string[]).includes(upper)) return upper as T;
  return aliases[upper] ?? fallback;
}

const ExtractedSkillSchema = z.object({
  name: z.string().min(1),
  category: z.preprocess(
    (v) =>
      normalizeEnum(
        v,
        ["LANGUAGE", "FRAMEWORK", "PLATFORM", "TOOL", "DOMAIN"] as const,
        CATEGORY_ALIASES,
        "TOOL",
      ),
    SkillCategoryEnum,
  ),
  proficiency: z.preprocess(
    (v) =>
      normalizeEnum(
        v,
        ["NOVICE", "INTERMEDIATE", "EXPERT"] as const,
        PROFICIENCY_ALIASES,
        "INTERMEDIATE",
      ),
    ProficiencyEnum,
  ),
  yearsExperience: z.coerce.number().min(0).default(0),
  inferred: z.coerce.boolean().default(false),
});

const ExtractedProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  technologies: z
    .preprocess((v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []), z.array(z.string()))
    .default([]),
  durationMonths: z.coerce.number().int().min(0).default(0),
});

export const ExtractedProfileSchema = z.object({
  fullName: z.string().min(1),
  location: z.string().nullable(),
  yearsExperience: z.number().min(0),
  summary: z.string().min(1),
  skills: z.array(ExtractedSkillSchema),
  projects: z.array(ExtractedProjectSchema),
});

export type ExtractedProfile = z.infer<typeof ExtractedProfileSchema>;
export type ExtractedSkill = z.infer<typeof ExtractedSkillSchema>;
export type ExtractedProject = z.infer<typeof ExtractedProjectSchema>;

const RankedResultsSchema = z.object({
  results: z.array(
    z.object({
      profileId: z.string(),
      matchScore: z.number().min(0).max(100),
      reasoning: z.string().min(1),
    }),
  ),
});

export type RankedResult = z.infer<typeof RankedResultsSchema>["results"][number];

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function stripCodeFence(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
    throw new Error(`Could not parse JSON. First 200 chars: ${raw.slice(0, 200)}`);
  }
}

// ──────────────────────────────────────────────────────────────────────
// Resume extraction
// ──────────────────────────────────────────────────────────────────────

const EXTRACT_SYSTEM =
  "You are an expert HR analyst extracting structured skill data from a resume. " +
  "You output ONLY valid JSON matching the requested schema. No markdown, no commentary.";

const EXTRACT_PROMPT = (text: string) =>
  `RESUME TEXT:
${text}

Return ONLY valid JSON matching this exact schema:
{
  "fullName": string,
  "location": string | null,
  "yearsExperience": number,
  "summary": string (2-3 sentence professional summary),
  "skills": [
    {
      "name": string (e.g., "React", "Python", "AWS"),
      "category": "LANGUAGE" | "FRAMEWORK" | "PLATFORM" | "TOOL" | "DOMAIN",
      "proficiency": "NOVICE" | "INTERMEDIATE" | "EXPERT",
      "yearsExperience": number,
      "inferred": boolean
    }
  ],
  "projects": [
    {
      "name": string,
      "description": string,
      "technologies": string[],
      "durationMonths": number
    }
  ]
}

RULES:
- EXHAUSTIVE EXTRACTION: Extract EVERY skill that appears in any "Technical Skills",
  "Skills", "Tools", "Tech Stack", or similar section. Do NOT summarize, merge, or
  silently drop items. Every comma-separated item is its own skill. If the section
  lists 12 items, the output MUST contain at least 12 corresponding skills.
- Before finalising, re-read each comma-separated skill line in the resume and
  confirm every item appears in your skills array. If a parenthetical short name
  is given (e.g. "Large Language Model Orchestration (LangChain)"), that counts
  as ONE skill — emit the short name. Items separated only by commas are SEPARATE
  skills, never merge them.
- ALSO extract technologies mentioned in project descriptions and the experience section.
- CANONICAL NAMES: Resumes often spell out acronyms. Always use the SHORT, common
  industry name as the skill "name", not the verbose phrase:
    • "Structured Query Language"                        → "SQL"
    • "Amazon Simple Storage Service"                    → "Amazon S3"
    • "Representational State Transfer" / "REST APIs"    → "REST"
    • "Application Programming Interface" / "APIs"       → "REST API" or "API"
    • "Django Representational State Transfer Framework" → "Django REST Framework"
    • "Large Language Model Orchestration (LangChain)"   → "LangChain"
    • "Vector Databases (Chroma Database)"               → "ChromaDB" (and also add a "Vector Databases" skill)
    • "Convolutional Neural Networks"                    → "CNN"
    • "Retrieval-Augmented Generation" / "RAG Pipelines" → "RAG"
    • "Generative Artificial Intelligence"               → "Generative AI"
    • "Prompt Engineering"                               → "Prompt Engineering"
    • "Term Frequency–Inverse Document Frequency"        → "TF-IDF"
  General rule: if a skill is written as "Verbose Phrase (CommonName)" or
  "CommonName (Verbose Phrase)", use the CommonName as the skill name.
- Proficiency: NOVICE (<2 yrs), INTERMEDIATE (2-5 yrs), EXPERT (5+ yrs).
  If years are unclear, use INTERMEDIATE.
- INFERENCE BONUS: If someone has Next.js, also add React (inferred: true).
  If they have TypeScript, also add JavaScript (inferred: true).
  If they have Spring Boot, also add Java (inferred: true).
  If they have Django/Flask, also add Python (inferred: true).
- Be generous — when in doubt, INCLUDE the skill rather than skip it.`;

export async function extractResumeData(pdfText: string): Promise<ExtractedProfile> {
  const attempt = async (extra = ""): Promise<ExtractedProfile> => {
    const userPrompt = EXTRACT_PROMPT(pdfText) + (extra ? `\n\n${extra}` : "");
    const raw = stripCodeFence(await chatJson(EXTRACT_SYSTEM, userPrompt));
    return ExtractedProfileSchema.parse(safeJsonParse(raw));
  };

  try {
    return await attempt();
  } catch (err) {
    return await attempt(
      `Your previous response failed validation: ${(err as Error).message}. ` +
        `Return ONLY valid JSON matching the schema exactly.`,
    );
  }
}

// ──────────────────────────────────────────────────────────────────────
// Embeddings
// ──────────────────────────────────────────────────────────────────────

export async function generateEmbedding(text: string): Promise<number[]> {
  const t0 = Date.now();
  console.log(`[embed] → sentence-transformers (${text.length} chars)`);
  const res = await fetch(`${EMBEDDINGS_URL}/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    console.error(`[embed] service HTTP ${res.status} ${res.statusText}`);
    throw new Error(`Embeddings service returned ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { embedding: number[]; dim: number };
  if (!Array.isArray(data.embedding) || data.embedding.length === 0) {
    throw new Error("Embeddings service returned empty vector");
  }
  console.log(`[embed] ← ${data.embedding.length}-dim vector in ${Date.now() - t0}ms`);
  return data.embedding;
}

// ──────────────────────────────────────────────────────────────────────
// Candidate ranking
// ──────────────────────────────────────────────────────────────────────

export type CandidateForRanking = {
  profileId: string;
  fullName: string;
  location: string | null;
  yearsExperience: number;
  available: boolean;
  lastProjectEnd: Date | string | null;
  summary: string | null;
  skills: { name: string; proficiency: string; yearsExperience: number }[];
  projects: { name: string; description: string; technologies: string[] }[];
};

const RANK_SYSTEM =
  "You are an HR matching assistant. You output ONLY valid JSON with a single 'results' " +
  "array. Each reasoning sentence is plain English, specific, and one sentence long.";

export async function rankCandidates(
  query: string,
  candidates: CandidateForRanking[],
): Promise<RankedResult[]> {
  if (candidates.length === 0) return [];

  const compact = candidates.map((c) => ({
    profileId: c.profileId,
    fullName: c.fullName,
    location: c.location,
    yearsExperience: c.yearsExperience,
    available: c.available,
    lastProjectEnd:
      c.lastProjectEnd instanceof Date
        ? c.lastProjectEnd.toISOString().slice(0, 10)
        : c.lastProjectEnd,
    summary: c.summary,
    skills: c.skills,
    projects: c.projects,
  }));

  const userPrompt = `HR QUERY: "${query}"

CANDIDATES:
${JSON.stringify(compact, null, 2)}

Rank the top 5 most relevant. For each, output:
- profileId (must match input exactly)
- matchScore (0-100)
- reasoning (ONE sentence, plain English, specific — mention years, projects, and availability if relevant)

Example reasoning: "Rahul — 94% match. Expert in React (5 yrs), led 2 real-time apps using Socket.IO, currently available."

Return ONLY JSON: { "results": [{ "profileId": "...", "matchScore": 94, "reasoning": "..." }] }

Be honest — if no candidates are a good fit, return fewer results.`;

  const raw = stripCodeFence(await chatJson(RANK_SYSTEM, userPrompt));
  const parsed = RankedResultsSchema.parse(safeJsonParse(raw));

  // Drop hallucinated profileIds defensively.
  const knownIds = new Set(candidates.map((c) => c.profileId));
  return parsed.results.filter((r) => knownIds.has(r.profileId));
}
