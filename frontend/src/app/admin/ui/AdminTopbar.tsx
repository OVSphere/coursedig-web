// frontend/src/app/admin/ui/AdminTopbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminTopbar() {
  const pathname = usePathname() || "/admin";
  const isDashboard = pathname === "/admin";

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      {/* ✅ Only show on non-dashboard admin pages */}
      {!isDashboard ? (
        <Link
          href="/admin"
          className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
        >
          ← Back to dashboard
        </Link>
      ) : (
        <span /> // keeps spacing aligned with right-side link
      )}

      <Link
        href="/"
        className="text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
      >
        Back to site →
      </Link>
    </div>
  );
}
