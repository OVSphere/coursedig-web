// frontend/src/app/verify-email-gate/page.tsx
import { Suspense } from "react";
import VerifyEmailGateClient from "./verify-email-gate-client";

export const dynamic = "force-dynamic";

export default function VerifyEmailGatePage() {
  return (
    <main className="min-h-[calc(100vh-140px)] bg-[color:var(--color-brand-soft)]">
      <Suspense
        fallback={
          <div className="mx-auto max-w-md px-6 py-16">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900">
                Verify your email to continue
              </h1>
              <p className="mt-3 text-sm text-gray-700">Loading…</p>
            </div>
          </div>
        }
      >
        <VerifyEmailGateClient />
      </Suspense>
    </main>
  );
}
