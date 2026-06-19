/**
 * Edge-safe NextAuth config (no provider that touches Node-only modules like
 * bcrypt or Prisma). Imported by middleware so it runs in the Edge runtime.
 * The full config (with the Credentials provider) lives in src/lib/auth.ts.
 */
import type { NextAuthConfig } from "next-auth";

const HR_ONLY_PREFIXES = ["/search", "/review", "/directory", "/employees"];
const PUBLIC_PREFIXES = ["/login", "/api/auth"];

export default {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;

      // API routes handle their own auth (so they return proper 401/403 JSON).
      if (pathname.startsWith("/api/")) return true;

      if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;

      const isAuthed = !!auth?.user;
      if (!isAuthed) return false;

      if (HR_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
        return auth!.user!.role === "HR";
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "HR" | "EMPLOYEE";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
