"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Loader2, CloudUpload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExtractionCard, type ExtractionItem } from "@/components/extraction-card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ClientItem = {
  id: string;
  createdAt: string;
  extracted: unknown;
};

export function MyProfileClient({ initialPending }: { initialPending: ClientItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const pendingSectionRef = useRef<HTMLElement>(null);
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [items, setItems] = useState<ExtractionItem[]>(
    initialPending.map((p) => ({
      id: p.id,
      createdAt: p.createdAt,
      extracted: p.extracted as ExtractionItem["extracted"],
    })),
  );

  // Clear the "newest card" highlight ring after 2.5s.
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 2500);
    return () => clearTimeout(t);
  }, [highlightId]);

  function upload(file: File) {
    setActiveFileName(file.name);
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
          description: `Extracted ${data.extracted.skills.length} skills and ${data.extracted.projects.length} projects. Review below and submit for HR approval.`,
        });
        const newId = data.extractionId as string;
        setItems((cur) => [
          {
            id: newId,
            createdAt: new Date().toISOString(),
            extracted: data.extracted,
          },
          ...cur,
        ]);
        setHighlightId(newId);
        // Wait a tick so React renders the new card, then scroll it into view.
        requestAnimationFrame(() => {
          pendingSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      } catch (err) {
        toast({
          title: "Upload failed",
          description: (err as Error).message,
          variant: "destructive",
        });
      } finally {
        setActiveFileName(null);
      }
    });
  }

  function onDone(id: string) {
    setItems((cur) => cur.filter((i) => i.id !== id));
    router.refresh();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  }

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors",
          dragOver
            ? "border-primary bg-violet-50/60"
            : "border-slate-300 bg-white hover:border-slate-400",
          pending && "pointer-events-none opacity-90",
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <CardContent className="p-8 text-center">
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
          <div
            className={cn(
              "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-colors",
              pending ? "bg-violet-100" : "bg-slate-100",
            )}
          >
            {pending ? (
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
            ) : (
              <CloudUpload className="h-7 w-7 text-slate-500" />
            )}
          </div>
          <h3 className="font-semibold text-slate-900">
            {pending
              ? "Extracting skills with AI…"
              : "Drop your resume here, or click to upload"}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {pending && activeFileName ? (
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> {activeFileName}
              </span>
            ) : (
              "PDF only · up to 10 MB"
            )}
          </p>
          {!pending && (
            <Button
              onClick={() => fileInput.current?.click()}
              className="mt-4 gap-2"
              size="lg"
            >
              <Upload className="h-4 w-4" /> Choose PDF
            </Button>
          )}
        </CardContent>
      </Card>

      {items.length > 0 && (
        <section ref={pendingSectionRef} className="scroll-mt-20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">Check what we extracted</h2>
              <p className="text-xs text-slate-500">
                Review the AI&apos;s extraction. Submit to send it to HR for final approval —
                your profile becomes searchable once HR approves.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {items.length} pending
            </div>
          </div>
          <div className="space-y-3">
            {items.map((it, i) => (
              <div
                key={it.id}
                className={cn(
                  "animate-fade-in rounded-xl transition-all duration-500",
                  highlightId === it.id &&
                    "ring-2 ring-primary ring-offset-2 ring-offset-slate-50",
                )}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <ExtractionCard item={it} mode="employee" onDone={() => onDone(it.id)} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
