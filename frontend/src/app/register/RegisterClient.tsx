// frontend/src/app/register/RegisterClient.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";

const MIN_PASSWORD_LEN = 8;

async function safeReadError(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const j = await res.json().catch(() => null);
    if (j?.message) return String(j.message);
    if (j?.error) return String(j.error);
    return `Request failed (HTTP ${res.status}).`;
  }

  const t = await res.text().catch(() => "");
  const cleaned = (t || "").trim();
  if (cleaned) return cleaned.slice(0, 600);
  return `Request failed (HTTP ${res.status}).`;
}

type Status = "form" | "success";

type PwChecks = {
  minLen: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
};

function getPwChecks(pw: string): PwChecks {
  return {
    minLen: pw.length >= MIN_PASSWORD_LEN,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

function isPwStrong(checks: PwChecks) {
  return (
    checks.minLen && checks.upper && checks.lower && checks.number && checks.special
  );
}

function normaliseSpaces(v: string) {
  return (v || "").replace(/\s+/g, " ").trim();
}

function isPhoneLike(v: string) {
  const s = normaliseSpaces(v);
  const digits = s.replace(/\D/g, "");
  const allowed = /^[+()\-\s0-9]+$/.test(s);
  return allowed && digits.length >= 10 && digits.length <= 15;
}

function isValidDobISO(yyyyMmDd: string) {
  const v = (yyyyMmDd || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  const todayUTC = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  return d.getTime() < todayUTC.getTime();
}

export default function RegisterClient() {
  const sp = useSearchParams();
  const next = useMemo(() => sp.get("next") || "/apply", [sp]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>("form");
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);

  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    phoneNumber: false,
    dateOfBirth: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  function isEmailLike(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  const pwChecks = useMemo(() => getPwChecks(password), [password]);
  const pwStrong = useMemo(() => isPwStrong(pwChecks), [pwChecks]);
  const pwMatch = useMemo(
    () => confirmPassword.length > 0 && password === confirmPassword,
    [password, confirmPassword]
  );
  const pwMismatch = useMemo(
    () => confirmPassword.length > 0 && password !== confirmPassword,
    [password, confirmPassword]
  );

  const identityOk = useMemo(() => {
    return (
      normaliseSpaces(firstName).length >= 2 &&
      normaliseSpaces(lastName).length >= 2 &&
      isPhoneLike(phoneNumber) &&
      isValidDobISO(dateOfBirth)
    );
  }, [firstName, lastName, phoneNumber, dateOfBirth]);

  const canSubmit =
    status === "form" &&
    !busy &&
    identityOk &&
    isEmailLike(email) &&
    pwStrong &&
    password === confirmPassword;

  const inputClass =
    "mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 " +
    "placeholder:text-gray-400 outline-none focus:border-[color:var(--color-brand)] " +
    "focus:ring-2 focus:ring-[color:var(--color-brand-soft)]";

  const inputInvalidClass =
    "mt-2 w-full rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-gray-900 " +
    "placeholder:text-gray-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100";

  const passwordWrapClass =
    "mt-2 flex w-full items-center rounded-md border border-gray-300 bg-white " +
    "focus-within:border-[color:var(--color-brand)] focus-within:ring-2 " +
    "focus-within:ring-[color:var(--color-brand-soft)]";

  const passwordWrapInvalidClass =
    "mt-2 flex w-full items-center rounded-md border border-red-300 bg-red-50 " +
    "focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100";

  const passwordInputClass =
    "w-full rounded-md bg-transparent px-4 py-3 text-sm text-gray-900 outline-none " +
    "placeholder:text-gray-400";

  function itemRow(ok: boolean, label: string) {
    return (
      <li className="flex items-start gap-2">
        <span
          className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
            ok ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          }`}
          aria-hidden="true"
        >
          {ok ? "✓" : "•"}
        </span>
        <span className={ok ? "text-green-800" : "text-gray-700"}>{label}</span>
      </li>
    );
  }

  function passwordMissingMessage(checks: PwChecks) {
    if (!checks.minLen)
      return `Password must be at least ${MIN_PASSWORD_LEN} characters long.`;
    if (!checks.upper) return "Add at least one uppercase letter (A–Z).";
    if (!checks.lower) return "Add at least one lowercase letter (a–z).";
    if (!checks.number) return "Add at least one number (0–9).";
    if (!checks.special) return "Add a special character (e.g. ! or @).";
    return null;
  }

  function identityMissingMessage() {
    if (normaliseSpaces(firstName).length < 2) return "Please enter your first name.";
    if (normaliseSpaces(lastName).length < 2) return "Please enter your last name.";
    if (!isPhoneLike(phoneNumber))
      return "Please enter a valid phone number (e.g. +447… or 07…).";
    if (!isValidDobISO(dateOfBirth))
      return "Please enter a valid date of birth (must be in the past).";
    return null;
  }

  const firstNameInvalid = touched.firstName && normaliseSpaces(firstName).length < 2;
  const lastNameInvalid = touched.lastName && normaliseSpaces(lastName).length < 2;
  const emailInvalid = touched.email && email.trim().length > 0 && !isEmailLike(email);
  const phoneInvalid = touched.phoneNumber && phoneNumber.trim().length > 0 && !isPhoneLike(phoneNumber);
  const dobInvalid = touched.dateOfBirth && dateOfBirth.trim().length > 0 && !isValidDobISO(dateOfBirth);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setDevVerifyUrl(null);

    setTouched({
      firstName: true,
      lastName: true,
      phoneNumber: true,
      dateOfBirth: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const identityMissing = identityMissingMessage();
    if (identityMissing) {
      setError(identityMissing);
      return;
    }

    if (!isEmailLike(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const missing = passwordMissingMessage(pwChecks);
    if (missing) {
      setError(missing);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    setBusy(true);

    try {
      const fullName = normaliseSpaces(`${firstName} ${lastName}`);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: normaliseSpaces(firstName),
          lastName: normaliseSpaces(lastName),
          phoneNumber: normaliseSpaces(phoneNumber),
          dateOfBirth,
          fullName,
          email,
          password,
        }),
      });

      if (!res.ok) {
        const msg = await safeReadError(res);
        setError(msg);
        return;
      }

      const data = await res.json().catch(() => ({}));

      const msg =
        data?.message ||
        "Account created. Please check your email to verify your address.";
      setSuccess(msg);

      const maybeDevUrl =
        (typeof data?.devVerifyUrl === "string" && data.devVerifyUrl) ||
        (typeof data?.verifyUrl === "string" && data.verifyUrl) ||
        (typeof data?.debug?.verifyUrl === "string" && data.debug.verifyUrl) ||
        null;

      if (maybeDevUrl) setDevVerifyUrl(maybeDevUrl);

      setStatus("success");
    } catch (e: any) {
      setError(e?.message || "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-140px)] bg-[color:var(--color-brand-soft)]">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="hidden lg:block">
            <div className="max-w-lg">
              <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>

              <p className="mt-4 text-sm leading-6 text-gray-700">
                Create an account so you can{" "}
                <span className="font-semibold text-gray-900">complete your application</span>,
                optionally <span className="font-semibold text-gray-900">upload documents</span>, and
                get clear updates on the next steps.
              </p>

              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-red-100 bg-white/70 p-5">
                  <p className="text-sm font-semibold text-gray-900">What happens next?</p>
                  <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[color:var(--color-brand)]">
                        1
                      </span>
                      We send a quick email verification link.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[color:var(--color-brand)]">
                        2
                      </span>
                      You log in and complete your application.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[color:var(--color-brand)]">
                        3
                      </span>
                      We review and contact you with next steps.
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-red-100 bg-white/70 p-5">
                  <p className="text-sm font-semibold text-gray-900">Not sure which course to pick?</p>
                  <p className="mt-1 text-sm text-gray-700">
                    Send an enquiry and we’ll guide you to the best pathway for your goals.
                  </p>
                  <Link
                    href="/enquiry"
                    className="mt-3 inline-flex items-center text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
                  >
                    Get free guidance →
                  </Link>
                </div>
              </div>

              <p className="mt-6 text-xs text-gray-500">
                Your details are handled securely. You can log in after registering, but you’ll be asked to verify your email before accessing restricted areas.
              </p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-gray-900">
                  {status === "success" ? "Check your email" : "Create account"}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  {status === "success"
                    ? "Your account has been created. Verify your email to unlock restricted features."
                    : "Create your account to apply. Email verification is required before accessing restricted areas."}
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {status === "success" ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  <p className="font-semibold">Almost there!</p>
                  <p className="mt-1">
                    {success || "Account created. Please check your email to verify your address."}
                  </p>

                  {devVerifyUrl ? (
                    <div className="mt-3 rounded-xl border border-green-200 bg-white p-3">
                      <p className="text-xs font-semibold text-green-900">Dev verification link</p>
                      <a
                        href={devVerifyUrl}
                        className="mt-1 block break-all text-xs font-semibold text-[color:var(--color-brand)] hover:underline"
                      >
                        {devVerifyUrl}
                      </a>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-col gap-2">
                    <Link
                      href={`/login?next=${encodeURIComponent(next)}`}
                      className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-brand)] px-5 py-3 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
                    >
                      Go to login
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setStatus("form");
                        setError(null);
                        setSuccess(null);
                        setDevVerifyUrl(null);

                        setPassword("");
                        setConfirmPassword("");

                        setFirstName("");
                        setLastName("");
                        setPhoneNumber("");
                        setDateOfBirth("");
                        setEmail("");

                        setTouched({
                          firstName: false,
                          lastName: false,
                          phoneNumber: false,
                          dateOfBirth: false,
                          email: false,
                          password: false,
                          confirmPassword: false,
                        });
                      }}
                      className="rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      Create a different account
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <form onSubmit={onSubmit} className="space-y-4">
                    {/* First name */}
                    <div>
                      <label className="text-sm font-semibold text-gray-900">First name *</label>
                      <input
                        className={firstNameInvalid ? inputInvalidClass : inputClass}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
                        placeholder="First name"
                        autoComplete="given-name"
                      />
                    </div>

                    {/* Last name */}
                    <div>
                      <label className="text-sm font-semibold text-gray-900">Last name *</label>
                      <input
                        className={lastNameInvalid ? inputInvalidClass : inputClass}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
                        placeholder="Last name"
                        autoComplete="family-name"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="text-sm font-semibold text-gray-900">Phone number *</label>
                      <input
                        className={phoneInvalid ? inputInvalidClass : inputClass}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, phoneNumber: true }))}
                        placeholder="+447… or 07…"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </div>

                    {/* DOB */}
                    <div>
                      <label className="text-sm font-semibold text-gray-900">Date of birth *</label>
                      <input
                        type="date"
                        className={dobInvalid ? inputInvalidClass : inputClass}
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, dateOfBirth: true }))}
                        autoComplete="bday"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-sm font-semibold text-gray-900">Email *</label>
                      <input
                        className={emailInvalid ? inputInvalidClass : inputClass}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                        placeholder="you@example.com"
                        inputMode="email"
                        autoComplete="email"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="text-sm font-semibold text-gray-900">Password *</label>
                      <div className={touched.password && !pwStrong && password ? passwordWrapInvalidClass : passwordWrapClass}>
                        <input
                          type={showPassword ? "text" : "password"}
                          className={passwordInputClass}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                          placeholder="Create a strong password"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="px-3 text-sm font-semibold text-gray-700 hover:text-gray-900"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>

                      <ul className="mt-3 space-y-1 text-xs">
                        {itemRow(pwChecks.minLen, `At least ${MIN_PASSWORD_LEN} characters`)}
                        {itemRow(pwChecks.upper, "At least one uppercase letter")}
                        {itemRow(pwChecks.lower, "At least one lowercase letter")}
                        {itemRow(pwChecks.number, "At least one number")}
                        {itemRow(pwChecks.special, "At least one special character")}
                      </ul>
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label className="text-sm font-semibold text-gray-900">Confirm password *</label>
                      <div className={pwMismatch ? passwordWrapInvalidClass : passwordWrapClass}>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className={passwordInputClass}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                          placeholder="Confirm your password"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="px-3 text-sm font-semibold text-gray-700 hover:text-gray-900"
                        >
                          {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                      </div>

                      {pwMatch ? (
                        <p className="mt-2 text-xs text-green-700">Passwords match.</p>
                      ) : null}
                      {pwMismatch ? (
                        <p className="mt-2 text-xs text-red-700">Passwords must match.</p>
                      ) : null}
                    </div>

                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className={`w-full rounded-md px-6 py-3 text-sm font-semibold text-white ${
                        !canSubmit
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-[color:var(--color-brand)] hover:bg-[color:var(--color-brand-dark)]"
                      }`}
                    >
                      {busy ? "Creating account…" : "Create account"}
                    </button>

                    {!canSubmit ? (
                      <p className="text-xs text-gray-500">
                        Complete all required fields (*) to enable submission.
                      </p>
                    ) : null}

                    <p className="text-sm text-gray-600">
                      Already have an account?{" "}
                      <Link
                        className="font-semibold text-[color:var(--color-brand)] hover:underline"
                        href={`/login?next=${encodeURIComponent(next)}`}
                      >
                        Sign in
                      </Link>
                    </p>
                  </form>

                  <div className="mt-6 text-xs text-gray-500">
                    By creating an account, you agree to our{" "}
                    <Link href="/terms" className="hover:underline">
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-red-100 bg-white/70 p-5 lg:hidden">
              <p className="text-sm font-semibold text-gray-900">Create your account</p>
              <p className="mt-1 text-sm text-gray-700">
                Verify your email to unlock restricted features, then complete your application.
              </p>
              <Link
                href="/enquiry"
                className="mt-3 inline-flex items-center text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
              >
                Get free guidance →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
