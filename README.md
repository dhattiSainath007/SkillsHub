# SkillsHub

AI-powered skills intelligence platform. HR teams find the right people in plain English; employees upload a resume and the system extracts structured skill data for review.

The two hero features:

1. **Resume → structured profile.** Upload a PDF. An LLM extracts skills (with category, proficiency, years), projects, and a summary. HR reviews and approves.
2. **Semantic natural-language search.** Type a real question like *"Senior frontend folks who haven't been on a new project recently."* — get ranked candidates with one-sentence reasoning.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend / Backend | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui |
| Database | PostgreSQL 16 + [pgvector](https://github.com/pgvector/pgvector) (384-dim vector column) |
| ORM | Prisma |
| Auth | NextAuth v5 (credentials provider, bcrypt) |
| LLM | Groq (Llama 3.3 70B, OpenAI-compatible API) — provider-swappable via `src/lib/ai.ts` |
| Embeddings | Python FastAPI + `sentence-transformers/all-MiniLM-L6-v2` (runs locally in Docker) |
| PDF parsing | `pdf-parse@1.x` |

---

## Prerequisites

- **Node.js 18.17+** (Node 20+ recommended — a few transitive deps warn on 18)
- **Docker + Docker Compose**
- **Free Groq API key** from <https://console.groq.com/keys>
- ~3 GB free disk for the embeddings Docker image (model is baked into the layer)

---

## First-time setup

### 1. Install JS dependencies

```bash
cd /path/to/SkillsHub
npm install
```

### 2. Configure environment

Copy the template and fill in the two empty values:

```bash
cp .env.example .env
```

Then open `.env` and:

- Paste your Groq API key into `GROQ_API_KEY` — get one free at <https://console.groq.com/keys>.
- Generate and paste a `NEXTAUTH_SECRET`:
  ```bash
  openssl rand -base64 32
  ```

> **Do not commit `.env`** — it's in `.gitignore` already. Treat `GROQ_API_KEY` and `NEXTAUTH_SECRET` like passwords.

### 3. Start Postgres and the embeddings service

```bash
docker compose up -d db embeddings
```

First run takes 1–2 minutes because the embeddings container pre-downloads the `all-MiniLM-L6-v2` model into the image. Watch progress with:

```bash
docker compose logs -f embeddings
# Wait until you see: Uvicorn running on http://0.0.0.0:8000
```

> **Port 5434 already in use?** Edit `docker-compose.yml` and change the `db.ports` mapping to e.g. `"5435:5432"`, then update `DATABASE_URL` in `.env` to match.

### 4. Apply the database schema

```bash
npx prisma migrate dev --name init
```

This creates all tables and enables the `vector` extension.

> **"Drift detected" with the `vector` extension?** Run `docker compose down -v && docker compose up -d db` to wipe the volume, then re-run `npx prisma migrate dev --name init`. The migration owns the extension; if you also have an init script creating it, Prisma sees it as drift.

### 5. Seed 15 sample profiles + 1 HR user

```bash
npm run seed
```

The seed creates profiles, skills, and projects, then calls the embeddings service to compute a 384-dim vector for each profile. You should see:

```
Done — 15 profiles, 15 embeddings.

Login (password is "demo1234" for everyone):
  HR:       hr@skillshub.demo
  Employee: rahul@skillshub.demo  (and 14 others — see seed file)
```

If any profiles report `(no embedding)`, the embeddings service isn't reachable — fix it and re-run `npm run seed` (the seed resets data each time, so it's safe to repeat).

### 6. Start the dev server

```bash
npm run dev
```

Open <http://localhost:3000>. You'll be redirected to `/login`.

---

## Demo accounts

All passwords: `demo1234`

| Email | Role | Lands on |
|---|---|---|
| `hr@skillshub.demo` | HR | `/search` |
| `rahul@skillshub.demo` | Employee | `/my-profile` |
| `priya@skillshub.demo`, `amit@skillshub.demo`, … (15 total) | Employee | `/my-profile` |

See [`prisma/seed.ts`](prisma/seed.ts) for the full list and skill profiles.

---

## Demo flow (5 minutes)

### As HR (`hr@skillshub.demo`)

1. Land on `/search`. Click each of the example query chips — verify the top result is sensible:
   - *"Who can lead a React project that also needs WebSocket experience?"* → **Rahul Sharma**
   - *"Find me a backend dev in Pune with at least 3 years of Java and any payment gateway integration."* → **Priya Patel**
   - *"Senior frontend folks who haven't been on a new project recently."* → **Rahul** (idle since 2025-09-15)
   - *"I need someone for a mobile app — iOS specifically — with fintech background."* → **Anjali Gupta**
   - *"Anyone who knows ML and can build RAG systems?"* → **Manish Agarwal**
2. Click into any result to see the full profile (skills grouped by category, project timeline).
3. Go to **Directory** to browse all 15 with a filter input.

### As an employee (`rahul@skillshub.demo`)

1. Land on `/my-profile`.
2. Click **Choose PDF** → upload any resume.
3. Within a few seconds you'll see extracted skills + projects with **Approve / Reject** buttons.
4. Click **Approve**. The profile is saved and its embedding is refreshed — it now ranks in HR searches.

