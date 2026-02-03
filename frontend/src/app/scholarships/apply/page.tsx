// src/app/scholarships/apply/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ScholarshipApplyClient from "./ScholarshipApplyClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScholarshipApplyPage() {
  const user = await getCurrentUser();

  // ✅ Not logged in → redirect
  if (!user) {
    redirect("/login?next=/scholarships/apply");
  }

  return <ScholarshipApplyClient />;
}
