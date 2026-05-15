import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "HR" ? "/search" : "/my-profile");
  }
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 flex items-center justify-center p-4">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-violet-300/40 blur-3xl animate-blob" />
        <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-sky-300/40 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-fuchsia-300/30 blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm border border-slate-200 text-xs font-medium text-slate-600 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            AI-powered skills intelligence
          </div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <span>SkillsHub</span>
          </h1>
          <p className="text-sm text-slate-600 mt-2 text-balance">
            Find the right person for the work — in plain English.
          </p>
        </div>

        <LoginForm />

        <div className="mt-6 rounded-lg border border-slate-200/70 bg-white/60 backdrop-blur-sm p-3 text-xs text-slate-600">
          <p className="font-medium text-slate-700 mb-1">Demo accounts (password: <code className="font-mono">demo1234</code>)</p>
          <ul className="space-y-0.5">
            <li>• HR: <code className="font-mono">hr@skillshub.demo</code></li>
            <li>• Employee: <code className="font-mono">rahul@skillshub.demo</code> (and 14 others)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
