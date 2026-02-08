// frontend/src/app/admin/fees/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function money(pence: number | null | undefined) {
  if (pence == null || !Number.isFinite(pence) || pence <= 0) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

function fmtDate(d: Date) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export default async function AdminFeesPage() {
  // show recent fees to confirm wiring works
  const rows = await prisma.courseFee.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { course: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fees</h2>
          <p className="mt-1 text-sm text-gray-700">
            Review and manage course fee records.
          </p>
        </div>

        <Link
          href="/admin/courses"
          className="text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
        >
          Manage fees via Courses →
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-2 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
          <div className="col-span-4">Course</div>
          <div className="col-span-3">Level</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-3">Updated</div>
        </div>

        {rows.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">
            No fee records found yet. Add a fee from{" "}
            <Link
              href="/admin/courses"
              className="font-semibold text-[color:var(--color-brand)] hover:underline"
            >
              Admin → Courses
            </Link>
            .
          </div>
        ) : (
          rows.map((f) => (
            <div
              key={f.id}
              className="grid grid-cols-12 gap-2 border-t border-gray-200 px-4 py-3"
            >
              <div className="col-span-4">
                <div className="text-sm font-semibold text-gray-900">
                  {f.course?.title || "—"}
                </div>
                <div className="mt-1 text-xs font-mono text-gray-600">
                  {f.course?.slug ? `/courses/${f.course.slug}` : "—"}
                </div>
              </div>

              <div className="col-span-3 text-sm text-gray-800">
                {String(f.level)}
              </div>

              <div className="col-span-2 text-sm text-gray-800">
                {money(f.amountPence)}
              </div>

              <div className="col-span-3 text-sm text-gray-600">
                {fmtDate(f.updatedAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
