import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, MapPin, Briefcase, UserCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MyProfileClient } from "./my-profile-client";
import type { ExtractedProfile } from "@/components/extraction-card";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function MyProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [profile, pending, submitted] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { skills: { take: 10, orderBy: { yearsExperience: "desc" } } },
    }),
    prisma.pendingExtraction.findMany({
      where: { userId: session.user.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pendingExtraction.findFirst({
      where: { userId: session.user.id, status: "EMPLOYEE_APPROVED" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const pendingForClient = pending.map((p) => ({
    id: p.id,
    createdAt: p.createdAt.toISOString(),
    extracted: p.extracted,
  }));

  // If HR hasn't approved yet but the employee has submitted, show the submitted
  // resume content as the profile. Display is identical regardless of HR status.
  const submittedProfile = submitted
    ? (submitted.extracted as unknown as ExtractedProfile)
    : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My profile</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Upload your resume — SkillsHub extracts your skills, projects, and proficiency for review.
        </p>
      </div>

      {profile ? (
        <Card className="border-slate-200/70 overflow-hidden">
          <div className="gradient-aurora p-5 border-b border-slate-200/70">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-semibold shadow-sm shrink-0">
                {initials(profile.fullName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-900">{profile.fullName}</h2>
                  {profile.available ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Available
                    </Badge>
                  ) : (
                    <Badge variant="secondary">On project</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> {profile.yearsExperience} years
                  </span>
                </div>
              </div>
            </div>
          </div>
          <CardContent className="p-5">
            {profile.summary && (
              <p className="text-sm text-slate-700 leading-relaxed">{profile.summary}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {profile.skills.map((s) => (
                <Badge
                  key={s.id}
                  variant="outline"
                  className="font-normal bg-slate-50 border-slate-200"
                >
                  {s.name}
                </Badge>
              ))}
            </div>
            <div className="mt-5">
              <Link href={`/profiles/${profile.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 group">
                  View full profile
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : submittedProfile ? (
        <Card className="border-slate-200/70 overflow-hidden">
          <div className="gradient-aurora p-5 border-b border-slate-200/70">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-semibold shadow-sm shrink-0">
                {initials(submittedProfile.fullName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-900">{submittedProfile.fullName}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                  {submittedProfile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {submittedProfile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> {submittedProfile.yearsExperience} years
                  </span>
                </div>
              </div>
            </div>
          </div>
          <CardContent className="p-5">
            {submittedProfile.summary && (
              <p className="text-sm text-slate-700 leading-relaxed">{submittedProfile.summary}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {submittedProfile.skills.map((s, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="font-normal bg-slate-50 border-slate-200"
                >
                  {s.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-slate-300 bg-slate-50/50">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <UserCircle2 className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900">No profile yet</h3>
            <p className="text-sm text-slate-500 mt-1">Upload a resume below to create one.</p>
          </CardContent>
        </Card>
      )}

      <MyProfileClient initialPending={pendingForClient} />
    </div>
  );
}
