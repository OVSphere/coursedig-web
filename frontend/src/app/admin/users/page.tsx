//src/app/admin/users/page.tsx

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import AdminUsersClient from "./users-client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const gate = await requireAdmin();

  if (!gate.ok) {
    redirect("/login");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      emailVerifiedAt: true,
      isAdmin: true,
      isSuperAdmin: true,
      createdAt: true,
    },
  });

  return <AdminUsersClient users={users} />;
}
