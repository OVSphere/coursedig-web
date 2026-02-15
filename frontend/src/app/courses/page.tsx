// src/app/courses/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Course = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  shortDescription: string | null;
  sortOrder: number | null;
};

type CategoryCard = {
  key: string;
  title: string;
  subtitle: string;
  route: string;
  audience: string;
  examples: string[];
};

const CATEGORY_CARDS: CategoryCard[] = [
  {
    key: "vocational",
    title: "Vocational Training / Professional Certificate Courses",
    subtitle:
      "Short, practical programmes designed to help you gain job ready skills quickly.",
    route: "/courses/vocational-training-professional-certificate-courses",
    audience:
      "Best for career starters, career changers, and professional upskilling.",
    examples: ["Data Analytics", "Cybersecurity Fundamentals", "Software Testing"],
  },
  {
    key: "level3",
    title: "Level 3 – University Entry Courses",
    subtitle:
      "Progression programmes to support university entry and academic readiness.",
    route: "/courses/level-3-university-entry-courses",
    audience:
      "Best for learners aiming to meet entry requirements and build confidence.",
    examples: ["Business Studies", "Information Technology", "Health & Social Care"],
  },
  {
    key: "level45",
    title: "Level 4 & 5 – University First and Second Year Courses",
    subtitle:
      "Advance entry to university final year, routes equivalent to university Year 1 & Year 2 (where applicable).",
    route: "/courses/level-4-and-5-university-first-second-year-courses",
    audience: "Best for learners who want a structured pathway towards a full degree.",
    examples: ["IT and Computing", "Health and Social Care", "Business Management"],
  },
  {
    key: "level7",
    title: "Level 7 Diploma – Masters / LLM / MBA Advanced Entry",
    subtitle:
      "Postgraduate level diplomas that can support advanced entry routes (where applicable).",
    route: "/courses/level-7-diploma-masters-llm-mba-advanced-entry",
    audience:
      "Best for professionals targeting senior roles and postgraduate progression.",
    examples: ["Project Management", "Strategic Management", "International Business Law"],
  },
];

const PREFERRED_ORDER = [
  "Vocational Training / Professional Certificate Courses",
  "Level 3 – University Entry Courses",
  "Level 4 & 5 – University First and Second Year Courses",
  "Level 7 Diploma – Masters / LLM / MBA Advanced Entry",
];

function buildUrl(q: string) {
  const qs = q.trim();
  return qs ? `/api/courses?q=${encodeURIComponent(qs)}` : "/api/courses";
}

function sortCourses(list: Course[]) {
  return [...list].sort((a, b) => {
    const ao = a.sortOrder ?? 9999;
    const bo = b.sortOrder ?? 9999;
    if (ao !== bo) return ao - bo;
    return a.title.localeCompare(b.title);
  });
}

