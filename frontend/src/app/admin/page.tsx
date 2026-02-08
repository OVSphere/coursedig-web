// frontend/src/app/admin/page.tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

function Tile({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
    >
      <div className="text-base font-bold text-gray-900">{title}</div>
      <p className="mt-2 text-sm text-gray-700">{desc}</p>
      <p className="mt-4 inline-flex text-sm font-semibold text-[color:var(--color-brand)]">
        Open →
      </p>
    </Link>
  );
}

export default async function AdminHomePage() {
  // still useful for future UI gates, even if not used here today
  await requireAdmin();

  return (
    <main className="bg-white">
      {/* ✅ Dashboard header (no action buttons) */}
      <section className="rounded-2xl border border-gray-200 bg-[color:var(--color-brand-soft)] p-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin dashboard</h1>
        <p className="mt-1 text-sm text-gray-700">
          Manage CourseDig content, enquiries, applications, fees, and newsletters.
        </p>
      </section>

      <section className="mt-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Tile
            title="Enquiries"
            desc="View and search contact enquiries."
            href="/admin/enquiries"
          />
          <Tile
            title="Courses"
            desc="Create, edit and publish courses."
            href="/admin/courses"
          />
          <Tile
            title="Applications"
            desc="Review applications and attachments."
            href="/admin/applications"
          />
          <Tile
            title="Fees"
            desc="Manage tuition fees and payment notes."
            href="/admin/fees"
          />
          <Tile
            title="Newsletter"
            desc="View subscribers and send newsletters (Admin can send; Super Admin can manage)."
            href="/admin/newsletter"
          />
        </div>
      </section>
    </main>
  );
}
