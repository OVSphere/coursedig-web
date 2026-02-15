// frontend/src/app/components/TrustLogosStrip.tsx
import Link from "next/link";

type Props = {
  variant?: "white" | "soft";
};

export default function TrustLogosStrip({ variant = "soft" }: Props) {
  const bg = variant === "soft" ? "bg-[color:var(--color-brand-soft)]" : "bg-white";

  return (
    <section className={`border-t ${bg}`}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[color:var(--color-brand)]">
              Trusted progression routes
            </h2>
            <p className="mt-1 text-sm text-gray-700">
              Learners progress to UK universities and achieve strong outcomes.
            </p>
          </div>

          <Link
            href="/enquiry"
            className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
          >
            Get guidance →
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[
            "University of Derby",
            "Anglia Ruskin University",
            "University of Gloucestershire",
            "Arden University",
          ].map((name) => (
            <div
              key={name}
              className="rounded-xl border border-gray-200 bg-white px-4 py-4 text-center text-sm font-semibold text-gray-900 shadow-sm"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
