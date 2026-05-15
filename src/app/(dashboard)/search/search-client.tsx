"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search as SearchIcon,
  MapPin,
  Briefcase,
  Sparkles,
  ArrowRight,
  Loader2,
  X,
  SearchX,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type SearchResult = {
  profileId: string;
  matchScore: number;
  reasoning: string;
  profile: {
    id: string;
    fullName: string;
    location: string | null;
    yearsExperience: number;
    summary: string | null;
    available: boolean;
    skills: { id: string; name: string; proficiency: string; yearsExperience: number }[];
  };
};

const EXAMPLE_QUERIES = [
  "Who can lead a React project that also needs WebSocket experience?",
  "Find me a backend dev in Pune with at least 3 years of Java and any payment gateway integration.",
  "Senior frontend folks who haven't been on a new project recently.",
  "I need someone for a mobile app — iOS specifically — with fintech background.",
  "Anyone who knows ML and can build RAG systems?",
];

function scoreColor(score: number): string {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-blue-600";
  if (score >= 50) return "text-amber-600";
  return "text-slate-600";
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function SearchClient() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [pending, startTransition] = useTransition();

  function runSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    startTransition(async () => {
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Search failed");
        setResults(data.results ?? []);
      } catch (err) {
        toast({
          title: "Search failed",
          description: (err as Error).message,
          variant: "destructive",
        });
      }
    });
  }

  function clearAll() {
    setQuery("");
    setResults(null);
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-8 gradient-aurora">
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-medium mb-4">
            <Sparkles className="h-3 w-3" />
            Semantic search · AI-ranked
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Find the right person for the work.
          </h1>
          <p className="text-slate-600 mt-2 text-pretty">
            Ask in plain English. SkillsHub ranks by meaning and explains why each match fits.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(query);
            }}
            className="mt-6 flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1 group">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-primary" />
              <Input
                value={query}
                onChange={(e) => {
                  const v = e.target.value;
                  setQuery(v);
                  if (v.trim() === "") setResults(null);
                }}
                placeholder="e.g. Senior React dev with Socket.IO experience and payment integration"
                className="pl-10 pr-10 h-12 text-sm bg-white shadow-soft focus-visible:ring-primary"
                disabled={pending}
              />
              {query && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label="Clear"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-12 px-6 gap-2 group"
              disabled={pending || !query.trim()}
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                </>
              ) : (
                <>
                  Search
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Suggestions — only when no search has run yet */}
      {results === null && !pending && (
        <div className="animate-fade-in-delayed">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-3">
            Try one of these
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => runSearch(q)}
                className="text-xs text-left px-3.5 py-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-primary/40 hover:bg-violet-50 hover:text-violet-900 transition-colors duration-150"
                disabled={pending}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {pending && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="border-slate-200/70">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="skeleton h-11 w-11 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-1/3" />
                    <div className="skeleton h-3 w-2/3" />
                  </div>
                  <div className="skeleton h-10 w-12 rounded-md" />
                </div>
                <div className="skeleton h-3 w-full" />
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} className="skeleton h-5 w-16 rounded-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty results */}
      {!pending && results && results.length === 0 && (
        <Card className="border-dashed border-slate-300 bg-slate-50/50">
          <CardContent className="py-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <SearchX className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900">No matching profiles</h3>
            <p className="text-sm text-slate-500 mt-1">
              Try different wording, or broaden the query.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!pending && results && results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              {results.length} {results.length === 1 ? "match" : "matches"}
            </p>
          </div>
          <div className="space-y-3">
            {results.map((r, i) => (
              <Card
                key={r.profileId}
                className="border-slate-200/70 card-hover group animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-semibold text-sm shadow-sm shrink-0">
                        {initials(r.profile.fullName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/profiles/${r.profile.id}`}
                            className="text-base font-semibold text-slate-900 group-hover:text-primary transition-colors"
                          >
                            {r.profile.fullName}
                          </Link>
                          {r.profile.available ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 gap-1 font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Available
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="font-medium">
                              On project
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          {r.profile.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {r.profile.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> {r.profile.yearsExperience} years
                          </span>
                        </div>
                        <div className="mt-3 flex items-start gap-2 rounded-lg bg-violet-50/60 border border-violet-100 px-3 py-2">
                          <Sparkles className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                          <p className="text-sm text-slate-700">{r.reasoning}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {r.profile.skills.slice(0, 8).map((s) => (
                            <Badge
                              key={s.id}
                              variant="outline"
                              className="font-normal text-xs bg-slate-50 border-slate-200 hover:bg-slate-100"
                            >
                              {s.name}
                            </Badge>
                          ))}
                          {r.profile.skills.length > 8 && (
                            <Badge variant="outline" className="font-normal text-xs bg-white border-slate-200">
                              +{r.profile.skills.length - 8} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <div className={cn("text-3xl font-bold tabular-nums", scoreColor(r.matchScore))}>
                        {r.matchScore}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                        match
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <Link
                      href={`/profiles/${r.profile.id}`}
                      className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                    >
                      View full profile
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
