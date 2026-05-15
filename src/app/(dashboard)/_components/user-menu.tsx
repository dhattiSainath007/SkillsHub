"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function UserMenu({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: "HR" | "EMPLOYEE";
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "hidden sm:flex items-center gap-2.5 px-2.5 py-1 rounded-lg border bg-white",
          role === "HR" ? "border-violet-200" : "border-slate-200",
        )}
      >
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white",
            role === "HR"
              ? "bg-gradient-to-br from-violet-500 to-fuchsia-500"
              : "bg-gradient-to-br from-slate-500 to-slate-700",
          )}
          title={name}
        >
          {initials(name || email)}
        </div>
        <div className="leading-tight pr-1">
          <div className="text-xs font-medium text-slate-900">{name || email}</div>
          <div
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wider",
              role === "HR" ? "text-violet-600" : "text-slate-500",
            )}
          >
            {role}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
        title="Sign out"
        className="text-slate-600 hover:text-rose-600"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
