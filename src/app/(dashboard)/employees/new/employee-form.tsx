"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function EmployeeForm() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; user?: { email: string } };
      if (!res.ok) {
        setError(data.error ?? "Could not create employee");
        return;
      }
      toast({
        title: "Employee created",
        description: `${data.user?.email ?? email} can now sign in with the password you set.`,
      });
      setName("");
      setEmail("");
      setPassword("");
    });
  }

  return (
    <Card className="border-slate-200/70 shadow-soft">
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium text-slate-700">
              Full name
            </Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={pending}
              className="h-10"
              placeholder="Priya Sharma"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-slate-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={pending}
              className="h-10"
              placeholder="priya@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-slate-700">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={pending}
              className="h-10"
              placeholder="At least 8 characters"
            />
            <p className="text-xs text-slate-500">
              Share this with the employee. They can sign in at the login page.
            </p>
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 animate-fade-in">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Button type="submit" className="w-full h-10 gap-2" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Create employee
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
