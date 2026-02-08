// frontend/src/app/admin/courses/[id]/edit/page.tsx
import Link from "next/link";
import AdminCourseEditClient from "./ui/AdminCourseEditClient";

export const dynamic = "force-dynamic";

export default async function AdminCourseEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-700">Course not found.</p>
        <Link
          href="/admin/courses"
          className="mt-4 inline-flex text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
        >
          ← Back to courses
        </Link>
      </div>
    );
  }

  return <AdminCourseEditClient id={id} />;
}
