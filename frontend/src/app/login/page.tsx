// frontend/src/app/login/page.tsx
import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-6 py-16">Loading…</div>}>
      <LoginClient />
    </Suspense>
  );
}
