"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search as SearchIcon, MapPin, Briefcase, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Find the right person</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ask in plain English. SkillsHub ranks by semantic match and explains why.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Senior React dev with Socket.IO experience and payment integration"
            className="pl-9"
            disabled={pending}
          />
        </div>
        <Button type="submit" disabled={pending || !query.trim()}>
          {pending ? "Searching…" : "Search"}
        </Button>
      </form>

      {results === null && (
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Try one of these:
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => runSearch(q)}
                className="text-xs text-left px-3 py-1.5 rounded-full bg-white border hover:border-slate-400 hover:bg-slate-50 transition-colors"
                disabled={pending}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {pending && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-white border animate-pulse" />
          ))}
        </div>
      )}

      {!pending && results && results.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No matching profiles. Try different wording.
          </CardContent>
        </Card>
      )}

      {!pending && results && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r) => (
            <Card key={r.profileId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profiles/${r.profile.id}`}
                        className="text-lg font-semibold hover:underline"
                      >
                        {r.profile.fullName}
                      </Link>
                      {r.profile.available ? (
                        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600">
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="secondary">On project</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      {r.profile.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {r.profile.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> {r.profile.yearsExperience} yrs
                      </span>
                    </div>
                    <div className="mt-3 flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-sm">{r.reasoning}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.profile.skills.slice(0, 8).map((s) => (
                        <Badge key={s.id} variant="outline" className="font-normal">
                          {s.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-3xl font-bold text-emerald-600">{r.matchScore}</div>
                    <div className="text-xs text-muted-foreground">match</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
