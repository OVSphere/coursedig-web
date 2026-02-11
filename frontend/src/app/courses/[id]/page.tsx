// frontend/src/app/courses/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

function formatGBPFromPence(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

function getCategoryBackLink(category: string | null | undefined) {
  const cat = (category || "").trim();

  const MAP: Record<
    string,
    { href: string; label: string }
  > = {
    "Vocational Training / Professional Certificate Courses": {
      href: "/courses/vocational-training-professional-certificate-courses",
      label: "Back to Vocational courses",
    },
    "Level 3 – University Entry Courses": {
      href: "/courses/level-3-university-entry-courses",
      label: "Back to Level 3 courses",
    },
    "Level 4 & 5 – University First and Second Year Courses": {
      href: "/courses/level-4-and-5-university-first-second-year-courses",
      label: "Back to Level 4 & 5 courses",
    },
    "Level 7 Diploma – Masters / LLM / MBA Advanced Entry": {
      href: "/courses/level-7-diploma-masters-llm-mba-advanced-entry",
      label: "Back to Level 7 diplomas",
    },
  };

  return MAP[cat] || { href: "/courses", label: "Back to all courses" };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const slug = String(id || "").trim();

  if (!slug) {
    return {
      title: "Course not found | CourseDig",
      description: "Course details not available.",
    };
  }

  const course = await prisma.course.findFirst({
    where: { slug, published: true },
    select: {
      title: true,
      shortDescription: true,
      category: true,
      heroImage: true,
      imageAlt: true,
    },
  });

  if (!course) {
    return {
      title: "Course not found | CourseDig",
      description: "Course details not available.",
    };
  }

  return {
    title: `${course.title} | CourseDig`,
    description:
      course.shortDescription || `View details and next steps for ${course.title}.`,
    openGraph: course.heroImage
      ? {
          title: `${course.title} | CourseDig`,
          images: [
            {
              url: course.heroImage,
              alt: course.imageAlt || course.title,
            },
          ],
        }
      : undefined,
  };
}

export default async function CourseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const slug = String(id || "").trim();
  if (!slug) notFound();

  const course = await prisma.course.findFirst({
    where: { slug, published: true },
    include: { fee: true },
  });

  if (!course) notFound();

  const category = course.category || "Course";
  const title = course.title || "Course";
  const shortDescription = course.shortDescription || "View details and next steps.";

  const overview =
    course.overview ||
    "Full course details will be published shortly. Please use the enquiry form if you have questions.";

  const whoItsFor = course.whoItsFor?.trim() || "";
  const whatYoullLearn = course.whatYoullLearn?.trim() || "";
  const startDatesNote = course.startDatesNote?.trim() || "";

  const entryRequirements = course.entryRequirements || "To be confirmed";
  const duration = course.duration || "To be confirmed";
  const delivery = course.delivery || "To be confirmed (online and/or in-person)";

  const fee = course.fee && course.fee.isActive ? course.fee : null;

  // ✅ Show priceNote even when fee exists (as you requested)
  const priceNote =
    (course.priceNote && String(course.priceNote).trim()) ||
    "Pricing details are available on request.";

  const heroImage = course.heroImage || "";
  const imageAlt = course.imageAlt || title;

  const back = getCategoryBackLink(course.category);

  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm font-semibold text-gray-700">{category}</p>

          <div className="mt-3 grid gap-6 md:grid-cols-12 md:items-start">
            <div className={heroImage ? "md:col-span-7" : "md:col-span-12"}>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">{title}</h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-700">
                {shortDescription}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-brand)] px-6 py-3 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
                >
                  Apply now
                </Link>

                <Link
                  href="/enquiry"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  Ask a question
                </Link>

                {/* ✅ Back link now goes to correct category page */}
                <Link
                  href={back.href}
                  className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
                >
                  {back.label}
                </Link>
              </div>
            </div>

            {heroImage ? (
              <div className="md:col-span-5">
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <img
                    src={heroImage}
                    alt={imageAlt}
                    className="h-56 w-full object-cover md:h-64"
                    loading="lazy"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Main content layout */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
            {/* LEFT */}
            <div className="lg:col-span-6 flex">
              <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">Overview</p>
                <p className="mt-2 text-sm leading-6 text-gray-700">{overview}</p>

                {whoItsFor ? (
                  <div className="mt-6">
                    <p className="text-sm font-semibold text-gray-900">Who it’s for</p>
                    <p className="mt-2 text-sm leading-6 text-gray-700">{whoItsFor}</p>
                  </div>
                ) : null}

                {whatYoullLearn ? (
                  <div className="mt-6">
                    <p className="text-sm font-semibold text-gray-900">What you’ll learn</p>
                    <p className="mt-2 text-sm leading-6 text-gray-700">{whatYoullLearn}</p>
                  </div>
                ) : null}

                {startDatesNote ? (
                  <div className="mt-6">
                    <p className="text-sm font-semibold text-gray-900">Start dates</p>
                    <p className="mt-2 text-sm leading-6 text-gray-700">{startDatesNote}</p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* MIDDLE */}
            <div className="lg:col-span-3 flex">
              <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">Entry requirements</p>
                <p className="mt-2 text-sm leading-6 text-gray-700">{entryRequirements}</p>
              </div>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-3 grid gap-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">Duration</p>
                <p className="mt-1 text-sm text-gray-600">{duration}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">Delivery</p>
                <p className="mt-1 text-sm text-gray-600">{delivery}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">Fees</p>

                {fee ? (
                  <>
                    {/* ✅ removed (LEVEL7) / category label beside fee */}
                    <p className="mt-2 text-sm text-gray-700">
                      <span className="font-semibold">
                        {formatGBPFromPence(fee.amountPence)}
                      </span>
                    </p>

                    {/* ✅ show priceNote below fee (as requested) */}
                    {priceNote ? (
                      <p className="mt-3 text-sm leading-6 text-gray-700">{priceNote}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-gray-700">{priceNote}</p>
                )}

                <p className="mt-3 text-xs text-gray-500">
                  For an accurate quote, please use the enquiry form.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
