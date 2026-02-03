// frontend/src/app/my-applications/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AppRow = {
  id: string;
  appRef?: string | null;
  courseName?: string | null;
  createdAt?: string | Date;
  status?: string | null;
};

type MeUser = { id: string; email: string; fullName: string | null } | null;

function formatDate(d: any) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function MyApplicationsPage() {
  const [user, setUser] = useState<MeUser>(null);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      const meJson = await meRes.json().catch(() => ({}));
      const u = meJson?.user ?? null;
      setUser(u);

      if (!u) {
        setApps([]);
        setLoading(false);
        return;
      }

      const res = await fetch("/api/applications/my", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.message || "Failed to load applications.");
      }

      setApps(Array.isArray(json?.applications) ? json.applications : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const name = useMemo(() => {
    if (!user) return "";
    return (user.fullName || user.email || "").trim();
  }, [user]);

  return (
    <main className="bg-white">
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h1 className="text-3xl font-bold text-gray-900">My applications</h1>
          <p className="mt-2 text-sm text-gray-700">
            View applications you have submitted and your reference numbers.
          </p>

          {!user && !loading ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/login?next=${encodeURIComponent("/my-applications")}`}
                className="inline-flex items-center rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95"
              >
                Login to continue →
              </Link>
              <Link
                href={`/register?next=${encodeURIComponent("/my-applications")}`}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                Create account
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-5xl px-6 py-10">
          {loading ? <p className="text-sm text-gray-600">Loading…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {user && !loading && !error ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-700">
                  Signed in as <span className="font-semibold text-gray-900">{name}</span>
                </p>
                <Link
                  href="/apply"
                  className="inline-flex items-center rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95"
                >
                  Start a new application →
                </Link>
              </div>

              {apps.length === 0 ? (
                <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <p className="text-sm font-semibold text-gray-900">No applications yet</p>
                  <p className="mt-2 text-sm text-gray-700">
                    When you submit an application, it will appear here with your reference number.
                  </p>
                </div>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="py-3 pr-4">Reference</th>
                        <th className="py-3 pr-4">Course</th>
                        <th className="py-3 pr-4">Date</th>
                        <th className="py-3 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {apps.map((a) => (
                        <tr key={a.id} className="text-gray-800">
                          <td className="py-3 pr-4 font-mono font-semibold">
                            {a.appRef || "—"}
                          </td>
                          <td className="py-3 pr-4">{a.courseName || "—"}</td>
                          <td className="py-3 pr-4">{formatDate(a.createdAt)}</td>
                          <td className="py-3 pr-4">{a.status || "Submitted"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
