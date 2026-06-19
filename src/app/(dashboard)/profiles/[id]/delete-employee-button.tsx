"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function DeleteEmployeeButton({
  userId,
  fullName,
}: {
  userId: string;
  fullName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const res = await fetch(`/api/employees/${userId}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast({
          title: "Delete failed",
          description: data.error ?? "Could not delete employee.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Employee deleted",
        description: `${fullName} and all associated data have been removed.`,
      });
      setOpen(false);
      router.replace("/directory");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300"
        >
          <Trash2 className="h-4 w-4" />
          Delete employee
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            Delete {fullName}?
          </DialogTitle>
          <DialogDescription>
            This permanently removes the employee&apos;s account, profile,
            skills, projects, pending submissions, and search history. They will
            no longer be able to log in. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={pending}
            className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
