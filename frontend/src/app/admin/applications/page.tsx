// frontend/src/app/admin/applications/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type ApplicationRow = {
  id: string;
  applicationType?: string | null;
  appRef?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  countryOfResidence?: string | null;
  courseName?: string | null;
  createdAt?: string | Date | null;
  status?: string | null;
};

function cx(...c: Array<string | false | undefined | null>) {
  return c.filter(Boolean).join(" ");
}

function formatDate(d: any) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminApplicationsPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const canSearch = useMemo(() => q.trim().length === 0 || q.trim().length >= 2, [q]);

  async function load() {
    if (!canSearch) {
      setMsg("Type at least 2 characters to search.");
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/admin/applications?q=${encodeURIComponent(q.trim())}`, {
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to load applications.");

      setItems(Array.isArray(json?.items) ? json.items : []);
    } catch (e: any) {
      setMsg(e?.message || "Failed to load applications.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="bg-white">
      {/* Header (no back links here) */}
      <section className="rounded-2xl border border-gray-200 bg-[color:var(--color-brand-soft)] p-6">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="mt-1 text-sm text-gray-700">
          Review submitted applications. Use search to filter by reference, email, name, or course.
        </p>

        {msg && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-900">
            {msg}
          </div>
        )}
      </section>

      <section className="mt-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <input
                className="w-[320px] max-w-full rounded-md border border-gray-300 px-4 py-2 text-sm"
                placeholder="Search by reference, email, name, course…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button
                type="button"
                onClick={load}
                className={cx(
                  "rounded-md px-4 py-2 text-sm font-semibold text-white",
                  loading ? "bg-gray-400" : "bg-[color:var(--color-brand)] hover:opacity-95"
                )}
              >
                {loading ? "Loading…" : "Search"}
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{items.length}</span>
            </p>
          </div>

          <div className="mt-5 overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-500 border-b">
                <tr>
                  <th className="py-3 pr-4">Reference</th>
                  <th className="py-3 pr-4">Applicant</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Course</th>
                  <th className="py-3 pr-4">Country</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-0">Submitted</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {items.map((a) => {
                  const name =
                    `${a.firstName || ""} ${a.lastName || ""}`.trim() ||
                    "—";
                  return (
                    <tr key={a.id} className="text-gray-800">
                      <td className="py-3 pr-4 font-mono font-semibold text-gray-900">
                        {a.appRef || "—"}
                      </td>
                      <td className="py-3 pr-4">{name}</td>
                      <td className="py-3 pr-4">{a.email || "—"}</td>
                      <td className="py-3 pr-4">{a.courseName || "—"}</td>
                      <td className="py-3 pr-4">{a.countryOfResidence || "—"}</td>
                      <td className="py-3 pr-4">{a.applicationType || "—"}</td>
                      <td className="py-3 pr-4">{a.status || "Submitted"}</td>
                      <td className="py-3 pr-0">{formatDate(a.createdAt)}</td>
                    </tr>
                  );
                })}

                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-gray-500">
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Tip: search works on reference, email, applicant name, and course name.
          </p>
        </div>
      </section>
    </main>
  );
}
