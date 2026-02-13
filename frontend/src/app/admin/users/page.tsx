// src/app/admin/users/page.tsx

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

  const usersRaw = await prisma.user.findMany({
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

  // ✅ Convert Date fields to serialisable strings for client component
  const users = usersRaw.map((u) => ({
    ...u,
    emailVerifiedAt: u.emailVerifiedAt
      ? u.emailVerifiedAt.toISOString()
      : null,
    createdAt: u.createdAt.toISOString(),
  }));

  return <AdminUsersClient users={users} />;
}
