"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ExtractionCard, type ExtractionItem } from "@/components/extraction-card";
import { useToast } from "@/hooks/use-toast";

export function ReviewClient() {
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

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-extracted profiles waiting for approval. Approving creates/updates the employee&apos;s
          profile and refreshes their embedding.
        </p>
      </div>

      {items === null && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-white border animate-pulse" />
          ))}
        </div>
      )}

      {items && items.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nothing waiting for review.
          </CardContent>
        </Card>
      )}

      {items && items.length > 0 && (
        <div className="space-y-3">
          {items.map((it) => (
            <ExtractionCard key={it.id} item={it} onDone={load} />
          ))}
        </div>
      )}
    </div>
  );
}
