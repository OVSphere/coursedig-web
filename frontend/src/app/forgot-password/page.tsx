//frontend/src/app/forgot-password/page.tsx
import { Suspense } from "react";
import ForgotPasswordClient from "./ForgotPasswordClient";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-6 py-16">Loading…</div>}>
      <ForgotPasswordClient />
    </Suspense>
  );
}
