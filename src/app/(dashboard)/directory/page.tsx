import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, Briefcase } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DirectorySearch } from "./directory-search";

export const dynamic = "force-dynamic";

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

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {profiles.length} {profiles.length === 1 ? "profile" : "profiles"}
            {q ? ` matching "${q}"` : ""}
          </p>
        </div>
        <DirectorySearch initial={q ?? ""} />
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No profiles found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p) => (
            <Link key={p.id} href={`/profiles/${p.id}`} className="block">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{p.fullName}</h3>
                    {p.available ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600">Available</Badge>
                    ) : (
                      <Badge variant="secondary">On project</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    {p.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {p.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> {p.yearsExperience} yrs
                    </span>
                  </div>
                  {p.summary && (
                    <p className="text-sm text-slate-600 mt-3 line-clamp-2">{p.summary}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {p.skills.map((s) => (
                      <Badge key={s.id} variant="outline" className="font-normal text-xs">
                        {s.name}
                      </Badge>
                    ))}
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
