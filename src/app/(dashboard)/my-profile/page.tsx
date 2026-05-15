import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MyProfileClient } from "./my-profile-client";

export const dynamic = "force-dynamic";

export default async function MyProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [profile, pending] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { skills: { take: 8 } },
    }),
    prisma.pendingExtraction.findMany({
      where: { userId: session.user.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const pendingForClient = pending.map((p) => ({
    id: p.id,
    createdAt: p.createdAt.toISOString(),
    extracted: p.extracted,
  }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your resume — SkillsHub extracts your skills and projects for review.
        </p>
      </div>

      {profile ? (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{profile.fullName}</h2>
                <p className="text-sm text-muted-foreground">
                  {profile.location ?? "Location not set"} · {profile.yearsExperience} years
                </p>
              </div>
              {profile.available ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-600">Available</Badge>
              ) : (
                <Badge variant="secondary">On project</Badge>
              )}
            </div>
            {profile.summary && (
              <p className="text-sm text-slate-700 mt-3">{profile.summary}</p>
            )}
            <div className="flex flex-wrap gap-1 mt-3">
              {profile.skills.map((s) => (
                <Badge key={s.id} variant="outline" className="font-normal">
                  {s.name}
                </Badge>
              ))}
            </div>
            <div className="mt-4">
              <Link href={`/profiles/${profile.id}`}>
                <Button variant="outline" size="sm">View full profile</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            You don&apos;t have a profile yet. Upload a resume to create one.
          </CardContent>
        </Card>
      )}

      <MyProfileClient initialPending={pendingForClient} />
    </div>
  );
}
