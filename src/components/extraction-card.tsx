"use client";

/**
 * Reusable card showing an AI-extracted profile from a pending resume,
 * with Approve / Reject buttons. Used by both the HR review queue and
 * the employee's own "my profile" upload preview.
 */
import { useState, useTransition } from "react";
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Mail,
  Clock,
} from "lucide-react";
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

export type ExtractionMode = "employee" | "hr";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function relativeTime(value: string | Date | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function ExtractionCard({
  item,
  mode,
  onDone,
}: {
  item: ExtractionItem;
  mode: ExtractionMode;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [open, setOpen] = useState(false);

  // Copy varies between the two review steps.
  const COPY =
    mode === "employee"
      ? {
          approveLabel: "Submit for HR",
          rejectLabel: "Discard",
          approveToastTitle: "Submitted for HR review",
          approveToastBody: "Your HR team will get final approval.",
          rejectToastTitle: "Draft discarded",
          stepBadge: "Step 1 of 2 · Your review",
          stepTint: "bg-amber-100 text-amber-700 border-amber-200",
        }
      : {
          approveLabel: "Approve",
          rejectLabel: "Reject",
          approveToastTitle: "Profile approved",
          approveToastBody: "Saved and embedding regenerated. Searchable now.",
          rejectToastTitle: "Submission rejected",
          stepBadge: "Step 2 of 2 · HR approval",
          stepTint: "bg-violet-100 text-violet-700 border-violet-200",
        };

  function approve() {
    setAction("approve");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/review/${item.id}/approve`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Approval failed");
        toast({
          title: COPY.approveToastTitle,
          description:
            mode === "hr" && !data.embeddingOk
              ? "Saved (embedding service unreachable — re-approve later to backfill)."
              : COPY.approveToastBody,
        });
        onDone();
      } catch (err) {
        toast({
          title: "Approval failed",
          description: (err as Error).message,
          variant: "destructive",
        });
      } finally {
        setAction(null);
      }
    });
  }

  function reject() {
    setAction("reject");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/review/${item.id}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Reject failed");
        toast({ title: COPY.rejectToastTitle, description: "Discarded." });
        onDone();
      } catch (err) {
        toast({
          title: "Reject failed",
          description: (err as Error).message,
          variant: "destructive",
        });
      } finally {
        setAction(null);
      }
    });
  }

  const { extracted: e } = item;

  return (
    <Card className="border-slate-200/70 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white font-semibold text-sm shrink-0 shadow-sm">
              {initials(e.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-900">{e.fullName}</h3>
                {e.location && (
                  <span className="text-sm text-slate-500">· {e.location}</span>
                )}
                <Badge variant="outline" className="font-normal">
                  {e.yearsExperience} yrs
                </Badge>
                <Badge
                  className={`hover:bg-current/0 ${COPY.stepTint} gap-1 text-[10px] font-semibold uppercase tracking-wider`}
                >
                  <Sparkles className="h-3 w-3" />
                  {COPY.stepBadge}
                </Badge>
              </div>
              {item.uploader && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {item.uploader.email}
                  </span>
                  {item.createdAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {relativeTime(item.createdAt)}
                    </span>
                  )}
                </div>
              )}
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">{e.summary}</p>

              <button
                onClick={() => setOpen((v) => !v)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {open
                  ? "Hide details"
                  : `Show ${e.skills.length} skills · ${e.projects.length} projects`}
              </button>

              {open && (
                <div className="mt-3 space-y-3 animate-fade-in">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">
                      Skills
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {e.skills.map((s, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="font-normal bg-slate-50 border-slate-200"
                          title={s.category}
                        >
                          {s.name}
                          <span className="ml-1 text-slate-500 text-xs">
                            {s.proficiency.toLowerCase()} · {s.yearsExperience}y
                          </span>
                          {s.inferred && (
                            <span className="ml-1 text-[10px] uppercase tracking-wider text-amber-600">
                              inferred
                            </span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {e.projects.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">
                        Projects
                      </div>
                      <div className="space-y-2">
                        {e.projects.map((p, i) => (
                          <div
                            key={i}
                            className="rounded-lg bg-slate-50 border border-slate-200/70 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-slate-900">
                                {p.name}
                              </span>
                              <Badge variant="outline" className="text-xs font-normal">
                                {p.durationMonths} mo
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {p.description}
                            </p>
                            {p.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {p.technologies.map((t) => (
                                  <span
                                    key={t}
                                    className="text-[10px] text-slate-500"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 min-w-[8.5rem]">
            <Button
              size="sm"
              onClick={approve}
              disabled={pending}
              className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
            >
              {pending && action === "approve" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {COPY.approveLabel}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={reject}
              disabled={pending}
              className="gap-1.5 text-slate-700 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50"
            >
              {pending && action === "reject" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              {COPY.rejectLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
