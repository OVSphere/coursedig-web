// frontend/src/app/courses/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

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
    select: { title: true, shortDescription: true, category: true },
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
      course.shortDescription ||
      `View details and next steps for ${course.title}.`,
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
  });

  if (!course) notFound();

  const category = course.category || "Course";
  const title = course.title || "Course";
  const shortDescription =
    course.shortDescription || "View details and next steps.";
  const overview =
    course.overview ||
    "Full course details will be published shortly. Please use the enquiry form if you have questions.";

  const delivery = course.delivery || "To be confirmed (online and/or in-person)";
  const duration = course.duration || "To be confirmed";
  const entryRequirements = course.entryRequirements || "To be confirmed";
  const priceNote = course.priceNote || "Pricing available on request.";

  return (
    <main className="bg-white">
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm font-semibold text-gray-700">{category}</p>

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

            <Link
              href="/courses"
              className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
            >
              Back to courses
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">Delivery</p>
              <p className="mt-1 text-sm text-gray-600">{delivery}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">Duration</p>
              <p className="mt-1 text-sm text-gray-600">{duration}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">
                Entry requirements
              </p>
              <p className="mt-1 text-sm text-gray-600">{entryRequirements}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">Overview</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">{overview}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">Fees</p>
              <p className="mt-2 text-sm text-gray-700">{priceNote}</p>
              <p className="mt-3 text-xs text-gray-500">
                For an accurate quote, please use the enquiry form.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
