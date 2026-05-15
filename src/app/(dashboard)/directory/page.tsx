import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, Briefcase, Users, FolderKanban } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DirectorySearch } from "./directory-search";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_GRADIENTS = [
  "from-violet-500 to-fuchsia-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-indigo-500 to-purple-500",
];

function gradientFor(id: string): string {
  const i = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[i];
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const q = searchParams.q?.trim();
  const where: Prisma.ProfileWhereInput = q
    ? {
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
          { skills: { some: { name: { contains: q, mode: "insensitive" } } } },
        ],
      }
    : {};

  const profiles = await prisma.profile.findMany({
    where,
    include: {
      skills: { take: 6, orderBy: { yearsExperience: "desc" } },
      _count: { select: { projects: true } },
    },
    orderBy: { fullName: "asc" },
  });

  const available = profiles.filter((p) => p.available).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Directory</h1>
          <p className="text-sm text-slate-600 mt-1">
            <span className="font-medium text-slate-900">{profiles.length}</span>{" "}
            {profiles.length === 1 ? "profile" : "profiles"}
            {profiles.length > 0 && (
              <>
                {" · "}
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700 font-medium">{available} available</span>
                </span>
              </>
            )}
            {q ? ` matching “${q}”` : ""}
          </p>
        </div>
        <DirectorySearch initial={q ?? ""} />
      </div>

      {profiles.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-slate-50/50">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Users className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900">No profiles found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {q ? `Nothing matches "${q}". Try a different keyword.` : "No profiles in the system yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p, i) => (
            <Link key={p.id} href={`/profiles/${p.id}`} className="block">
              <Card
                className="h-full card-hover border-slate-200/70 animate-fade-in"
                style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${gradientFor(p.id)} text-white font-semibold shadow-sm shrink-0`}
                    >
                      {initials(p.fullName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold leading-tight text-slate-900 truncate">
                        {p.fullName}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        {p.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {p.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" /> {p.yearsExperience}y
                        </span>
                      </div>
                    </div>
                    {p.available ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 gap-1 text-[10px] font-semibold uppercase tracking-wider">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Free
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wider">
                        Busy
                      </Badge>
                    )}
                  </div>
                  {p.summary && (
                    <p className="text-sm text-slate-600 mt-3 line-clamp-2">{p.summary}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {p.skills.slice(0, 5).map((s) => (
                      <Badge
                        key={s.id}
                        variant="outline"
                        className="font-normal text-xs bg-slate-50 border-slate-200"
                      >
                        {s.name}
                      </Badge>
                    ))}
                    {p.skills.length > 5 && (
                      <Badge variant="outline" className="font-normal text-xs bg-white">
                        +{p.skills.length - 5}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs text-slate-500">
                    <FolderKanban className="h-3 w-3" />
                    {p._count.projects} {p._count.projects === 1 ? "project" : "projects"}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
