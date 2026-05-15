"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ExtractionCard, type ExtractionItem } from "@/components/extraction-card";
import { useToast } from "@/hooks/use-toast";

export function ReviewClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<ExtractionItem[] | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/review/queue");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load queue");
      setItems(data.items ?? []);
    } catch (err) {
      toast({
        title: "Failed to load review queue",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Called after Approve/Reject — refresh the queue AND the layout's
  // server-rendered nav badge count.
  const onItemHandled = useCallback(() => {
    load();
    router.refresh();
  }, [load, router]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Review queue</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Submissions employees have already self-reviewed. Approving creates or updates their
            profile and refreshes the search embedding.
          </p>
        </div>
        {items && items.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            {items.length} pending
          </div>
        )}
      </div>

      {items === null && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <Card key={i} className="border-slate-200/70">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="skeleton h-11 w-11 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-1/3" />
                    <div className="skeleton h-3 w-2/3" />
                  </div>
                </div>
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {items && items.length === 0 && (
        <Card className="border-dashed border-slate-300 bg-slate-50/50">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Inbox className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900">All caught up</h3>
            <p className="text-sm text-slate-500 mt-1">Nothing waiting for review.</p>
          </CardContent>
        </Card>
      )}

      {items && items.length > 0 && (
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={it.id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
              <ExtractionCard item={it} mode="hr" onDone={onItemHandled} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
