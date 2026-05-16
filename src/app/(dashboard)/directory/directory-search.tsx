"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 300;

function buildUrl(q: string): string {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  return `/directory${params.toString() ? `?${params.toString()}` : ""}`;
}

export function DirectorySearch({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  // Track the trimmed query string we last pushed to the URL.
  // When `initial` changes we use this to distinguish:
  //   (a) we caused the change (debounce / Enter / clear) → don't touch the input
  //   (b) an external nav caused it (browser back/forward) → adopt the new value
  const lastPushedRef = useRef(initial.trim());

  useEffect(() => {
    if (initial.trim() !== lastPushedRef.current) {
      setValue(initial);
      lastPushedRef.current = initial.trim();
    }
  }, [initial]);

  // Debounced push: 300 ms after the user stops typing, sync the URL.
  // We compare against lastPushedRef (what's really in the URL right now),
  // not against `initial` (which can lag a render behind the push).
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === lastPushedRef.current) return;
    const timer = setTimeout(() => {
      lastPushedRef.current = trimmed;
      router.replace(buildUrl(trimmed), { scroll: false });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, router]);

  function commit(next: string) {
    const trimmed = next.trim();
    lastPushedRef.current = trimmed;
    router.replace(buildUrl(trimmed), { scroll: false });
  }

  function clearNow() {
    setValue("");
    commit("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        commit(value);
      }}
      className="relative w-full sm:w-72"
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Name, location, or skill"
        className="pl-9 pr-9 h-10 bg-white shadow-soft focus-visible:ring-primary"
      />
      {value && (
        <button
          type="button"
          onClick={clearNow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Clear"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
