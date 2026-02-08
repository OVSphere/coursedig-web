// frontend/src/app/admin/courses/[id]/edit/ui/AdminCourseEditClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CourseLevel = "VOCATIONAL" | "LEVEL3" | "LEVEL4_5" | "LEVEL7";

type Course = {
  id: string;
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  overview: string;
  whoItsFor: string | null;
  whatYoullLearn: string | null;
  entryRequirements: string | null;
  duration: string | null;
  delivery: string | null;
  startDatesNote: string | null;
  priceNote: string | null;
  heroImage: string | null;
  imageAlt: string | null;
  published: boolean;
  sortOrder: number;

  updatedAt?: string;

  fee: null | {
    id: string;
    level: CourseLevel;
    amountPence: number;
    currency: string;
    payInFullAvailable: boolean;
    payInFullDiscountPercent: number;
    note: string | null;
    isActive: boolean;
  };
};

function toInt(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function toNullIfEmpty(v: string) {
  const t = v.trim();
  return t.length ? t : null;
}

function formatLastSaved(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

type Notice =
  | null
  | { type: "ok"; text: string }
  | { type: "error"; text: string };

export default function AdminCourseEditClient({ id }: { id: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const [course, setCourse] = useState<Course | null>(null);

  // core fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [overview, setOverview] = useState("");
  const [published, setPublished] = useState(false);
  const [sortOrder, setSortOrder] = useState("0");

  // optional content
  const [whoItsFor, setWhoItsFor] = useState("");
  const [whatYoullLearn, setWhatYoullLearn] = useState("");
  const [entryRequirements, setEntryRequirements] = useState("");
  const [duration, setDuration] = useState("");
  const [delivery, setDelivery] = useState("");
  const [startDatesNote, setStartDatesNote] = useState("");
  const [priceNote, setPriceNote] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  // fee fields
  const [feeLevel, setFeeLevel] = useState<CourseLevel>("VOCATIONAL");
  const [amountPence, setAmountPence] = useState("0");
  const [feeActive, setFeeActive] = useState(true);

  const canSave = useMemo(() => {
    return title.trim() && slug.trim() && category.trim() && overview.trim();
  }, [title, slug, category, overview]);

  // auto-clear success notice
  useEffect(() => {
    if (!notice || notice.type !== "ok") return;
    const t = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(t);
  }, [notice]);

  // load
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setNotice(null);

        const res = await fetch(`/api/admin/courses/${encodeURIComponent(id)}`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || "Failed to load course.");

        const c: Course = json.course;
        if (cancelled) return;

        setCourse(c);

        setTitle(c.title ?? "");
        setSlug(c.slug ?? "");
        setCategory(c.category ?? "");
        setShortDescription(c.shortDescription ?? "");
        setOverview(c.overview ?? "");
        setPublished(!!c.published);
        setSortOrder(String(c.sortOrder ?? 0));

        setWhoItsFor(c.whoItsFor ?? "");
        setWhatYoullLearn(c.whatYoullLearn ?? "");
        setEntryRequirements(c.entryRequirements ?? "");
        setDuration(c.duration ?? "");
        setDelivery(c.delivery ?? "");
        setStartDatesNote(c.startDatesNote ?? "");
        setPriceNote(c.priceNote ?? "");
        setHeroImage(c.heroImage ?? "");
        setImageAlt(c.imageAlt ?? "");

        if (c.fee) {
          setFeeLevel(c.fee.level);
          setAmountPence(String(c.fee.amountPence));
          setFeeActive(!!c.fee.isActive);
        } else {
          // keep defaults
          setAmountPence("0");
          setFeeActive(true);
        }
      } catch (e: any) {
        if (!cancelled) {
          const msg = e?.message || "Failed to load course.";
          setNotice({ type: "error", text: msg });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function save() {
    if (!canSave) {
      setNotice({ type: "error", text: "Please fill Title, Slug, Category, and Overview." });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (saving) return;

    try {
      setSaving(true);
      setNotice(null);

      // 1) PATCH course (preferred)
      const res = await fetch(`/api/admin/courses/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          category: category.trim(),
          shortDescription: shortDescription.trim(),
          overview: overview.trim(),
          published,
          sortOrder: toInt(sortOrder, 0),

          whoItsFor: toNullIfEmpty(whoItsFor),
          whatYoullLearn: toNullIfEmpty(whatYoullLearn),
          entryRequirements: toNullIfEmpty(entryRequirements),
          duration: toNullIfEmpty(duration),
          delivery: toNullIfEmpty(delivery),
          startDatesNote: toNullIfEmpty(startDatesNote),
          priceNote: toNullIfEmpty(priceNote),
          heroImage: toNullIfEmpty(heroImage),
          imageAlt: toNullIfEmpty(imageAlt),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Save failed.");

      if (json?.course) setCourse(json.course);

      // 2) Fee upsert ONLY if amount > 0 (prevents 400 validation noise)
      const amt = toInt(amountPence, 0);
      if (amt > 0) {
        const feeRes = await fetch(
          `/api/admin/courses/${encodeURIComponent(id)}/fee`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              level: feeLevel,
              amountPence: amt,
              isActive: feeActive,
            }),
          }
        );

        const feeJson = await feeRes.json().catch(() => ({}));
        if (!feeRes.ok) throw new Error(feeJson?.message || "Fee save failed.");

        if (feeJson?.course) setCourse(feeJson.course);
      }

      setNotice({ type: "ok", text: "Saved successfully." });
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      const msg = e?.message || "Save failed.";
      setNotice({ type: "error", text: msg });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-sm text-gray-700">Loading course…</div>;
  if (!course) return <div className="text-sm text-gray-700">Course not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Edit course</h2>
          <p className="mt-1 text-sm text-gray-700">
            Update details, advanced content, publishing state, and fee.
          </p>

          {course.updatedAt ? (
            <p className="mt-1 text-xs text-gray-500">
              Last saved: {formatLastSaved(course.updatedAt)}
            </p>
          ) : null}
        </div>

        {saving ? <div className="text-xs font-semibold text-gray-600">Saving…</div> : null}
      </div>

      {notice ? (
        <div
          className={
            notice.type === "ok"
              ? "rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
              : "rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          }
        >
          <div className="flex items-start justify-between gap-4">
            <span className="font-semibold">
              {notice.type === "ok" ? "Saved" : "Something went wrong"}
            </span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-xs font-semibold underline opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
          <p className="mt-1">{notice.text}</p>
        </div>
      ) : null}

      {/* Core details */}
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-gray-900">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm"
            disabled={saving}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-gray-900">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-mono"
            disabled={saving}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-gray-900">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm"
            disabled={saving}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-gray-900">Short description</label>
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            className="min-h-[90px] rounded-md border border-gray-300 bg-white px-4 py-3 text-sm"
            disabled={saving}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-gray-900">Overview</label>
          <textarea
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            className="min-h-[140px] rounded-md border border-gray-300 bg-white px-4 py-3 text-sm"
            disabled={saving}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              disabled={saving}
            />
            Published
          </label>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">Sort order</span>
            <input
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {/* Advanced content */}
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-gray-900">Advanced content</h3>
          <p className="mt-1 text-sm text-gray-700">
            Optional sections shown on the public course page.
          </p>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-gray-900">Who it’s for</label>
          <textarea
            value={whoItsFor}
            onChange={(e) => setWhoItsFor(e.target.value)}
            className="min-h-[90px] rounded-md border border-gray-300 bg-white px-4 py-3 text-sm"
            disabled={saving}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-gray-900">What you’ll learn</label>
          <textarea
            value={whatYoullLearn}
            onChange={(e) => setWhatYoullLearn(e.target.value)}
            className="min-h-[110px] rounded-md border border-gray-300 bg-white px-4 py-3 text-sm"
            disabled={saving}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-gray-900">Entry requirements</label>
          <textarea
            value={entryRequirements}
            onChange={(e) => setEntryRequirements(e.target.value)}
            className="min-h-[90px] rounded-md border border-gray-300 bg-white px-4 py-3 text-sm"
            disabled={saving}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-gray-900">Duration</label>
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm"
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold text-gray-900">Delivery</label>
            <input
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm"
              disabled={saving}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-gray-900">Start dates note</label>
          <textarea
            value={startDatesNote}
            onChange={(e) => setStartDatesNote(e.target.value)}
            className="min-h-[80px] rounded-md border border-gray-300 bg-white px-4 py-3 text-sm"
            disabled={saving}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-gray-900">Price note</label>
          <textarea
            value={priceNote}
            onChange={(e) => setPriceNote(e.target.value)}
            className="min-h-[80px] rounded-md border border-gray-300 bg-white px-4 py-3 text-sm"
            disabled={saving}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-gray-900">Hero image URL</label>
            <input
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-mono"
              disabled={saving}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold text-gray-900">Image alt text</label>
            <input
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm"
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {/* Fee */}
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-gray-900">Fee</h3>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-gray-900">Level</label>
          <select
            value={feeLevel}
            onChange={(e) => setFeeLevel(e.target.value as CourseLevel)}
            className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm"
            disabled={saving}
          >
            <option value="VOCATIONAL">VOCATIONAL</option>
            <option value="LEVEL3">LEVEL3</option>
            <option value="LEVEL4_5">LEVEL4_5</option>
            <option value="LEVEL7">LEVEL7</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-gray-900">Amount (pence)</label>
          <input
            value={amountPence}
            onChange={(e) => setAmountPence(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-mono"
            disabled={saving}
          />
          <p className="text-xs text-gray-500">
            Tip: leave as 0 if you don’t want to set a fee yet.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
          <input
            type="checkbox"
            checked={feeActive}
            onChange={(e) => setFeeActive(e.target.checked)}
            disabled={saving}
          />
          Fee active
        </label>
      </div>

      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={!canSave || saving}
          className="rounded-md bg-[color:var(--color-brand)] px-5 py-3 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>

        <button
          onClick={() => router.push("/admin/courses")}
          disabled={saving}
          className="rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
        >
          Back
        </button>
      </div>
    </div>
  );
}
