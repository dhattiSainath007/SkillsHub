import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Sparkles } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            SkillsHub
          </Link>
          <NavLinks role={session.user.role} />
          <UserMenu name={session.user.name ?? session.user.email ?? ""} role={session.user.role} />
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
