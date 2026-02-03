// frontend/src/app/apply/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { COURSE_GROUPS } from "@/lib/courses";

type PresignedUpload = {
  key?: string;
  url?: string;
  s3Key?: string;
  uploadUrl?: string;

  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

type MeUser = {
  id: string;
  email: string;
  fullName: string | null;
  createdAt?: string;
} | null;

const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const MAX_FILES = 10;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100MB total
const MAX_PER_FILE_BYTES = 10 * 1024 * 1024; // 10MB per file

function parseDobToISO(dob: string) {
  const m = dob.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;

  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);

  const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (Number.isNaN(dt.getTime())) return null;

  // prevent rollover (e.g., 32/01/2020)
  if (
    dt.getUTCFullYear() !== yyyy ||
    dt.getUTCMonth() !== mm - 1 ||
    dt.getUTCDate() !== dd
  ) {
    return null;
  }

  return dt.toISOString();
}

function isEmailLike(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function ApplyPage() {
  const router = useRouter();
  const nextUrl = "/apply";

  // Auth status
  const [me, setMe] = useState<MeUser>(null);
  const [meChecked, setMeChecked] = useState(false);

  // Course
  const [courseName, setCourseName] = useState<string>("");
  const [otherCourseName, setOtherCourseName] = useState<string>("");

  // Required fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState(""); // DD/MM/YYYY
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState("");
  const [personalStatement, setPersonalStatement] = useState("");

  // Attachments
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appRef, setAppRef] = useState<string | null>(null);

  // Load auth state (/api/auth/me)
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!active) return;
        setMe(json?.user ?? null);
      } catch {
        if (!active) return;
        setMe(null);
      } finally {
        if (active) setMeChecked(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const totalBytes = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

  const dobIso = useMemo(() => parseDobToISO(dob), [dob]);

  const needsOtherCourse =
    courseName.trim().toUpperCase() === "OTHER" ||
    courseName.trim().toUpperCase() === "OTHERS";

  const formValid =
    courseName.trim().length > 0 &&
    (!needsOtherCourse || otherCourseName.trim().length >= 5) &&
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    dobIso !== null &&
    isEmailLike(email) &&
    phone.trim().length > 0 &&
    countryOfResidence.trim().length > 0 &&
    personalStatement.trim().length >= 50;

  const looksLikeAuthError =
    (error ?? "").toLowerCase().includes("logged in") ||
    (error ?? "").toLowerCase().includes("log in");

  const displayName = useMemo(() => {
    if (!me) return "";
    const name = (me.fullName || "").trim();
    return name || me.email;
  }, [me]);

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const combined = [...files, ...selected].slice(0, MAX_FILES);

    for (const f of combined) {
      if (!ALLOWED.includes(f.type)) {
        setError("Only PDF, JPG, PNG, or WEBP files are allowed.");
        return;
      }
      if (f.size > MAX_PER_FILE_BYTES) {
        setError("Each file must be 10MB or less.");
        return;
      }
    }

    const bytes = combined.reduce((s, f) => s + f.size, 0);
    if (bytes > MAX_TOTAL_BYTES) {
      setError("Total attachments must be 100MB or less.");
      return;
    }

    setError(null);
    setFiles(combined);
  }

  async function presignBatch(filesToUpload: File[]): Promise<PresignedUpload[]> {
    const res = await fetch("/api/applications/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: filesToUpload.map((f) => ({
          fileName: f.name,
          mimeType: f.type,
          sizeBytes: f.size,
        })),
      }),
    });

    if (res.status === 401) throw new Error("You must be logged in to upload attachments.");
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Presign failed");

    return (json.uploads ?? []) as PresignedUpload[];
  }

  async function uploadToS3(presigned: PresignedUpload[], filesToUpload: File[]) {
    if (presigned.length !== filesToUpload.length) {
      throw new Error("Upload preparation mismatch. Please try again.");
    }

    await Promise.all(
      presigned.map(async (u, idx) => {
        const file = filesToUpload[idx];
        const uploadUrl = u.url ?? u.uploadUrl;
        if (!uploadUrl) throw new Error("Missing upload URL from server.");

        const put = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!put.ok) throw new Error("S3 upload failed.");
      })
    );
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      router.push(`/login?next=${encodeURIComponent(nextUrl)}`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAppRef(null);

    // If we already know user is not logged in, do not proceed
    if (meChecked && !me) {
      setError("You must be logged in to submit an application.");
      return;
    }

    if (!formValid) {
      setError("Please complete all required fields correctly.");
      return;
    }

    if (files.length > MAX_FILES) {
      setError("Max 10 files.");
      return;
    }
    if (totalBytes > MAX_TOTAL_BYTES) {
      setError("Total attachments must be 100MB or less.");
      return;
    }

    setIsSubmitting(true);

    try {
      let uploads: PresignedUpload[] = [];
      if (files.length > 0) {
        uploads = await presignBatch(files);
        await uploadToS3(uploads, files);
      }

      const submitRes = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName,
          otherCourseName: needsOtherCourse ? otherCourseName.trim() : "",

          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dob: dob.trim(),
          email: email.trim(),
          phone: phone.trim(),
          countryOfResidence: countryOfResidence.trim(),
          personalStatement: personalStatement.trim(),

          attachments: uploads.map((u, i) => ({
            key: u.key ?? u.s3Key,
            s3Key: u.s3Key ?? u.key,
            fileName: files[i]?.name ?? u.fileName,
            mimeType: files[i]?.type ?? u.mimeType,
            sizeBytes: files[i]?.size ?? u.sizeBytes,
          })),
        }),
      });

      if (submitRes.status === 401) {
        throw new Error("You must be logged in to submit an application.");
      }

      const json = await submitRes.json().catch(() => ({}));
      if (!submitRes.ok) throw new Error(json.message || "Application failed");

      setAppRef(json.appRef);
      setFiles([]);
      setPersonalStatement("");
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="bg-white">
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-3xl font-bold text-gray-900">Course application</h1>
          <p className="mt-2 text-sm text-gray-700">
            Complete the form below to submit your application. You must be logged in.
            If you’re unsure, you can{" "}
            <Link
              href="/enquiry"
              className="font-semibold text-[color:var(--color-brand)] hover:underline"
            >
              send an enquiry
            </Link>
            .
          </p>

          {/* Logged-in banner */}
          {meChecked && me ? (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="text-sm font-semibold text-gray-900">
                Welcome back{displayName ? `, ${displayName}` : ""} — you’re logged in.
              </p>
              <p className="mt-1 text-sm text-gray-700">
                You can submit your application below, or view your previous applications.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/my-applications"
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  My applications
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : null}

          {/* Not logged-in prompt (better UX than waiting for an error) */}
          {meChecked && !me ? (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">
                Please login to continue
              </p>
              <p className="mt-1 text-sm text-gray-700">
                You need an account to submit an application. It only takes a minute.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/login?next=${encodeURIComponent(nextUrl)}`}
                  className="inline-flex items-center rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95"
                >
                  Login →
                </Link>
                <Link
                  href={`/register?next=${encodeURIComponent(nextUrl)}`}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
                >
                  Create account
                </Link>
              </div>
            </div>
          ) : null}

          {/* Helpful CTA if error suggests auth issue */}
          {looksLikeAuthError && !(meChecked && !me) && (
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/login?next=${encodeURIComponent(nextUrl)}`}
                className="inline-flex items-center rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95"
              >
                Login to continue →
              </Link>
              <Link
                href={`/register?next=${encodeURIComponent(nextUrl)}`}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
          {appRef && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <p className="font-semibold text-gray-900">Application submitted</p>
              <p className="mt-1 text-sm text-gray-700">
                Your reference:{" "}
                <span className="font-mono font-semibold">{appRef}</span>
              </p>
              <p className="mt-2 text-sm text-gray-600">We will contact you by email.</p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5"
          >
            {/* Course */}
            <div>
              <label className="block text-sm font-semibold text-gray-900">
                What course are you applying for? *
              </label>
              <select
                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              >
                <option value="">Select a course…</option>

                {COURSE_GROUPS.map((g) => (
                  <optgroup key={g.title} label={g.title}>
                    {g.courses.map((c) => (
                      <option key={`${g.title}-${c}`} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                ))}

                <option value="OTHER">Other (not listed)</option>
              </select>

              {needsOtherCourse && (
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-gray-900">
                    Please state your course (min 5 characters) *
                  </label>
                  <input
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                    value={otherCourseName}
                    onChange={(e) => setOtherCourseName(e.target.value)}
                    placeholder="Enter course name"
                  />
                </div>
              )}
            </div>

            {/* Applicant */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-900">
                  First name *
                </label>
                <input
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900">
                  Last name (Surname) *
                </label>
                <input
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900">
                  Date of birth (DD/MM/YYYY) *
                </label>
                <input
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder="e.g. 06/05/2009"
                  inputMode="numeric"
                />
                {!dobIso && dob.trim() !== "" && (
                  <p className="mt-1 text-xs text-red-600">
                    Use DD/MM/YYYY (e.g. 06/05/2009)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900">
                  Email *
                </label>
                <input
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  inputMode="email"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900">
                  Phone number *
                </label>
                <input
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +44..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900">
                  Country of residence *
                </label>
                <input
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                  value={countryOfResidence}
                  onChange={(e) => setCountryOfResidence(e.target.value)}
                  placeholder="e.g. United Kingdom"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Personal statement (in support of your application) *
              </label>
              <textarea
                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                rows={7}
                value={personalStatement}
                onChange={(e) => setPersonalStatement(e.target.value)}
                placeholder="Minimum 50 characters"
              />
              <div className="mt-2 text-xs text-gray-600">
                {personalStatement.trim().length}/50 minimum
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Attachments (optional)
              </label>
              <p className="text-sm text-gray-600">
                PDF/images only • max {MAX_FILES} files • max 10MB per file • max 100MB total
              </p>
              <input type="file" multiple accept=".pdf,image/*" onChange={onFilesChange} />
              <div className="text-sm text-gray-700">
                Files: {files.length}/{MAX_FILES} • Total: {totalMB} MB
              </div>

              {files.length > 0 && (
                <ul className="text-sm list-disc pl-5 text-gray-700">
                  {files.map((f, idx) => (
                    <li key={idx}>
                      {f.name} ({(f.size / (1024 * 1024)).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={!formValid || isSubmitting || (meChecked && !me)}
              className={`w-full rounded-md px-6 py-3 text-sm font-semibold text-white ${
                !formValid || isSubmitting || (meChecked && !me)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[color:var(--color-brand)] hover:bg-[color:var(--color-brand-dark)]"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit application"}
            </button>

            <p className="text-xs text-gray-500">
              By submitting this form, you confirm the information is accurate.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
