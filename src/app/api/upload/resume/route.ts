/**
 * POST /api/upload/resume
 * Multipart upload (field: "file") → save PDF → parse text → Gemini extraction
 * → store as PendingExtraction. Returns the extracted JSON so the UI can show
 * a review form immediately.
 */
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
// unpdf wraps a modern, maintained pdfjs build. It has no filesystem
// side-effects and parses cleanly under the Next.js/webpack bundler, unlike
// the ancient pdf.js bundled in pdf-parse@1.x (which threw "bad XRef entry"
// on valid PDFs once bundled).
import { extractText, getDocumentProxy } from "unpdf";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { extractResumeData } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  const t0 = Date.now();
  const guard = await requireAuth();
  if (guard.error) return guard.error;
  const { session } = guard;
  console.log(`[upload] ── new request from ${session.user.email} (role=${session.user.role})`);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  // Avoid `instanceof File` — Node 18 doesn't have File as a global. Duck-type instead.
  const fileEntry = form.get("file");
  if (!fileEntry || typeof fileEntry === "string") {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }
  const file = fileEntry as Blob & { name?: string };
  const fileName = file.name ?? "upload.pdf";
  if (file.type !== "application/pdf" && !fileName.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF uploads are supported" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }
  console.log(`[upload] received "${fileName}" (${(file.size / 1024).toFixed(1)} KB, ${file.type})`);

  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.pdf`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  console.log(`[upload] saved to uploads/${filename}`);

  let text: string;
  try {
    const tParse = Date.now();
    const doc = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(doc, { mergePages: true });
    text = (result.text ?? "").trim();
    console.log(`[upload] pdf parse: ${text.length} chars in ${Date.now() - tParse}ms`);
  } catch (err) {
    console.error(`[upload] pdf parse FAILED:`, (err as Error).message);
    return NextResponse.json(
      { error: "Could not parse PDF", detail: (err as Error).message },
      { status: 422 },
    );
  }
  if (!text) {
    console.warn(`[upload] no extractable text (probably a scanned image)`);
    return NextResponse.json(
      { error: "PDF appears to contain no extractable text (scanned image?)." },
      { status: 422 },
    );
  }

  let extracted;
  try {
    const tAi = Date.now();
    extracted = await extractResumeData(text);
    console.log(
      `[upload] Groq extraction: ${extracted.skills.length} skills, ` +
        `${extracted.projects.length} projects in ${Date.now() - tAi}ms`,
    );
  } catch (err) {
    console.error(`[upload] Groq extraction FAILED:`, (err as Error).message);
    return NextResponse.json(
      { error: "AI extraction failed", detail: (err as Error).message },
      { status: 502 },
    );
  }

  const pending = await prisma.pendingExtraction.create({
    data: {
      userId: session.user.id,
      rawText: text,
      extracted: extracted as unknown as object,
    },
  });
  console.log(`[upload] PendingExtraction ${pending.id} created — total ${Date.now() - t0}ms`);

  return NextResponse.json({
    extractionId: pending.id,
    extracted,
    filename,
  });
}
