// frontend/src/app/page.tsx
import Link from "next/link";
import Image from "next/image";
import NewsletterForm from "./components/NewsletterForm";
import PopularCourses from "./components/PopularCourses";
import TrustLogosStrip from "./components/TrustLogosStrip";
import StudentSuccessStories from "./components/StudentSuccessStories";
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
  let popularCards: Array<{
    title: string;
    slug: string;
    shortDescription: string | null;
    category: string | null;
    priceLabel: string | null;
    imageSrc: string | null;
    imageAlt: string;
  }> = [];

  let coursesError: string | null = null;

  try {
    const { prisma } = getPrismaServer();

    const popular = await prisma.course.findMany({
      where: {
        published: true,
        homePopularRank: { not: null },
      },
      orderBy: [{ homePopularRank: "asc" }, { updatedAt: "desc" }],
      take: 6,
      include: { fee: true },
    });

    const popularFinal =
      popular.length > 0
        ? popular
        : await prisma.course.findMany({
            where: { published: true },
            orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
            take: 6,
            include: { fee: true },
          });

    popularCards = popularFinal.map((c) => ({
      title: c.title,
      slug: c.slug,
      shortDescription: c.shortDescription,
      category: c.category,
      priceLabel: c.fee?.amountPence ? formatMoneyGBP(c.fee.amountPence) : null,
      imageSrc: c.heroImage || null,
      imageAlt: c.imageAlt || c.title,
    }));
  } catch (err: any) {
    console.error("[HOME] Failed to load popular courses:", err?.message || err);
    coursesError = "Popular courses are temporarily unavailable. Please refresh shortly.";
    popularCards = [];
  }

  const features = [
    {
      title: "Flexible learning",
      description: "Choose a pathway that fits your schedule.",
      image: "/icons/flexible-learning.jpg",
    },
    {
      title: "Real support",
      description: "Guidance from enrolment through completion.",
      image: "/icons/real-support.jpg",
    },
    {
      title: "Clear outcomes",
      description: "Skills employers and universities recognise.",
      image: "/icons/clear-outcomes.jpg",
    },
    {
      title: "Fast enquiries",
      description: "Quick response from admissions.",
      image: "/icons/fast-enquiries.jpg",
    },
  ] as const;

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
                Practical courses that lead to real progression.
              </h1>

              <p className="mt-4 max-w-xl text-lg leading-8 text-gray-700">
                Learn with structured support, clear outcomes, and pathways into work or UK university top-up routes —
                across computing, business, health and social care, and more.
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
                  Get free guidance
                </Link>
              </div>

              <p className="mt-4 text-sm text-gray-600">
                Already ready to apply?{" "}
                <Link href="/apply" className="font-semibold text-[color:var(--color-brand)] hover:underline">
                  Start your application
                </Link>
                .
              </p>

              {/* ✅ Red + bold (as requested) */}
              <p className="mt-4 text-sm font-bold text-[color:var(--color-brand)]">
                Many learners progress to UK top-up degrees and achieve strong classifications.
              </p>
            </div>

            {/* RIGHT CARD */}
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <div>
                <p className="text-base font-semibold text-gray-900">Training that is practical, structured, and career focused.</p>
                <p className="mt-1 text-sm text-gray-600">Clear pathways, real support, and outcomes you can use.</p>
              </div>

              {/* Feature tiles with images + overlay */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {features.map((f) => (
                  <div
                    key={f.title}
                    className="group relative h-32 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm"
                  >
                    <Image
                      src={f.image}
                      alt={f.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/70 to-white/35" />
                    <div className="absolute inset-0 flex flex-col justify-end p-4">
                      <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                      <p className="mt-1 text-sm text-gray-700">{f.description}</p>
                    </div>
                    <div className="pointer-events-none absolute inset-0 ring-1 ring-transparent transition group-hover:ring-gray-300" />
                  </div>
                ))}
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

      {/* Trust strip */}
      <TrustLogosStrip variant="soft" />

      {/* Success stories */}
      <StudentSuccessStories variant="white" />

      {/* POPULAR COURSES */}
      {coursesError ? (
        <section className="border-t bg-white">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <div className="rounded-2xl border border-gray-200 bg-[color:var(--color-brand-soft)] p-6 text-sm text-gray-900">
              {coursesError}
            </div>
          </div>
        </section>
      ) : null}

      <PopularCourses
        title="Popular courses"
        subtitle="Explore a few of our most in demand learning pathways."
        viewAllHref="/courses"
        viewAllLabel="View all courses"
        courses={popularCards}
        variant="white"
      />

      {/* NEWSLETTER */}
      <section className="border-t bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Get updates from CourseDig</h2>
              <p className="mt-2 text-sm text-gray-600">
                New courses, scholarship updates, and enrolment windows, straight to your inbox.
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
