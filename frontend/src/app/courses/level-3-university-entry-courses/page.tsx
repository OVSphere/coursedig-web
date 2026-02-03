"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Course = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  shortDescription: string | null;
  sortOrder: number | null;
};

const CATEGORY = "Level 3 – University Entry Courses";

export default function Level3CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const abortRef = useRef<AbortController | null>(null);

  async function loadCourses() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/courses", {
        cache: "no-store",
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load courses.");
      }

      const allCourses: Course[] = Array.isArray(data?.courses) ? data.courses : [];

      const level3 = allCourses.filter((c) => c.category === CATEGORY);

      level3.sort((a, b) => {
        const ao = a.sortOrder ?? 9999;
        const bo = b.sortOrder ?? 9999;
        if (ao !== bo) return ao - bo;
        return a.title.localeCompare(b.title);
      });

      setCourses(level3);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
    return () => abortRef.current?.abort();
  }, []);

  return (
    <main className="bg-white">
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Leve 3 – University Entry Courses
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700">
            Level 3 qualifications designed to prepare learners for university
            entry or progression into higher education pathways.
          </p>

          <div className="mt-6">
            <Link
              href="/courses"
              className="text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
            >
              ← Back to all courses
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-10">
          {loading ? (
            <p className="text-sm text-gray-600">Loading courses…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : courses.length === 0 ? (
            <p className="text-sm text-gray-600">
              No Level 3 courses are available at the moment.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-transparent hover:shadow-md"
                >
                  <p className="text-base font-semibold text-gray-900">
                    {course.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {course.shortDescription || "View details and next steps."}
                  </p>

                  <div className="mt-4 inline-flex items-center text-sm font-semibold text-[color:var(--color-brand)]">
                    View course →
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <p className="text-sm text-gray-700">
              Not sure which course is right for you?{" "}
              <Link
                href="/enquiry"
                className="font-semibold text-[color:var(--color-brand)] hover:underline"
              >
                Send an enquiry
              </Link>{" "}
              and our team will guide you.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
