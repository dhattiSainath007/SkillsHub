"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function DirectorySearch({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(`/directory${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form onSubmit={submit} className="relative w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Name, location, or skill"
        className="pl-9"
      />
    </form>
  );
}
