import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "HR" ? "/search" : "/my-profile");
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">SkillsHub</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find the right person for the work.
          </p>
        </div>
        <LoginForm />
        <p className="text-xs text-center text-muted-foreground mt-6">
          Demo logins: <code>hr@skillshub.demo</code> or any seeded employee email — password{" "}
          <code>demo1234</code>.
        </p>
      </div>
    </div>
  );
}
