import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SearchClient } from "./search-client";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "HR") redirect("/my-profile");
  return <SearchClient />;
}