### Back as HR

1. Open `/review` — pending extractions from any employee appear here.
2. Open `/search` and search for something the new resume matches — it should appear in results.

---

## Project layout

```
prisma/
  schema.prisma                 # Postgres + pgvector data model
  seed.ts                       # 15 seeded profiles + HR user
  migrations/                   # generated by `prisma migrate dev`
embeddings/                     # Python FastAPI service
  main.py
  Dockerfile
  requirements.txt
docker/
  entrypoint.sh                 # Postgres-wait + migrate-deploy for the app container
src/
  app/
    api/
      auth/[...nextauth]/       # NextAuth route
      upload/resume/            # POST: PDF → text → LLM → PendingExtraction
      search/                   # POST: embed → pgvector top-20 → LLM rerank
      profiles/                 # GET list, GET/PATCH detail
      review/                   # queue, approve, reject
    (auth)/login/               # login page
    (dashboard)/                # everything behind auth
      layout.tsx                # role-aware top nav
      search/                   # HR: NL search UI
      directory/                # everyone: profile grid
      profiles/[id]/            # profile detail
      review/                   # HR: approve/reject pending extractions
      my-profile/               # employee: upload resume, review own pending
  components/
    ui/                         # shadcn/ui primitives
    extraction-card.tsx         # shared approve/reject card
  lib/
    ai.ts                       # ← single swap point for LLM provider
    db.ts                       # Prisma singleton
    auth.ts                     # NextAuth full config
    api-auth.ts                 # requireAuth / requireHR guards
  auth.config.ts                # Edge-safe NextAuth config (used by middleware)
  middleware.ts                 # protects HR-only page routes
docker-compose.yml              # db + embeddings (+ optional app) services
Dockerfile                      # production app image
```

---

## Architecture highlights

### Search flow

1. HR types a natural-language query.
2. `/api/search` POSTs the query text to the embeddings service → 384-dim vector.
3. Raw SQL via pgvector cosine distance returns the top-20 closest profiles.
4. Full profile data (skills, projects) is hydrated via Prisma.
5. The 20-candidate JSON + the query is sent to Groq for re-ranking + a one-sentence reasoning per top-5 result.
6. Search is logged to `SearchLog`.

### Extraction flow

1. Employee POSTs a PDF to `/api/upload/resume`.
2. The route saves the file under `./uploads/`, runs `pdf-parse` to get plain text.
3. Text + schema-locked prompt go to Groq. Response is JSON-validated with Zod, with one retry on validation failure.
4. Result is stored as a `PendingExtraction` and returned to the UI for review.
5. On approval (`/api/review/[id]/approve`), the profile is upserted, skills/projects are replaced, and the embedding is regenerated and written via raw SQL (`UPDATE profiles SET embedding = $1::vector`).

### Provider swap

All LLM calls go through `src/lib/ai.ts`. To swap from Groq to Gemini, OpenAI, Ollama, or anything else, change only the `chatJson()` helper at the top of that file. The public API (`extractResumeData`, `rankCandidates`) and the rest of the app are unchanged.

---

## Common scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server on :3000 |
| `npm run build && npm start` | Production build + start |
| `npm run seed` | Wipe and re-seed 15 profiles + HR user |
| `npx prisma studio` | Browser UI to inspect tables |
| `npx prisma migrate dev --name <name>` | Create + apply a new migration |
| `npx prisma generate` | Regenerate the Prisma client after schema edits |
| `docker compose up -d db embeddings` | Start dependencies |
| `docker compose down` | Stop dependencies (keep data) |
| `docker compose down -v` | Stop and wipe DB volume |
| `docker compose logs -f embeddings` | Follow embeddings service logs |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `bind: address already in use` on `5432` or `5434` | Pick a free port in `docker-compose.yml` (`db.ports`) and update `DATABASE_URL` in `.env`. `pg_lsclusters` shows local Postgres clusters using those ports. |
| `Drift detected: Added extensions: vector` | The `vector` extension was created outside Prisma. Run `docker compose down -v && docker compose up -d db` and re-run `npx prisma migrate dev --name init` — the migration owns the extension. |
| Search returns nothing | Either no profiles have embeddings, or the embeddings service is down. `docker compose logs embeddings` should show `Uvicorn running…`. Re-run `npm run seed` to backfill embeddings on existing profiles. |
| `GROQ_API_KEY is not set` | Ensure `.env` has a real key and **restart `npm run dev`** — env vars are only read on process start. |
| `ReferenceError: File is not defined` on upload | You're on Node < 20 and using an older code revision. Pull latest — the route uses duck-typing instead of `instanceof File`. |
| `Attempted import error … pdf.worker.mjs?url` on upload | Old `pdf-parse@2.x` artifact. Re-run `npm install` to pick up the locked v1.x version. |
| Approve says "embedding service unreachable" | The embeddings container is down. `docker compose up -d embeddings`, then re-approve. |

---

## License

Private hackathon project. Adjust as needed.

--to see the local host db
## npx prisma studio