// frontend/src/app/admin/audit/audit-client.tsx
"use client";

import { useMemo, useState } from "react";

type Actor = { id: string; email: string; fullName: string | null };

type AuditEvent = {
  id: string;
  createdAt: string | Date;
  action: string;
  actorUserId: string;
  targetUserId: string | null;
  targetCourseId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  before: any | null;
  after: any | null;
  meta: any | null;
  actor: Actor;
};

function safeDateTime(v: string | Date) {
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function prettyJson(v: any) {
  try {
    if (v === null || v === undefined) return "null";
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export default function AdminAuditClient({
  initialEvents,
}: {
  initialEvents: AuditEvent[];
}) {
  const [q, setQ] = useState("");
  const [action, setAction] = useState<string>("");

  const actions = useMemo(() => {
    const set = new Set(initialEvents.map((e) => e.action));
    return Array.from(set).sort();
  }, [initialEvents]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return initialEvents.filter((e) => {
      if (action && e.action !== action) return false;
      if (!s) return true;

      const actorEmail = (e.actor?.email || "").toLowerCase();
      const actorName = (e.actor?.fullName || "").toLowerCase();
      const targetUserId = (e.targetUserId || "").toLowerCase();
      const targetCourseId = (e.targetCourseId || "").toLowerCase();

      const meta = e.meta ? prettyJson(e.meta).toLowerCase() : "";
      const before = e.before ? prettyJson(e.before).toLowerCase() : "";
      const after = e.after ? prettyJson(e.after).toLowerCase() : "";

      return (
        e.action.toLowerCase().includes(s) ||
        actorEmail.includes(s) ||
        actorName.includes(s) ||
        targetUserId.includes(s) ||
        targetCourseId.includes(s) ||
        meta.includes(s) ||
        before.includes(s) ||
        after.includes(s)
      );
    });
  }, [q, action, initialEvents]);

  return (
    <main className="p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit trail</h1>
          <p className="mt-1 text-sm text-gray-600">
            Read-only log of sensitive admin actions (roles, verification, course changes, etc.).
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)] sm:w-80"
            placeholder="Search action, actor, target, meta…"
          />

          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)] sm:w-60"
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="max-h-[70vh] overflow-auto rounded-2xl">
          <table className="min-w-[1050px] w-full border-separate border-spacing-0 text-[13px]">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="[&>th]:border-b [&>th]:border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Time</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Actor</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Target</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Details</th>
              </tr>
            </thead>

            <tbody className="[&>tr>td]:border-b [&>tr>td]:border-gray-100">
              {filtered.map((e, idx) => {
                const isOdd = idx % 2 === 1;

                const targetText = e.targetUserId
                  ? `User: ${e.targetUserId}`
                  : e.targetCourseId
                  ? `Course: ${e.targetCourseId}`
                  : "—";

                return (
                  <tr
                    key={e.id}
                    className={cx(
                      "align-top",
                      isOdd && "bg-gray-50/60",
                      "hover:bg-[color:var(--color-brand-soft)]/25"
                    )}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-gray-800">
                      {safeDateTime(e.createdAt)}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex max-w-[280px] truncate rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-800">
                        {e.action}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-800">
                      <div className="font-semibold leading-5">{e.actor?.fullName || "—"}</div>
                      <div className="mt-0.5 text-xs text-gray-500">{e.actor?.email || e.actorUserId}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="max-w-[320px] break-words font-mono text-[12px] text-gray-700">
                        {targetText}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <details className="rounded-lg border border-gray-200 bg-white">
                        <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50">
                          View meta / before / after
                        </summary>

                        <div className="space-y-3 border-t border-gray-200 p-3">
                          <div className="grid gap-3 lg:grid-cols-3">
                            <div>
                              <div className="text-xs font-semibold text-gray-800">meta</div>
                              <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-gray-50 p-2 text-[11px] text-gray-800">
                                {prettyJson(e.meta)}
                              </pre>
                            </div>

                            <div>
                              <div className="text-xs font-semibold text-gray-800">before</div>
                              <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-gray-50 p-2 text-[11px] text-gray-800">
                                {prettyJson(e.before)}
                              </pre>
                            </div>

                            <div>
                              <div className="text-xs font-semibold text-gray-800">after</div>
                              <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-gray-50 p-2 text-[11px] text-gray-800">
                                {prettyJson(e.after)}
                              </pre>
                            </div>
                          </div>

                          <div className="text-[11px] text-gray-500">
                            IP: {e.ipAddress || "—"} • UA: {e.userAgent || "—"}
                          </div>
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                    No audit events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-xs text-gray-500">
          <span>Showing {filtered.length} of {initialEvents.length} events</span>
          <span>Tip: use the search box to filter by actor email, action, or target ID.</span>
        </div>
      </div>
    </main>
  );
}
