// frontend/src/app/admin/audit/page.tsx
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import AdminAuditClient from "./audit-client";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const gate = await requireAdmin();

  if (!gate.ok && gate.reason === "UNAUTHENTICATED") {
    redirect("/login?next=/admin/audit");
  }
  if (!gate.ok && gate.reason === "FORBIDDEN") {
    redirect("/forbidden");
  }

  const events = await prisma.authzAuditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      createdAt: true,
      action: true,
      actorUserId: true,
      targetUserId: true,
      targetCourseId: true,
      ipAddress: true,
      userAgent: true,
      before: true,
      after: true,
      meta: true,
      actor: {
        select: { id: true, email: true, fullName: true },
      },
    },
  });

  return <AdminAuditClient initialEvents={events} />;
}
