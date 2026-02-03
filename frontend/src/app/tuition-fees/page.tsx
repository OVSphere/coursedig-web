// src/app/tuition-fees/page.tsx
import Link from "next/link";

// ✅ Adjust this import to match your prisma singleton file location.
import { prisma } from "@/lib/prisma";

type GroupKey = "VOCATIONAL" | "LEVEL3" | "LEVEL4_5" | "LEVEL7";

const GROUPS: Array<{ key: GroupKey; title: string; href: string }> = [
  {
    key: "VOCATIONAL",
    title: "Vocational Training / Professional Certificate Courses",
    href: "/courses/vocational-training-professional-certificate-courses",
  },
  {
    key: "LEVEL3",
    title: "Level 3 – University Entry Courses",
    href: "/courses/level-3-university-entry-courses",
  },
  {
    key: "LEVEL4_5",
    title: "Level 4 & 5 – University First and Second Year Courses",
    href: "/courses/level-4-and-5-university-first-second-year-courses",
  },
  {
    key: "LEVEL7",
    title: "Level 7 Diploma – Masters / LLM / MBA Advanced Entry",
    href: "/courses/level-7-diploma-masters-llm-mba-advanced-entry",
  },
];

function formatGBPFromPence(amountPence: number) {
  const pounds = amountPence / 100;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pounds);
}

export default async function TuitionFeesPage() {
  const rows = await prisma.course.findMany({
    where: { published: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
    include: { fee: true },
  });

  // Only show courses that have an active fee row
  const coursesWithFees = rows.filter((c) => c.fee?.isActive);

  const grouped = GROUPS.map((g) => ({
    ...g,
    items: coursesWithFees.filter((c) => c.fee?.level === g.key),
  }));

  return (
    <main className="bg-[color:var(--color-brand-soft)]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          {/* LEFT: reassurance / image / links */}
          <section className="hidden lg:block">
            <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <h1 className="text-3xl font-bold text-gray-900">
                Tuition Fees & Payment Options
              </h1>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                We keep tuition clear and supportive — with flexible options available, so you can focus on learning
                and progression.
              </p>

              {/* Hero image */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/tuition-fees/tuition-fees.jpg"
                  alt="Students studying across vocational, undergraduate, and postgraduate programmes"
                  className="h-56 w-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-sm font-semibold text-gray-900">Pay Monthly</p>
                  <p className="mt-2 text-sm text-gray-700">
                    Spread tuition across manageable instalments. We’ll agree an option that fits your circumstances.
                  </p>
                  <Link
                    href="/enquiry"
                    className="mt-3 inline-flex text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
                  >
                    Discuss a plan
                  </Link>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-sm font-semibold text-gray-900">Pay in Full (save 10%)</p>
                  <p className="mt-2 text-sm text-gray-700">
                    Prefer to pay once and move on? Pay in full (where available) and receive a 10% discount. If you’re
                    unsure what suits you best, we can help you choose an option that works.
                  </p>
                  <Link
                    href="/enquiry"
                    className="mt-3 inline-flex text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
                  >
                    Speak to us about options
                  </Link>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-sm font-semibold text-gray-900">Scholarships & Support</p>
                  <p className="mt-2 text-sm text-gray-700">
                    If you’re eligible, scholarship support may be available to reduce your tuition fee.
                  </p>
                  <Link
                    href="/scholarships"
                    className="mt-3 inline-flex text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
                  >
                    Explore scholarships
                  </Link>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-sm font-semibold text-gray-900">What’s Included</p>
                  <p className="mt-2 text-sm text-gray-700">
                    Learning support, materials guidance, and tutor support — plus guidance on university progression
                    and final-year admission for eligible students (where applicable).
                  </p>
                  <Link
                    href="/courses"
                    className="mt-3 inline-flex text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
                  >
                    View all programmes
                  </Link>
                </div>

                <div className="rounded-2xl border border-red-100 bg-[color:var(--color-brand-soft)] p-5">
                  <p className="text-sm font-semibold text-gray-900">A calm next step</p>
                  <p className="mt-2 text-sm text-gray-700">
                    Progress is rarely about finding the perfect time — it’s about taking the next sensible step. If
                    you’re ready to learn, we’ll help you choose a tuition option that works.
                  </p>
                  <Link
                    href="/enquiry"
                    className="mt-3 inline-flex text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
                  >
                    Talk to us
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: fee tables */}
          <section>
            <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-gray-900">Course fees</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Fees are listed by course level. For tailored payment options, please{" "}
                  <Link href="/enquiry" className="font-semibold text-[color:var(--color-brand)] hover:underline">
                    send an enquiry
                  </Link>
                  .
                </p>
              </div>

              {/* ✅ REMOVED: top buttons (View All Courses / Ask about fees...) */}

              <div className="mt-6 space-y-8">
                {grouped.map((g) => (
                  <div key={g.key}>
                    <div className="flex items-end justify-between gap-4">
                      <h3 className="text-lg font-bold text-gray-900">{g.title}</h3>

                      <Link
                        href={g.href}
                        className="text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
                      >
                        Course details
                      </Link>
                    </div>

                    {g.items.length === 0 ? (
                      <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                        Fees for this category will appear here once published.
                      </div>
                    ) : (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 font-semibold text-gray-900">Course</th>
                              <th className="px-4 py-3 font-semibold text-gray-900">Tuition fee</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {g.items.map((c) => {
                              const fee = c.fee!;
                              return (
                                <tr key={c.id}>
                                  <td className="px-4 py-3 font-semibold text-gray-900">{c.title}</td>
                                  <td className="px-4 py-3 text-gray-900">
                                    {formatGBPFromPence(fee.amountPence)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile reassurance block */}
              <div className="mt-8 rounded-2xl border border-red-100 bg-[color:var(--color-brand-soft)] p-4 lg:hidden">
                <p className="text-sm text-gray-700">
                  Unsure which payment option fits you best?{" "}
                  <Link href="/enquiry" className="font-semibold text-[color:var(--color-brand)] hover:underline">
                    Send an enquiry
                  </Link>{" "}
                  and we’ll guide you.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
