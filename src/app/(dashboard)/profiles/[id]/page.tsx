import { notFound, redirect } from "next/navigation";
import { MapPin, Briefcase, Calendar } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SkillCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  LANGUAGE: "Languages",
  FRAMEWORK: "Frameworks",
  PLATFORM: "Platforms",
  TOOL: "Tools",
  DOMAIN: "Domains",
};

const PROFICIENCY_COLORS: Record<string, string> = {
  EXPERT: "bg-emerald-100 text-emerald-800 border-emerald-200",
  INTERMEDIATE: "bg-blue-100 text-blue-800 border-blue-200",
  NOVICE: "bg-slate-100 text-slate-700 border-slate-200",
};

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { email: true, name: true } },
      skills: { orderBy: [{ category: "asc" }, { yearsExperience: "desc" }] },
      projects: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!profile) notFound();

  const grouped = profile.skills.reduce<Record<SkillCategory, typeof profile.skills>>(
    (acc, s) => {
      (acc[s.category] ??= []).push(s);
      return acc;
    },
    {} as Record<SkillCategory, typeof profile.skills>,
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{profile.fullName}</h1>
              <p className="text-sm text-muted-foreground">{profile.user.email}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mt-3">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" /> {profile.yearsExperience} years
                </span>
                {profile.lastProjectEnd && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Last project ended{" "}
                    {profile.lastProjectEnd.toISOString().slice(0, 10)}
                  </span>
                )}
              </div>
            </div>
            {profile.available ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-600">Available</Badge>
            ) : (
              <Badge variant="secondary">On project</Badge>
            )}
          </div>
          {profile.summary && (
            <p className="text-slate-700 mt-4 leading-relaxed">{profile.summary}</p>
          )}
        </CardContent>
      </Card>

      <section>
        <h2 className="font-semibold mb-3">Skills</h2>
        <div className="space-y-3">
          {(Object.keys(CATEGORY_LABELS) as SkillCategory[]).map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            return (
              <Card key={cat}>
                <CardContent className="p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    {CATEGORY_LABELS[cat]}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {items.map((s) => (
                      <span
                        key={s.id}
                        className={`px-2.5 py-1 rounded-md text-xs border ${PROFICIENCY_COLORS[s.proficiency]}`}
                        title={`${s.proficiency.toLowerCase()} · ${s.yearsExperience} yrs${s.inferred ? " (inferred)" : ""}`}
                      >
                        {s.name}
                        <span className="ml-1.5 opacity-60">{s.yearsExperience}y</span>
                        {s.inferred && <span className="ml-1 opacity-50">·inferred</span>}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {profile.projects.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">Projects</h2>
          <div className="space-y-3">
            {profile.projects.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium">{p.name}</h3>
                    <Badge variant="outline">{p.durationMonths} mo</Badge>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">{p.description}</p>
                  {p.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.technologies.map((t) => (
                        <Badge key={t} variant="outline" className="font-normal text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
