"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Course = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  shortDescription: string | null;
};

const CATEGORY =
  "Level 4 & 5 – University First and Second Year Courses";

export default function Level45CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(
          `/api/courses?q=${encodeURIComponent("Level 4 & 5")}`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load courses");
        }

        if (!active) return;

        const filtered = (data.courses || []).filter(
          (c: Course) => c.category === CATEGORY
        );

        setCourses(filtered);
      } catch (e: any) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="bg-white">
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Level 4 & 5 Courses
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-700">
            University first and second year equivalent qualifications.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-10">
          {loading && <p className="text-sm text-gray-600">Loading…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md"
                >
                  <p className="text-base font-semibold text-gray-900">
                    {course.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {course.shortDescription ||
                      "View details and next steps."}
                  </p>
                  <div className="mt-4 text-sm font-semibold text-[color:var(--color-brand)]">
                    View course →
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
