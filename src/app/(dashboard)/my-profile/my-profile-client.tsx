"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExtractionCard, type ExtractionItem } from "@/components/extraction-card";
import { useToast } from "@/hooks/use-toast";

type ClientItem = {
  id: string;
  createdAt: string;
  extracted: unknown;
};

export function MyProfileClient({ initialPending }: { initialPending: ClientItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<ExtractionItem[]>(
    initialPending.map((p) => ({
      id: p.id,
      createdAt: p.createdAt,
      extracted: p.extracted as ExtractionItem["extracted"],
    })),
  );

  function upload(file: File) {
    startTransition(async () => {
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch("/api/upload/resume", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) {
          const msg = data.detail ? `${data.error}: ${data.detail}` : data.error;
          throw new Error(msg ?? "Upload failed");
        }
        toast({
          title: "Resume processed",
          description: `Extracted ${data.extracted.skills.length} skills and ${data.extracted.projects.length} projects. Review below.`,
        });
        setItems((cur) => [
          {
            id: data.extractionId,
            createdAt: new Date().toISOString(),
            extracted: data.extracted,
          },
          ...cur,
        ]);
      } catch (err) {
        toast({
          title: "Upload failed",
          description: (err as Error).message,
          variant: "destructive",
        });
      }
    });
  }

  function onDone(id: string) {
    setItems((cur) => cur.filter((i) => i.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Upload resume</h2>
              <p className="text-sm text-muted-foreground">PDF only, max 10 MB.</p>
            </div>
            <div>
              <input
                ref={fileInput}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f);
                  e.target.value = "";
                }}
              />
              <Button onClick={() => fileInput.current?.click()} disabled={pending}>
                <Upload className="h-4 w-4 mr-2" />
                {pending ? "Processing…" : "Choose PDF"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Pending review</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Approve to save into your profile (and refresh search embeddings).
          </p>
          <div className="space-y-3">
            {items.map((it) => (
              <ExtractionCard key={it.id} item={it} onDone={() => onDone(it.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
