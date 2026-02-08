//frontend/src/app/admin/newsletter/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMe } from "@/lib/useMe";

type Subscriber = {
  id: string;
  email: string;
  fullName: string | null;
  source: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function cx(...c: Array<string | false | undefined | null>) {
  return c.filter(Boolean).join(" ");
}

export default function AdminNewsletterPage() {
  const { user: me, loading: meLoading } = useMe();

  const isAdmin = !!me?.isAdmin;
  const isSuperAdmin = !!me?.isSuperAdmin;

  const [q, setQ] = useState("");
  const [items, setItems] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // composer
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // super admin create
  const [newEmail, setNewEmail] = useState("");
  const [newFullName, setNewFullName] = useState("");

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([id]) => id),
    [selected]
  );

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/newsletter/subscribers?q=${encodeURIComponent(q)}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Failed to load subscribers.");
      setItems(json.items ?? []);
      setSelected({});
    } catch (e: any) {
      setMsg(e?.message || "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!meLoading && (isAdmin || isSuperAdmin)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meLoading, isAdmin, isSuperAdmin]);

  async function send(mode: "ALL_ACTIVE" | "SELECTED" | "INDIVIDUAL", email?: string) {
    setMsg(null);

    if (subject.trim().length < 3) return setMsg("Please enter a subject.");
    if (html.trim().length < 10) return setMsg("Please enter the email HTML body.");

    if (mode === "SELECTED" && selectedIds.length === 0) {
      return setMsg("Select at least one subscriber.");
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          ids: mode === "SELECTED" ? selectedIds : undefined,
          email: mode === "INDIVIDUAL" ? email : undefined,
          subject: subject.trim(),
          html: html.trim(),
          text: (text || "").trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Send failed.");

      setMsg(`Sent ${json.sent}/${json.requested}.`);
    } catch (e: any) {
      setMsg(e?.message || "Send failed.");
    } finally {
      setSending(false);
    }
  }

  async function deleteOne(id: string) {
    if (!isSuperAdmin) return;
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/newsletter/subscribers/${id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Delete failed.");
      await load();
      setMsg("Deleted.");
    } catch (e: any) {
      setMsg(e?.message || "Delete failed.");
    }
  }

  async function bulkDeleteSelected() {
    if (!isSuperAdmin) return;
    if (!selectedIds.length) return setMsg("Select at least one subscriber.");

    setMsg(null);
    try {
      const res = await fetch("/api/admin/newsletter/subscribers", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Bulk delete failed.");
      await load();
      setMsg(`Deleted ${json.deleted}.`);
    } catch (e: any) {
      setMsg(e?.message || "Bulk delete failed.");
    }
  }

  async function addSubscriber() {
    if (!isSuperAdmin) return;

    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setMsg("Enter a valid email.");
    }

    setMsg(null);
    try {
      const res = await fetch("/api/admin/newsletter/subscribers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          fullName: newFullName.trim() || null,
          source: "admin",
          isActive: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Create failed.");
      setNewEmail("");
      setNewFullName("");
      await load();
      setMsg("Subscriber added.");
    } catch (e: any) {
      setMsg(e?.message || "Create failed.");
    }
  }

  // Guard
  if (meLoading) {
    return (
      <main className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-2xl border border-gray-200 p-6">Loading…</div>
        </div>
      </main>
    );
  }

  if (!me || (!isAdmin && !isSuperAdmin)) {
    return (
      <main className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Newsletter</h1>
            <p className="mt-2 text-sm text-gray-700">You don’t have access to this page.</p>
            <div className="mt-5">
              <Link
                href="/"
                className="inline-flex items-center rounded-md bg-[color:var(--color-brand)] px-5 py-3 text-sm font-semibold text-white hover:opacity-95"
              >
                Back to home →
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white">
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-3xl font-bold text-gray-900">Newsletter</h1>
          <p className="mt-2 text-sm text-gray-700">
            {isSuperAdmin
              ? "Super Admin: manage subscribers and send newsletters."
              : "Admin: send newsletters (no subscriber CRUD)."}
          </p>

          {msg && (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-900">
              {msg}
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
          {/* Composer */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Send newsletter</h2>

            <div className="mt-4 grid gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-900">Subject</label>
                <input
                  className="mt-2 w-full rounded-md border border-gray-300 px-4 py-2 text-sm"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Newsletter subject"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900">HTML body</label>
                <textarea
                  className="mt-2 w-full rounded-md border border-gray-300 px-4 py-2 text-sm"
                  rows={6}
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder="<h2>Hello</h2><p>...</p>"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This is the HTML version that most email clients will render.
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900">Text fallback (optional)</label>
                <textarea
                  className="mt-2 w-full rounded-md border border-gray-300 px-4 py-2 text-sm"
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Plain text fallback"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => send("ALL_ACTIVE")}
                  className={cx(
                    "rounded-md px-4 py-2 text-sm font-semibold text-white",
                    sending ? "bg-gray-400" : "bg-[color:var(--color-brand)] hover:opacity-95"
                  )}
                >
                  {sending ? "Sending…" : "Send to all active"}
                </button>

                <button
                  type="button"
                  disabled={sending || selectedIds.length === 0}
                  onClick={() => send("SELECTED")}
                  className={cx(
                    "rounded-md px-4 py-2 text-sm font-semibold text-white",
                    sending || selectedIds.length === 0
                      ? "bg-gray-400"
                      : "bg-black hover:bg-gray-800"
                  )}
                >
                  Send to selected ({selectedIds.length})
                </button>

                <span className="text-sm text-gray-600 self-center">
                  Tip: use “Send” on a row to message one person.
                </span>
              </div>
            </div>
          </div>

          {/* Super admin create */}
          {isSuperAdmin && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Add subscriber</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <input
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm"
                  placeholder="email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <input
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm"
                  placeholder="Full name (optional)"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={addSubscriber}
                  className="rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* List */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900">Subscribers</h2>

              <div className="flex flex-wrap gap-2">
                <input
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm"
                  placeholder="Search email or name…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <button
                  type="button"
                  onClick={load}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  {loading ? "Loading…" : "Search"}
                </button>

                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={bulkDeleteSelected}
                    disabled={!selectedIds.length}
                    className={cx(
                      "rounded-md px-4 py-2 text-sm font-semibold text-white",
                      !selectedIds.length ? "bg-gray-400" : "bg-red-700 hover:bg-red-800"
                    )}
                  >
                    Delete selected
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs text-gray-500">
                  <tr>
                    <th className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={items.length > 0 && selectedIds.length === items.length}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const next: Record<string, boolean> = {};
                          if (checked) items.forEach((x) => (next[x.id] = true));
                          setSelected(next);
                        }}
                      />
                    </th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Active</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {items.map((x) => (
                    <tr key={x.id} className="align-top">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={!!selected[x.id]}
                          onChange={(e) =>
                            setSelected((prev) => ({ ...prev, [x.id]: e.target.checked }))
                          }
                        />
                      </td>

                      <td className="px-3 py-3 font-semibold text-gray-900">{x.email}</td>
                      <td className="px-3 py-3 text-gray-700">{x.fullName || "—"}</td>
                      <td className="px-3 py-3">
                        <span
                          className={cx(
                            "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                            x.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                          )}
                        >
                          {x.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-600">{x.source || "—"}</td>

                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => send("INDIVIDUAL", x.email)}
                            disabled={sending}
                            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                          >
                            Send
                          </button>

                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => deleteOne(x.id)}
                              className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                        No subscribers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Admin can send newsletters but cannot create/update/delete subscribers.
              Super Admin can manage subscribers (CRUD) and send newsletters.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
