"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";

const HR_LINKS = [
  { href: "/search", label: "Search" },
  { href: "/directory", label: "Directory" },
  { href: "/review", label: "Review" },
];

const EMPLOYEE_LINKS = [
  { href: "/my-profile", label: "My Profile" },
  { href: "/directory", label: "Directory" },
];

export function NavLinks({ role }: { role: Role }) {
  const pathname = usePathname();
  const links = role === "HR" ? HR_LINKS : EMPLOYEE_LINKS;

  return (
    <nav className="flex items-center gap-1">
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              active
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
