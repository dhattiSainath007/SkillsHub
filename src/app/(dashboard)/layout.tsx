import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NavLinks } from "./_components/nav-links";
import { UserMenu } from "./_components/user-menu";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // HR-only badge: how many submissions are waiting for final approval right now.
  const reviewCount =
    session.user.role === "HR"
      ? await prisma.pendingExtraction.count({
          where: { status: "EMPLOYEE_APPROVED" },
        })
      : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm transition-transform group-hover:scale-105">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-lg">
              Skills<span className="text-primary">Hub</span>
            </span>
          </Link>
          <NavLinks role={session.user.role} reviewCount={reviewCount} />
          <UserMenu
            name={session.user.name ?? session.user.email ?? ""}
            email={session.user.email ?? ""}
            role={session.user.role}
          />
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">{children}</main>
    </div>
  );
}
