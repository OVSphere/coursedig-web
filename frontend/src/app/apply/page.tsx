// frontend/src/app/apply/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { COURSE_GROUPS } from "@/lib/courses";
// ✅ CHANGE (CourseDig): import useMe to auto-fill identity fields
import { useMe } from "@/lib/useMe";

type PresignedUpload = {
  key?: string;
  url?: string;
  s3Key?: string;
  uploadUrl?: string;

  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const MAX_FILES = 10;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100MB total
const MAX_PER_FILE_BYTES = 10 * 1024 * 1024; // 10MB per file

const PS_MIN = 50;
const PS_MAX = 2000;

// ✅ CHANGE (CourseDig): convert ISO DOB -> DD/MM/YYYY (for existing form format)
function isoToDDMMYYYY(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getUTCFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function parseDobToISO(dob: string) {
  const m = dob.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;

  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);

  const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (Number.isNaN(dt.getTime())) return null;

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

function bytesToMB(bytes: number) {
  return bytes / (1024 * 1024);
}

export default function ApplyPage() {
  // ✅ CHANGE (CourseDig): load user identity for auto-fill + lock
  const { user: me, loading: meLoading } = useMe();

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

  // ✅ CHANGE (CourseDig): prevent auto-fill from overwriting user edits
  const [didAutofill, setDidAutofill] = useState(false);

  // ✅ CHANGE (CourseDig): identity lock (do not allow editing if profile is locked + values exist)
  const identityLocked = useMemo(() => {
    if (!me) return false;

    const hasCore =
      !!me.firstName &&
      !!me.lastName &&
      !!me.phoneNumber &&
      !!me.dateOfBirth &&
      !!me.email;

    return hasCore && !!me.profileLockedAt;
  }, [me]);

  // ✅ CHANGE (CourseDig): auto-fill from profile once (only if fields are empty)
  useEffect(() => {
    if (!me) return;
    if (didAutofill) return;

    if (!firstName && me.firstName) setFirstName(me.firstName);
    if (!lastName && me.lastName) setLastName(me.lastName);
    if (!phone && me.phoneNumber) setPhone(me.phoneNumber);
    if (!email && me.email) setEmail(me.email);

    if (!dob && me.dateOfBirth) {
      const formatted = isoToDDMMYYYY(me.dateOfBirth);
      if (formatted) setDob(formatted);
    }
    // countryOfResidence is not in profile yet, so do not auto-fill.

    setDidAutofill(true);
  }, [me, didAutofill, firstName, lastName, phone, email, dob]);

  // Attachments
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appRef, setAppRef] = useState<string | null>(null);

  const totalBytes = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);
  const totalMB = useMemo(() => bytesToMB(totalBytes).toFixed(2), [totalBytes]);

  const dobIso = useMemo(() => parseDobToISO(dob), [dob]);

  const needsOtherCourse =
    courseName.trim().toUpperCase() === "OTHER" ||
    courseName.trim().toUpperCase() === "OTHERS";

  // Inline validation states
  const emailInvalid = email.trim().length > 0 && !isEmailLike(email);
  const dobInvalid = dob.trim().length > 0 && dobIso === null;

  const psLen = personalStatement.length;
  const psTooShort = psLen > 0 && psLen < PS_MIN;
  const psTooLong = psLen > PS_MAX;
  const psRemaining = Math.max(0, PS_MAX - psLen);

  const formValid =
    courseName.trim().length > 0 &&
    (!needsOtherCourse || otherCourseName.trim().length >= 5) &&
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    dobIso !== null &&
    isEmailLike(email) &&
    phone.trim().length > 0 &&
    countryOfResidence.trim().length > 0 &&
    psLen >= PS_MIN &&
    psLen <= PS_MAX;

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;

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

    // Reset input value so selecting the same file again triggers onChange
    e.target.value = "";
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function clearAllFiles() {
    setFiles([]);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAppRef(null);

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
      // 1) presign + upload (only if files exist)
      let uploads: PresignedUpload[] = [];
      if (files.length > 0) {
        uploads = await presignBatch(files);
        await uploadToS3(uploads, files);
      }

      // 2) submit application
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
      if (!submitRes.ok) {
        throw new Error(json.message || "Application submit failed.");
      }

      setAppRef(json.appRef);
      // Clear form after success
      setFiles([]);
      setPersonalStatement("");
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ✅ When submitted, hide the form completely
  if (appRef) {
    return (
      <main className="bg-white">
        <section className="border-b bg-[color:var(--color-brand-soft)]">
          <div className="mx-auto max-w-3xl px-6 py-12">
            <h1 className="text-3xl font-bold text-gray-900">Application submitted</h1>
            <p className="mt-2 text-sm text-gray-700">
              Thanks — we’ve received your application and will contact you by email.
            </p>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-3xl px-6 py-10">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <p className="font-semibold text-gray-900">Your reference</p>
              <p className="mt-1 text-sm text-gray-700">
                <span className="font-mono font-semibold">{appRef}</span>
              </p>
              <p className="mt-3 text-sm text-gray-600">
                If you need to update anything, please quote the reference.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95"
                >
                  Back to home →
                </Link>
                <Link
                  href="/enquiry"
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
                >
                  Send an enquiry
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
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

          {/* ✅ CHANGE (CourseDig): show info when identity is locked */}
          {me && !meLoading && identityLocked ? (
            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
              Your personal details are sourced from your profile and cannot be edited here. Please request a change via your Profile so Support can update your record..
            </div>
          ) : null}

          <div className="mt-5 rounded-2xl border border-red-100 bg-white/70 p-5">
            <p className="text-sm font-semibold text-gray-900">
              You’re almost there, take the next step.
            </p>
            <p className="mt-1 text-sm text-gray-700">
              Submitting your application helps us match you to the right pathway and guide you
              through enrolment with clear next steps.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
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
                <label className="block text-sm font-semibold text-gray-900">First name *</label>
                <input
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  // ✅ CHANGE (CourseDig): lock identity fields when profileLockedAt is set
                  disabled={identityLocked}
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
                  autoComplete="family-name"
                  // ✅ CHANGE (CourseDig)
                  disabled={identityLocked}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900">
                  Date of birth (DD/MM/YYYY) *
                </label>
                <input
                  className={`mt-2 w-full rounded-md border bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 ${
                    dobInvalid
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-300 focus:border-[color:var(--color-brand)] focus:ring-[color:var(--color-brand-soft)]"
                  }`}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder="e.g. 06/05/2009"
                  inputMode="numeric"
                  // ✅ CHANGE (CourseDig)
                  disabled={identityLocked}
                />
                {dobInvalid && (
                  <p className="mt-1 text-xs text-red-600">Use DD/MM/YYYY (e.g. 06/05/2009)</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900">Email *</label>
                <input
                  className={`mt-2 w-full rounded-md border bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 ${
                    emailInvalid
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-300 focus:border-[color:var(--color-brand)] focus:ring-[color:var(--color-brand-soft)]"
                  }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  inputMode="email"
                  autoComplete="email"
                  // ✅ CHANGE (CourseDig)
                  disabled={identityLocked}
                />
                {emailInvalid && (
                  <p className="mt-1 text-xs text-red-600">Please enter a valid email address.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900">Phone number *</label>
                <input
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +44..."
                  autoComplete="tel"
                  // ✅ CHANGE (CourseDig)
                  disabled={identityLocked}
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
                  autoComplete="country-name"
                />
              </div>
            </div>

            {/* Personal statement */}
            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Personal statement (in support of your application) *
              </label>
              <p className="mt-1 text-xs text-gray-600">
                Minimum {PS_MIN} characters • Maximum {PS_MAX} characters
              </p>

              <textarea
                className={`mt-2 w-full rounded-md border bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 ${
                  psTooShort || psTooLong
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-300 focus:border-[color:var(--color-brand)] focus:ring-[color:var(--color-brand-soft)]"
                }`}
                rows={7}
                value={personalStatement}
                onChange={(e) => {
                  const nextVal = e.target.value;
                  if (nextVal.length <= PS_MAX) setPersonalStatement(nextVal);
                }}
                placeholder="Tell us why you’re applying and what you hope to achieve."
                maxLength={PS_MAX}
              />

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className={psTooShort ? "text-red-600" : "text-gray-600"}>
                  {psLen}/{PS_MIN} minimum
                </span>
                <span className={psRemaining === 0 ? "text-red-600 font-semibold" : "text-gray-600"}>
                  {psRemaining} characters remaining
                </span>
              </div>

              {psTooShort && (
                <p className="mt-1 text-xs text-red-600">
                  Please write at least {PS_MIN} characters.
                </p>
              )}
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Attachments (optional)
              </label>
              <p className="text-sm text-gray-600">
                PDF/images only • max {MAX_FILES} files • max 10MB per file • max 100MB total
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50">
                  Choose files
                  <input
                    type="file"
                    multiple
                    accept=".pdf,image/*"
                    onChange={onFilesChange}
                    className="hidden"
                  />
                </label>

                <div className="text-sm text-gray-700">
                  {files.length === 0 ? (
                    <span className="text-gray-500">No files selected</span>
                  ) : (
                    <span>
                      {files.length}/{MAX_FILES} selected • Total: {totalMB} MB
                    </span>
                  )}
                </div>

                {files.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFiles}
                    className="text-sm font-semibold text-red-700 hover:underline"
                  >
                    Remove all
                  </button>
                )}
              </div>

              {files.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {files.map((f, idx) => (
                    <li
                      key={`${f.name}-${idx}`}
                      className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{f.name}</p>
                        <p className="text-xs text-gray-600">
                          {(f.size / (1024 * 1024)).toFixed(2)} MB • {f.type || "file"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={!formValid || isSubmitting}
              className={`w-full rounded-md px-6 py-3 text-sm font-semibold text-white ${
                !formValid || isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[color:var(--color-brand)] hover:bg-[color:var(--color-brand-dark)]"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit application"}
            </button>

            <p className="text-xs font-semibold text-red-700">
              By submitting this form, you confirm the information is accurate.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
