import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { auth } from "@/lib/auth";
import { EmployeeForm } from "./employee-form";

export const dynamic = "force-dynamic";

export default async function NewEmployeePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "HR") redirect("/");

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <UserPlus className="h-7 w-7 text-primary" />
          Add Employee
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Create an account for a new employee. They will be able to sign in with the email and password you set.
        </p>
      </div>
      <EmployeeForm />
    </div>
  );
}
