// frontend/src/app/page.tsx
import Image from "next/image";
import Link from "next/link";
import NewsletterForm from "./components/NewsletterForm";
import PopularCourses from "./components/PopularCourses";
import { getPrismaServer } from "@/lib/prisma-server";

function formatMoneyGBP(amountPence: number | null | undefined) {
  if (amountPence == null) return null;
  const pounds = amountPence / 100;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pounds);
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const { prisma } = getPrismaServer();

  const [vocational, level45, level7] = await Promise.all([
    prisma.course.findMany({
      where: { published: true, fee: { is: { level: "VOCATIONAL", isActive: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 3,
      include: { fee: true },
    }),

    prisma.course.findMany({
      where: { published: true, fee: { is: { level: "LEVEL4_5", isActive: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 3,
      include: { fee: true },
    }),

    prisma.course.findMany({
      where: { published: true, fee: { is: { level: "LEVEL7", isActive: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 3,
      include: { fee: true },
    }),
  ]);

  const vocationalCards = vocational.map((c) => ({
    title: c.title,
    slug: c.slug,
    shortDescription: c.shortDescription,
    category: c.category,
    priceLabel: c.fee?.amountPence ? formatMoneyGBP(c.fee.amountPence) : null,
  }));

  const level45Cards = level45.map((c) => ({
    title: c.title,
    slug: c.slug,
    shortDescription: c.shortDescription,
    category: c.category,
    priceLabel: c.fee?.amountPence ? formatMoneyGBP(c.fee.amountPence) : null,
  }));

  const level7Cards = level7.map((c) => ({
    title: c.title,
    slug: c.slug,
    shortDescription: c.shortDescription,
    category: c.category,
    priceLabel: c.fee?.amountPence ? formatMoneyGBP(c.fee.amountPence) : null,
  }));

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-[color:var(--color-brand)]">
                Professional Training • University Entry • Career Support
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
                Learn skills that move your career forward.
              </h1>

              <p className="mt-4 max-w-xl text-lg leading-8 text-gray-700">
                CourseDig offers practical training and support for learners
                progressing into work or university — from IT and analytics to
                health and social care.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-brand)] px-6 py-3 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
                >
                  Browse Courses
                </Link>

                <Link
                  href="/enquiry"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-transparent hover:bg-gray-50"
                >
                  Make an Enquiry
                </Link>
              </div>

              <p className="mt-4 text-sm text-gray-600">
                Already ready to apply?{" "}
                <Link
                  href="/apply"
                  className="font-semibold text-[color:var(--color-brand)] hover:underline"
                >
                  Start your application
                </Link>
                .
              </p>
            </div>

            {/* LOGO / VISUAL */}
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[color:var(--color-brand-soft)]">
                  <Image
                    src="/coursediglogo.png"
                    alt="CourseDig logo"
                    width={44}
                    height={44}
                    priority
                  />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">CourseDig</p>
                  <p className="text-sm text-gray-600">
                    Training that is practical, structured, and career-focused.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    Flexible learning
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Choose a pathway that fits your schedule.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    Real support
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Guidance from enrolment through completion.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    Clear outcomes
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Skills employers and universities recognise.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    Fast enquiries
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Quick response from admissions.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/scholarships"
                  className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black"
                >
                  Explore Scholarships
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DB-DRIVEN SECTIONS */}
      <PopularCourses
        title="Popular courses"
        subtitle="Explore a few of our most in-demand learning pathways."
        viewAllHref="/courses"
        viewAllLabel="View all courses"
        courses={vocationalCards}
        variant="white"
      />

      <PopularCourses
        title="Level 4 & 5 courses"
        subtitle="University first and second year entry routes."
        viewAllHref="/courses/level-4-and-5-university-first-second-year-courses"
        viewAllLabel="View Level 4 & 5 →"
        courses={level45Cards}
        variant="soft"
      />

      <PopularCourses
        title="Level 7 diplomas"
        subtitle="Advanced entry routes into Masters, MBA, and LLM programmes."
        viewAllHref="/courses/level-7-diploma-masters-llm-mba-advanced-entry"
        viewAllLabel="View Level 7 →"
        courses={level7Cards}
        variant="white"
      />

      {/* NEWSLETTER */}
      <section className="border-t bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Get updates from CourseDig
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                New courses, scholarship updates, and enrolment windows — straight
                to your inbox.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
