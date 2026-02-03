// src/app/verify-email/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashVerificationToken } from "@/lib/emailVerification";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const sp = await searchParams;
  const rawToken = String(sp.token ?? "").trim();

  if (!rawToken) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-bold text-gray-900">Verification link invalid</h1>
        <p className="mt-2 text-gray-700">
          The verification token is missing. Please request a new verification email.
        </p>
      </main>
    );
  }

  const tokenHash = hashVerificationToken(rawToken);

  const token = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { userId: true, expiresAt: true },
  });

  if (!token || token.expiresAt.getTime() < Date.now()) {
    // Optional: delete expired token if found
    if (token) {
      await prisma.emailVerificationToken.delete({ where: { tokenHash } }).catch(() => {});
    }

    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-bold text-gray-900">Verification link expired</h1>
        <p className="mt-2 text-gray-700">
          This link is invalid or has expired. Please request a new verification email.
        </p>
      </main>
    );
  }

  // Mark verified + delete token
  await prisma.user.update({
    where: { id: token.userId },
    data: { emailVerifiedAt: new Date() },
  });

  await prisma.emailVerificationToken.delete({ where: { tokenHash } });

  // After verify, send them to login (or straight to /apply if you prefer)
  redirect("/login?verified=1");
}
