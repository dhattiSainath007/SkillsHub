/**
 * Tiny auth guards for API routes. Returning the error response (not throwing)
 * lets each route bail with `if (error) return error;`.
 */
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

type Guard<T> = { session: Session; error?: undefined } | { session?: undefined; error: NextResponse<T> };

export async function requireAuth(): Promise<Guard<{ error: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export async function requireHR(): Promise<Guard<{ error: string }>> {
  const guard = await requireAuth();
  if (guard.error) return guard;
  if (guard.session.user.role !== "HR") {
    return { error: NextResponse.json({ error: "Forbidden — HR only" }, { status: 403 }) };
  }
  return guard;
}
