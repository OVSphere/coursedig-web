// frontend/src/app/admin/courses/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function AdminCourseNewPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [overview, setOverview] = useState("");

  async function submit() {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          category: category || null,
          shortDescription: shortDescription || null,
          overview: overview || "",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to create course.");

      router.push(`/admin/courses/${data.course.id}/edit`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to create course.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="bg-white">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-700">Admin</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">New course</h1>
            <p className="mt-2 text-sm text-gray-700">
              Create a draft course, then add fee and publish when ready.
            </p>
          </div>

          <Link
            href="/admin/courses"
            className="text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
          >
            ← Back
          </Link>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 grid gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-900">Title</label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slug.trim()) {
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "")
                  );
                }
              }}
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm"
              placeholder="e.g. Data Analytics (Vocational)"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-mono"
              placeholder="e.g. data-analytics-vocational"
            />
            <p className="mt-1 text-xs text-gray-600">
              Used in the URL: <span className="font-mono">/courses/{slug || "..."}</span>
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm"
              placeholder='e.g. "Vocational Training / Professional Certificate Courses"'
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900">
              Short description
            </label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm"
              rows={3}
              placeholder="1–2 lines shown in course list cards."
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900">Overview</label>
            <textarea
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm"
              rows={6}
              placeholder="Main course overview text."
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="mt-2 rounded-md bg-[color:var(--color-brand)] px-5 py-3 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)] disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create course"}
          </button>
        </div>
      </div>
    </main>
  );
}
