//frontend/src/app/reset-password/page.tsx
import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-6 py-16">Loading…</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
