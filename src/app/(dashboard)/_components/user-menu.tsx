"use client";

import { signOut } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function UserMenu({ name, role }: { name: string; role: "HR" | "EMPLOYEE" }) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2">
        <span className="text-sm text-slate-600">{name}</span>
        <Badge variant={role === "HR" ? "default" : "secondary"}>{role}</Badge>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
