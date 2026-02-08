// frontend/src/app/components/CourseCard.tsx
// ✅ NEW (CourseDig): Reusable card for courses (DB-driven slug, no guessing)

import Link from "next/link";

type Props = {
  title: string;
  slug: string;
  shortDescription?: string | null;
  category?: string | null;
  priceLabel?: string | null;
};

export default function CourseCard({
  title,
  slug,
  shortDescription,
  category,
  priceLabel,
}: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

        {priceLabel ? (
          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
            {priceLabel}
          </span>
        ) : null}
      </div>

      {category ? (
        <p className="mt-1 text-xs font-semibold text-gray-500">{category}</p>
      ) : null}

      <p className="mt-3 text-sm leading-6 text-gray-600">
        {shortDescription || "View details and next steps."}
      </p>

      <div className="mt-6 flex gap-3">
        <Link
          href={`/courses/${slug}`}
          className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
        >
          View details
        </Link>

        <Link
          href="/enquiry"
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
        >
          Enquire
        </Link>
      </div>
    </div>
  );
}
