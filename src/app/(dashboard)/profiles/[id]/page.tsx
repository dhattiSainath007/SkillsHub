import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Briefcase,
  Calendar,
  Mail,
  ArrowLeft,
  Code2,
  Layers,
  Server,
  Wrench,
  Target,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SkillCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

const CATEGORY_META: Record<SkillCategory, { label: string; icon: typeof Code2; tint: string }> = {
  LANGUAGE:  { label: "Languages",  icon: Code2,  tint: "bg-violet-50 text-violet-700 border-violet-200" },
  FRAMEWORK: { label: "Frameworks", icon: Layers, tint: "bg-blue-50 text-blue-700 border-blue-200" },
  PLATFORM:  { label: "Platforms",  icon: Server, tint: "bg-teal-50 text-teal-700 border-teal-200" },
  TOOL:      { label: "Tools",      icon: Wrench, tint: "bg-amber-50 text-amber-700 border-amber-200" },
  DOMAIN:    { label: "Domains",    icon: Target, tint: "bg-rose-50 text-rose-700 border-rose-200" },
};

const PROFICIENCY_BAR: Record<string, { w: string; color: string; label: string }> = {
  EXPERT:       { w: "w-full",     color: "bg-emerald-500", label: "Expert" },
  INTERMEDIATE: { w: "w-2/3",      color: "bg-blue-500",    label: "Intermediate" },
  NOVICE:       { w: "w-1/3",      color: "bg-slate-400",   label: "Novice" },
};

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

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
      <Link
        href="/directory"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to directory
      </Link>

      {/* Hero card */}
      <Card className="border-slate-200/70 overflow-hidden">
        <div className="gradient-aurora p-6 sm:p-8 border-b border-slate-200/70">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-2xl font-bold shadow-lg shrink-0">
              {initials(profile.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  {profile.fullName}
                </h1>
                {profile.available ? (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Available
                  </Badge>
                ) : (
                  <Badge variant="secondary">On project</Badge>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {profile.user.email}
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-700 mt-4">
                {profile.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400" /> {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-slate-400" /> {profile.yearsExperience} years experience
                </span>
                {profile.lastProjectEnd && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Last project ended {profile.lastProjectEnd.toISOString().slice(0, 10)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        {profile.summary && (
          <div className="p-6 sm:p-8">
            <p className="text-slate-700 leading-relaxed text-pretty">{profile.summary}</p>
          </div>
        )}
      </Card>

      {/* Skills grouped */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Skills</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {(Object.keys(CATEGORY_META) as SkillCategory[]).map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            const { label, icon: Icon, tint } = CATEGORY_META[cat];
            return (
              <Card key={cat} className="border-slate-200/70">
                <CardContent className="p-4">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold mb-3 border ${tint}`}>
                    <Icon className="h-3 w-3" />
                    {label}
                  </div>
                  <div className="space-y-2.5">
                    {items.map((s) => {
                      const bar = PROFICIENCY_BAR[s.proficiency];
                      return (
                        <div key={s.id} className="text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-medium text-slate-900 truncate">{s.name}</span>
                              {s.inferred && (
                                <span className="text-[10px] uppercase tracking-wider text-slate-400">
                                  inferred
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 shrink-0">
                              {bar.label} · {s.yearsExperience}y
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full rounded-full ${bar.color} ${bar.w}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Projects */}
      {profile.projects.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Projects</h2>
          <div className="space-y-3">
            {profile.projects.map((p, i) => (
              <Card
                key={p.id}
                className="border-slate-200/70 card-hover animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-900">{p.name}</h3>
                    <Badge variant="outline" className="font-normal text-xs shrink-0">
                      {p.durationMonths} {p.durationMonths === 1 ? "mo" : "mos"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{p.description}</p>
                  {p.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {p.technologies.map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="font-normal text-xs bg-slate-50 border-slate-200"
                        >
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
