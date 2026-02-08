//src\app\register\page.tsx
import { Suspense } from "react";
import RegisterClient from "./RegisterClient";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto p-6">Loading…</div>}>
      <RegisterClient />
    </Suspense>
  );
}