export default function AllCoursesPage() {
  const [query, setQuery] = useState("");
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  async function loadCourses(q: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError("");

      const res = await fetch(buildUrl(q), {
        cache: "no-store",
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load courses.");

      setAllCourses(Array.isArray(data?.courses) ? data.courses : []);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }

  // Initial load (full catalogue)
  useEffect(() => {
    loadCourses("");
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search (uses server-side search endpoint)
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      loadCourses(query);
    }, 350);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustives-deps
  }, [query]);

  const byCategory = useMemo(() => {
    const map = new Map<string, Course[]>();
    for (const c of allCourses) {
      const key = (c.category || "Other").trim() || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }

    // Ensure consistent ordering in UI
    const ordered = new Map<string, Course[]>();
    for (const cat of PREFERRED_ORDER) {
      if (map.has(cat)) ordered.set(cat, sortCourses(map.get(cat)!));
    }
    for (const [k, v] of map.entries()) {
      if (!ordered.has(k)) ordered.set(k, sortCourses(v));
    }
    return ordered;
  }, [allCourses]);

  const totalCourses = useMemo(() => {
    let sum = 0;
    for (const [, list] of byCategory.entries()) sum += list.length;
    return sum;
  }, [byCategory]);

  const topSearchResults = useMemo(() => {
    if (!query.trim()) return [];
    return sortCourses(allCourses).slice(0, 9);
  }, [allCourses, query]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const [k, list] of byCategory.entries()) counts.set(k, list.length);
    return counts;
  }, [byCategory]);

  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:items-center">
            {/* Left: text + search */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Courses</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700">
                Explore CourseDig programmes designed for university progression and
                career outcomes. Start with a category below, or search for a course
                by name.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/enquiry"
                  className="inline-flex items-center rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95"
                >
                  Get free guidance →
                </Link>
                <Link
                  href="/apply"
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
                >
                  Apply now
                </Link>
              </div>

              {/* Search */}
              <div className="mt-8 max-w-xl">
                <label className="block text-sm font-semibold text-gray-900">
                  Search all courses
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Data Analytics, Law, IELTS, Project Management..."
                    className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                  />
                  {query.trim() ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>

                <p className="mt-2 text-sm text-gray-600">
                  {query.trim()
                    ? loading
                      ? "Searching…"
                      : `${topSearchResults.length} result(s) shown`
                    : loading
                    ? "Loading course catalogue…"
                    : `${totalCourses} courses available across key pathways.`}
                </p>

                {error ? (
                  <p className="mt-3 text-sm text-red-600">{error}</p>
                ) : null}
              </div>

              {/* Search results (only show when searching) */}
              {query.trim() && !loading && !error ? (
                <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
                  {topSearchResults.length === 0 ? (
                    <p className="text-sm text-gray-700">
                      No matches found. Try a different keyword, or browse a
                      category below.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-gray-900">
                        Quick results
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {topSearchResults.map((c) => (
                          <Link
                            key={c.id}
                            href={`/courses/${c.slug}`}
                            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-transparent hover:shadow-md"
                          >
                            <p className="text-sm font-semibold text-gray-900">
                              {c.title}
                            </p>
                            <p className="mt-1 text-xs text-gray-600">
                              {c.category || "Course"}
                            </p>
                            <p className="mt-2 text-sm text-gray-700">
                              {c.shortDescription || "View details and next steps."}
                            </p>
                            <div className="mt-3 inline-flex items-center text-sm font-semibold text-[color:var(--color-brand)]">
                              View course →
                            </div>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            {/* Right: hero image */}
            <div className="hidden lg:block">
              <div className="relative overflow-hidden rounded-2xl border border-red-100 shadow-sm">
                <img
                  src="/course-images/all-courses-hero.jpg"
                  alt="Diverse university students studying together and planning their education pathways"
                  className="h-[420px] w-full object-cover"
                />
                {/* subtle overlay to blend with brand-soft background */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
              </div>

              <div className="mt-4 rounded-xl border border-red-100 bg-white/70 p-4">
                <p className="text-sm font-semibold text-gray-900">
                  Start with the right pathway
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  Browse by level for clearer progression, or search for a course name.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category cards */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Choose a pathway
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-700">
                Pick a category to see the full list of courses, entry guidance,
                and progression options.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {CATEGORY_CARDS.map((card) => {
              const count = categoryCounts.get(card.title) ?? 0;
              return (
                <div
                  key={card.key}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {count} course{count === 1 ? "" : "s"}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-gray-900">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-700">{card.subtitle}</p>
                    </div>

                    <Link
                      href={card.route}
                      className="shrink-0 rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95"
                    >
                      View courses →
                    </Link>
                  </div>

                  <p className="mt-4 text-sm text-gray-700">{card.audience}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {card.examples.map((ex) => (
                      <span
                        key={ex}
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>

                  {/* Optional: show first 3 course links for each category */}
                  {count > 0 ? (
                    <div className="mt-5">
                      <p className="text-sm font-semibold text-gray-900">
                        Popular in this category
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(byCategory.get(card.title) ?? []).slice(0, 3).map((c) => (
                          <Link
                            key={c.id}
                            href={`/courses/${c.slug}`}
                            className="text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
                          >
                            {c.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-gray-600">
                      Courses for this category will appear here shortly.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Trust / reassurance section */}
          <div className="mt-10 grid gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Practical support</p>
              <p className="mt-1 text-sm text-gray-700">
                Clear pathways, guidance, and next steps from enquiry to enrolment.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Flexible learning</p>
              <p className="mt-1 text-sm text-gray-700">
                Options designed to fit around work, family, and busy schedules.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Progression focus</p>
              <p className="mt-1 text-sm text-gray-700">
                Programmes structured for job outcomes and university progression.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-700">
              Not sure which course is right for you?{" "}
              <Link
                href="/enquiry"
                className="font-semibold text-[color:var(--color-brand)] hover:underline"
              >
                Send an enquiry
              </Link>{" "}
              and our team will guide you based on your goals.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
