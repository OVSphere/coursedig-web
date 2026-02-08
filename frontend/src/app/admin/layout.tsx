// frontend/src/app/admin/layout.tsx
import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import AdminSidebar from "./ui/AdminSidebar";
import AdminTopbar from "./ui/AdminTopbar"; // ✅ NEW (CourseDig)

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gate = await requireAdmin();

  if (!gate.ok && gate.reason === "UNAUTHENTICATED") {
    redirect("/login?next=/admin");
  }
  if (!gate.ok && gate.reason === "FORBIDDEN") {
    redirect("/forbidden");
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <AdminSidebar />
          </aside>

          <section className="lg:col-span-9">
            {/* ✅ NEW (CourseDig): Topbar hides “Back to dashboard” on /admin */}
            <AdminTopbar />

            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
