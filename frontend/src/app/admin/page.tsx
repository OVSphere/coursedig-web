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
  const gate = await requireAdmin();

  if (!("ok" in gate) || (gate as any)?.ok === false) {
    return (
      <main className="bg-white">
        <section className="rounded-2xl border border-gray-200 bg-[color:var(--color-brand-soft)] p-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin dashboard</h1>
          <p className="mt-1 text-sm text-gray-700">Not authorised.</p>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-700">
            You must be logged in as an Admin or Super Admin to access this page.
          </p>
          <div className="mt-4">
            <Link
              href="/login"
              className="inline-flex items-center rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Go to login →
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const roles = (gate as any)?.roles;
  const isAdminOrSuperAdmin = !!roles?.isAdminOrSuperAdmin;

  return (
    <main className="bg-white">
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

          {/* ✅ NEW */}
          {isAdminOrSuperAdmin && (
            <Tile
              title="Popular courses (Homepage)"
              desc="Choose which courses appear in the Popular section and set their order."
              href="/admin/homepage-featured"
            />
          )}

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
