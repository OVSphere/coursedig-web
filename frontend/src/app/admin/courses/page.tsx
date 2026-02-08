// frontend/src/app/admin/courses/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
};

export default async function AdminCoursesPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  // ✅ Next.js 16: searchParams is a Promise in some environments
  const sp = (await props.searchParams) ?? {};
  const q = (sp.q || "").trim();

  const courses = await prisma.course.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
    take: 200,
    include: { fee: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Courses</h2>
          <p className="mt-1 text-sm text-gray-700">
            Manage courses, publishing, and fees.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/courses/new"
            className="rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
          >
            + New course
          </Link>
        </div>
      </div>

      <form className="flex gap-2" action="/admin/courses" method="GET">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search title, slug, category…"
          className="w-full sm:w-96 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
        />

        <button className="rounded-md bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90">
          Search
        </button>

        {q ? (
          <Link
            href="/admin/courses"
            className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-2 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
          <div className="col-span-5">Title</div>
          <div className="col-span-3">Category</div>
          <div className="col-span-2">Published</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {courses.length === 0 ? (
          <div className="p-6 text-sm text-gray-700">No courses found.</div>
        ) : (
          courses.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-12 gap-2 border-t border-gray-200 px-4 py-3"
            >
              <div className="col-span-5">
                <div className="text-sm font-semibold text-gray-900">
                  {c.title}
                </div>
                <div className="mt-1 font-mono text-xs text-gray-600">
                  {c.slug}
                </div>

                {/* Optional fee preview */}
                {c.fee ? (
                  <div className="mt-1 text-xs text-gray-600">
                    Fee: £{(c.fee.amountPence / 100).toFixed(2)}{" "}
                    <span className="text-gray-400">({c.fee.level})</span>
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-gray-500">Fee: —</div>
                )}
              </div>

              <div className="col-span-3 text-sm text-gray-700">
                {c.category || "—"}
              </div>

              <div className="col-span-2 text-sm">
                <span
                  className={
                    c.published
                      ? "rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700"
                      : "rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700"
                  }
                >
                  {c.published ? "Published" : "Draft"}
                </span>
              </div>

              <div className="col-span-2 flex justify-end gap-3">
                <Link
                  href={`/admin/courses/${c.id}/edit`}
                  className="text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
                >
                  Edit
                </Link>

                <Link
                  href={`/courses/${c.slug}`}
                  className="text-sm font-semibold text-gray-700 hover:underline"
                  target="_blank"
                >
                  View
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
