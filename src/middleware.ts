/**
 * Edge-runtime middleware. Uses the trimmed authConfig (no providers),
 * which is why bcrypt/Prisma don't get pulled into Edge.
 * Actual login + route protection logic lives in auth.config.ts:authorized().
 */
import NextAuth from "next-auth";
import authConfig from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Run middleware on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
