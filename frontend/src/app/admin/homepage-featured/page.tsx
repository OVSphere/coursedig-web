// frontend/src/app/admin/homepage-featured/page.tsx
// ✅ NEW (CourseDig): Admin UI to manage homepage featured ranks (Admin + Super Admin)

"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  homePopularRank: number | null;
  homeLevel45Rank: number | null;
  homeLevel7Rank: number | null;
};

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

export default function AdminHomepageFeaturedPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/admin/homepage-featured?q=${encodeURIComponent(q)}`,
        { cache: "no-store" }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Failed to load courses.");
      setItems(json.items ?? []);
    } catch (e: any) {
      setMsg(e?.message || "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setRank(
    id: string,
    section: "POPULAR" | "LEVEL45" | "LEVEL7",
    rank: number | null,
    opts?: { silent?: boolean } // ✅ small safety: avoid double “Updated.” when clearing all
  ) {
    if (!opts?.silent) setMsg(null);

    try {
      const res = await fetch("/api/admin/homepage-featured", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, section, rank }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Update failed.");

      // ✅ keep behaviour the same (reload after each update)
      await load();

      if (!opts?.silent) setMsg("Updated.");
    } catch (e: any) {
      if (!opts?.silent) setMsg(e?.message || "Update failed.");
    }
  }

  async function clearAllRanks(id: string) {
    setMsg(null);
    try {
      // ✅ sequential so you don’t get racing reloads/errors
      await setRank(id, "POPULAR", null, { silent: true });
      await setRank(id, "LEVEL45", null, { silent: true });
      await setRank(id, "LEVEL7", null, { silent: true });
      setMsg("Cleared.");
    } catch (e: any) {
      setMsg(e?.message || "Clear failed.");
    }
  }

  const featuredPopular = useMemo(
    () =>
      items
        .filter((x) => x.homePopularRank != null)
        .sort((a, b) => a.homePopularRank! - b.homePopularRank!),
    [items]
  );

  const featured45 = useMemo(
    () =>
      items
        .filter((x) => x.homeLevel45Rank != null)
        .sort((a, b) => a.homeLevel45Rank! - b.homeLevel45Rank!),
    [items]
  );

  const featured7 = useMemo(
    () =>
      items
        .filter((x) => x.homeLevel7Rank != null)
        .sort((a, b) => a.homeLevel7Rank! - b.homeLevel7Rank!),
    [items]
  );

  return (
    <main className="bg-white">
      {/* ✅ Header (like your attached style) */}
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Homepage featured courses
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Choose which courses appear on the homepage and set their order (rank
            1 = first).
          </p>

          {msg && (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-900">
              {msg}
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
          {/* Quick view of what’s currently featured */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Popular</h2>
              <p className="mt-1 text-xs text-gray-500">homePopularRank</p>
              <ul className="mt-3 space-y-2 text-sm">
                {featuredPopular.length ? (
                  featuredPopular.map((x) => (
                    <li key={x.id} className="flex justify-between gap-2">
                      <span className="font-semibold text-gray-900">
                        {x.title}
                      </span>
                      <span className="text-gray-600">#{x.homePopularRank}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">None selected</li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Level 4 &amp; 5</h2>
              <p className="mt-1 text-xs text-gray-500">homeLevel45Rank</p>
              <ul className="mt-3 space-y-2 text-sm">
                {featured45.length ? (
                  featured45.map((x) => (
                    <li key={x.id} className="flex justify-between gap-2">
                      <span className="font-semibold text-gray-900">
                        {x.title}
                      </span>
                      <span className="text-gray-600">#{x.homeLevel45Rank}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">None selected</li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Level 7</h2>
              <p className="mt-1 text-xs text-gray-500">homeLevel7Rank</p>
              <ul className="mt-3 space-y-2 text-sm">
                {featured7.length ? (
                  featured7.map((x) => (
                    <li key={x.id} className="flex justify-between gap-2">
                      <span className="font-semibold text-gray-900">
                        {x.title}
                      </span>
                      <span className="text-gray-600">#{x.homeLevel7Rank}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">None selected</li>
                )}
              </ul>
            </div>
          </div>

          {/* Search + Edit */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900">Find a course</h2>

              <div className="flex flex-wrap gap-2">
                <input
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm"
                  placeholder="Search title or slug…"
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
              </div>
            </div>

            <div className="mt-5 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Slug</th>
                    <th className="px-3 py-2">Published</th>
                    <th className="px-3 py-2">Popular rank</th>
                    <th className="px-3 py-2">Level 4&amp;5 rank</th>
                    <th className="px-3 py-2">Level 7 rank</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {items.map((x) => (
                    <tr key={x.id} className="align-top">
                      <td className="px-3 py-3 font-semibold text-gray-900">
                        {x.title}
                      </td>
                      <td className="px-3 py-3 text-gray-600">{x.slug}</td>

                      <td className="px-3 py-3">
                        <span
                          className={cx(
                            "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                            x.published
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-700"
                          )}
                        >
                          {x.published ? "Published" : "Draft"}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min={1}
                          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                          value={x.homePopularRank ?? ""}
                          onChange={(e) =>
                            setRank(
                              x.id,
                              "POPULAR",
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                        />
                      </td>

                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min={1}
                          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                          value={x.homeLevel45Rank ?? ""}
                          onChange={(e) =>
                            setRank(
                              x.id,
                              "LEVEL45",
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                        />
                      </td>

                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min={1}
                          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                          value={x.homeLevel7Rank ?? ""}
                          onChange={(e) =>
                            setRank(
                              x.id,
                              "LEVEL7",
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                        />
                      </td>

                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => clearAllRanks(x.id)}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                        >
                          Clear
                        </button>
                      </td>
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-8 text-center text-gray-500"
                      >
                        No courses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Tip: Set rank to 1,2,3 to control order. Leave blank to remove from
              homepage section.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
