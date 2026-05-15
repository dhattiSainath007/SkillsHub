"use client";

/**
 * Reusable card showing an AI-extracted profile from a pending resume,
 * with Approve / Reject buttons. Used by both the HR review queue and
 * the employee's own "my profile" upload preview.
 */
import { useState, useTransition } from "react";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type ExtractedSkill = {
  name: string;
  category: string;
  proficiency: string;
  yearsExperience: number;
  inferred: boolean;
};

type ExtractedProject = {
  name: string;
  description: string;
  technologies: string[];
  durationMonths: number;
};

export type ExtractedProfile = {
  fullName: string;
  location: string | null;
  yearsExperience: number;
  summary: string;
  skills: ExtractedSkill[];
  projects: ExtractedProject[];
};

export type ExtractionItem = {
  id: string;
  uploader?: { id: string; name: string; email: string };
  createdAt?: string | Date;
  extracted: ExtractedProfile;
};

export function ExtractionCard({
  item,
  onDone,
}: {
  item: ExtractionItem;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function approve() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/review/${item.id}/approve`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Approval failed");
        toast({
          title: "Approved",
          description: data.embeddingOk
            ? "Profile saved and embedding regenerated."
            : "Profile saved (embedding service unreachable — re-approve later to backfill).",
        });
        onDone();
      } catch (err) {
        toast({
          title: "Approval failed",
          description: (err as Error).message,
          variant: "destructive",
        });
      }
    });
  }

  function reject() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/review/${item.id}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Reject failed");
        toast({ title: "Rejected", description: "Extraction discarded." });
        onDone();
      } catch (err) {
        toast({
          title: "Reject failed",
          description: (err as Error).message,
          variant: "destructive",
        });
      }
    });
  }

  const { extracted: e } = item;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{e.fullName}</h3>
              {e.location && (
                <span className="text-sm text-muted-foreground">· {e.location}</span>
              )}
              <Badge variant="outline">{e.yearsExperience} yrs</Badge>
            </div>
            {item.uploader && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Uploaded by {item.uploader.name} ({item.uploader.email})
                {item.createdAt && ` · ${new Date(item.createdAt).toLocaleDateString()}`}
              </p>
            )}
            <p className="text-sm text-slate-700 mt-2">{e.summary}</p>

            <button
              onClick={() => setOpen((v) => !v)}
              className="mt-3 text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {open ? "Hide details" : `Show ${e.skills.length} skills · ${e.projects.length} projects`}
            </button>

            {open && (
              <div className="mt-3 space-y-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
                    Skills
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {e.skills.map((s, i) => (
                      <Badge key={i} variant="outline" className="font-normal" title={s.category}>
                        {s.name}
                        <span className="ml-1 opacity-60">
                          {s.proficiency.toLowerCase()} · {s.yearsExperience}y
                        </span>
                        {s.inferred && <span className="ml-1 opacity-50">·inferred</span>}
                      </Badge>
                    ))}
                  </div>
                </div>
                {e.projects.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
                      Projects
                    </div>
                    <div className="space-y-2">
                      {e.projects.map((p, i) => (
                        <div key={i} className="text-sm bg-slate-50 p-3 rounded-md">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{p.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {p.durationMonths} mo
                            </Badge>
                          </div>
                          <p className="text-slate-700 text-xs mt-1">{p.description}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {p.technologies.map((t) => (
                              <span key={t} className="text-xs text-slate-500">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Button size="sm" onClick={approve} disabled={pending}>
              <Check className="h-4 w-4 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="outline" onClick={reject} disabled={pending}>
              <X className="h-4 w-4 mr-1" /> Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
