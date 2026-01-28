"use client";

import { useParams } from "next/navigation";

export default function CourseDetailsPage() {
  const params = useParams<{ id: string }>();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Course Details</h1>

      <p className="mt-2 text-gray-600">
        <strong>Course ID:</strong> {params?.id ?? "(missing)"}
      </p>
    </main>
  );
}
