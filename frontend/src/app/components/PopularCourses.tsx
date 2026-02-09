// frontend/src/app/components/PopularCourses.tsx
import Link from "next/link";
import CourseCard from "./CourseCard";

type CourseItem = {
  title: string;
  slug: string;
  shortDescription?: string | null;
  category?: string | null;
  priceLabel?: string | null;

  // ✅ NEW
  imageSrc?: string | null;
  imageAlt?: string | null;
};

type Props = {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  courses: CourseItem[];
  variant?: "white" | "soft";
};

export default function PopularCourses({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View all",
  courses,
  variant = "white",
}: Props) {
  const bg = variant === "soft" ? "bg-[color:var(--color-brand-soft)]" : "bg-white";

  return (
    <section className={variant === "soft" ? `border-t ${bg}` : bg}>
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {subtitle ? <p className="mt-2 text-sm text-gray-700">{subtitle}</p> : null}
          </div>

          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
            >
              {viewAllLabel}
            </Link>
          ) : null}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {courses.map((c) => (
            <CourseCard
              key={c.slug}
              title={c.title}
              slug={c.slug}
              shortDescription={c.shortDescription}
              category={c.category}
              priceLabel={c.priceLabel}
              imageSrc={c.imageSrc}
              imageAlt={c.imageAlt}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
