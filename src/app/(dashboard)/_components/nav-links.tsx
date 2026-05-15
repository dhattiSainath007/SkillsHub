"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Users, Inbox, UserCircle2 } from "lucide-react";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Search;
  /** Key matched against `badges` to render a count next to the label. */
  badgeKey?: "review";
};

const HR_LINKS: NavItem[] = [
  { href: "/search", label: "Search", icon: Search },
  { href: "/directory", label: "Directory", icon: Users },
  { href: "/review", label: "Review", icon: Inbox, badgeKey: "review" },
];

const EMPLOYEE_LINKS: NavItem[] = [
  { href: "/my-profile", label: "My Profile", icon: UserCircle2 },
  { href: "/directory", label: "Directory", icon: Users },
];

export function NavLinks({
  role,
  reviewCount = 0,
}: {
  role: Role;
  reviewCount?: number;
}) {
  const pathname = usePathname();
  const links = role === "HR" ? HR_LINKS : EMPLOYEE_LINKS;
  const badges: Record<string, number> = { review: reviewCount };

  return (
    <nav className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-slate-100/80">
      {links.map((l) => {
        const Icon = l.icon;
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        const count = l.badgeKey ? badges[l.badgeKey] ?? 0 : 0;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "relative px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            <Icon className="h-4 w-4" />
            {l.label}
            {count > 0 && (
              <span
                className={cn(
                  "ml-0.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold tabular-nums",
                  active
                    ? "bg-rose-100 text-rose-700"
                    : "bg-rose-500 text-white shadow-sm",
                )}
                title={`${count} pending`}
              >
                {count > 99 ? "99+" : count}
                <span
                  className={cn(
                    "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full",
                    active ? "bg-rose-400" : "bg-rose-300",
                  )}
                >
                  <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-75" />
                </span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
