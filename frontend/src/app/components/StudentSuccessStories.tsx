// frontend/src/app/components/StudentSuccessStories.tsx
import Link from "next/link";

type Props = {
  variant?: "white" | "soft";
};

type Story = {
  initials: string;
  name: string;
  route: string;
  outcome: string;
  ctaHref?: string;
};

export default function StudentSuccessStories({ variant = "white" }: Props) {
  const bg = variant === "soft" ? "bg-[color:var(--color-brand-soft)]" : "bg-white";

  const stories: Story[] = [
    {
      initials: "MA",
      name: "Maryam",
      route: "Level 5 → University of Derby (Final year top-up)",
      outcome: "First Class — Integrative Health and Social Care (Top-up) BSc (Hons)",
      ctaHref: "/enquiry",
    },
    {
      initials: "KO",
      name: "Kola",
      route: "Level 5 → University of Derby (Final year top-up)",
      outcome: "First Class — Integrative Health and Social Care (Top-up) BSc (Hons)",
      ctaHref: "/enquiry",
    },
    {
      initials: "JU",
      name: "Jumoke",
      route: "Level 5 → Anglia Ruskin University (Final year top-up)",
      outcome: "2:1 — Management and Leadership in Health and Social Care (Top-up) BSc (Hons)",
      ctaHref: "/enquiry",
    },
    {
      initials: "AB",
      name: "Abi",
      route: "Level 7 → University of Gloucestershire (MBA top-up)",
      outcome: "Distinction — MBA top-up",
      ctaHref: "/enquiry",
    },
    {
      initials: "IB",
      name: "Ibrahim",
      route: "Level 5 Computing → Arden University (Top-up)",
      outcome: "First Class — Computing (Top-up) BSc (Hons)",
      ctaHref: "/enquiry",
    },
  ];

  return (
    <section className={`border-t ${bg}`}>
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Student success stories</h2>
            <p className="mt-2 text-sm text-gray-700">
              Real outcomes from learners who progressed to university top-up degrees.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/courses"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Browse courses
            </Link>
            <Link
              href="/enquiry"
              className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
            >
              Ask about progression →
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {stories.map((s) => (
            <div
              key={s.name + s.initials}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* brand accent */}
              <div className="h-1 w-full bg-[color:var(--color-brand)]" />

              {/* subtle glow/gradient */}
              <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-[color:var(--color-brand-soft)] blur-2xl opacity-70" />

              <div className="relative p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-xs font-bold text-[color:var(--color-brand)] ring-1 ring-red-200">
                    {s.initials}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-gray-500">{s.route}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-800">{s.outcome}</p>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                    Verified outcome
                  </span>

                  <Link
                    href={s.ctaHref || "/enquiry"}
                    className="text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
                  >
                    How do I follow this route?
                  </Link>
                </div>
              </div>

              {/* hover border glow */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent transition group-hover:ring-red-200" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
