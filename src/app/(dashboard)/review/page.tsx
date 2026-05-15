import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ReviewClient } from "./review-client";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "HR") redirect("/my-profile");
  return <ReviewClient />;
}
