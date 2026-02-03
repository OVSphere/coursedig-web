// src/app/scholarships/apply/ScholarshipApplyClient.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";

type UploadMeta = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  key?: string;
  url?: string;
  s3Key?: string;
  uploadUrl?: string;
};

const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const MAX_FILES = 10;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50MB total
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB per file

const MIN_PERSONAL = 50;
const MAX_PERSONAL = 2000;

const COURSE_GROUPS: Array<{ title: string; options: string[] }> = [
  {
    title: "Vocational Training / Professional Certificate Courses",
    options: [
      "Artificial Intelligence Fundamentals",
      "AWS Cloud Fundamentals",
      "Business Analyst (BA)",
      "Cybersecurity Fundamentals",
      "Data Analytics",
      "Healthcare Support Worker (HCSW)",
      "Health & Social Care",
      "IELTS Preparation",
      "Software Testing (Automation)",
      "Software Testing (Manual QA)",
    ],
  },
  {
    title: "Level 3 – University Entry Courses",
    options: [
      "Accountancy",
      "Business Management",
      "Business Studies",
      "Employability and Workplace Skills",
      "Engineering",
      "Health & Social Care",
      "Information Technology",
      "People and Organisations",
    ],
  },
  {
    title: "Level 4 & 5 – University First and Second Year Courses",
    options: [
      "Accounting and Business",
      "Business Management",
      "Cyber Security",
      "Entrepreneurship and Management",
      "Health & Social Care Management",
      "Human Resource Management",
      "IT and Computing",
      "IT and E-commerce",
      "IT and Networking",
      "IT and Web Design",
      "Law",
      "Leadership and Teamwork",
      "Logistics and Supply Chain Management",
      "Psychology",
      "Sales and Marketing",
      "Tourism and Hospitality Management",
    ],
  },
  {
    title: "Level 7 Diploma – Masters / LLM / MBA Advanced Entry",
    options: [
      "Human Resource Management",
      "International Business Law leading to LLM",
      "Organisational Psychology and Business",
      "Project Management",
      "Strategic Management and Leadership",
      "Strategic Sales Management",
    ],
  },
];

function parseDobDDMMYYYY(dob: string) {
  const m = dob.trim().match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (!m) return null;

  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);

  const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (Number.isNaN(dt.getTime())) return null;

  // prevent rollover
  if (dt.getUTCFullYear() !== yyyy || dt.getUTCMonth() !== mm - 1 || dt.getUTCDate() !== dd)
    return null;

  return { dob: `${m[1]}/${m[2]}/${m[3]}`, ddmmyyyy: `${m[1]}${m[2]}${m[3]}` };
}

function isEmailLike(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function ScholarshipApplyClient() {
  // course
  const [courseSelected, setCourseSelected] = useState("");
  const [otherCourseName, setOtherCourseName] = useState("");

  // applicant
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dobInput, setDobInput] = useState(""); // DD/MM/YYYY
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState("");

  // statement
  const [personalStmt, setPersonalStmt] = useState("");

  // attachments
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ui
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appRef, setAppRef] = useState<string | null>(null);

  const totalBytes = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

  const dobParsed = useMemo(() => parseDobDDMMYYYY(dobInput), [dobInput]);

  const isOther = courseSelected === "__OTHER__";
  const finalCourseName = (isOther ? otherCourseName : courseSelected).trim();

  const personalLen = personalStmt.length;
  const personalLeft = Math.max(0, MAX_PERSONAL - personalLen);

  const emailTouched = email.trim().length > 0;
  const emailOk = isEmailLike(email);

  const isValid =
    finalCourseName.length >= 2 &&
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    dobParsed !== null &&
    emailOk &&
    phone.trim().length > 0 &&
    countryOfResidence.trim().length > 0 &&
    personalStmt.trim().length >= MIN_PERSONAL &&
    personalStmt.trim().length <= MAX_PERSONAL;

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);

    // Combine, cap by MAX_FILES
    const combined = [...files, ...selected].slice(0, MAX_FILES);

    for (const f of combined) {
      if (!ALLOWED.includes(f.type)) {
        setError("Only PDF, JPG, PNG, and WEBP files are allowed.");
        return;
      }
      if (f.size > MAX_FILE_BYTES) {
        setError("Each file must be 10MB or less.");
        return;
      }
    }

    const bytes = combined.reduce((s, f) => s + f.size, 0);
    if (bytes > MAX_TOTAL_BYTES) {
      setError("Total attachments must be 50MB or less.");
      return;
    }

    setError(null);
    setFiles(combined);

    // allow selecting same file again after remove
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function clearAllFiles() {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAppRef(null);

    if (!isValid) {
      setError("Please complete all required fields correctly.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1) Presign URLs (batch)
      let uploads: UploadMeta[] = [];
      if (files.length) {
        const presignRes = await fetch("/api/applications/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: files.map((f) => ({
              fileName: f.name,
              mimeType: f.type,
              sizeBytes: f.size,
            })),
          }),
        });

        if (presignRes.status === 401) throw new Error("You must be logged in to upload attachments.");

        const presignJson = await presignRes.json().catch(() => ({}));
        if (!presignRes.ok) throw new Error(presignJson.message || "Presign failed");

        uploads = presignJson.uploads ?? [];
        if (!Array.isArray(uploads) || uploads.length !== files.length) {
          throw new Error("Presign response mismatch.");
        }
      }

      // 2) Upload to S3
      if (uploads.length) {
        await Promise.all(
          uploads.map(async (u, idx) => {
            const file = files[idx];
            const putUrl = u.url ?? u.uploadUrl;
            if (!putUrl) throw new Error("Missing upload URL.");

            const put = await fetch(putUrl, {
              method: "PUT",
              headers: { "Content-Type": file.type },
              body: file,
            });

            if (!put.ok) throw new Error(`Upload failed for ${file.name}`);
          })
        );
      }

      // 3) Submit scholarship application
      const submitRes = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationType: "SCHOLARSHIP",
          courseName: finalCourseName,
          otherCourseName: isOther ? otherCourseName.trim() : "",
          firstName,
          lastName,
          dob: dobParsed?.dob, // DD/MM/YYYY
          email,
          phone,
          countryOfResidence,
          personalStatement: personalStmt,
          attachments: uploads.map((u, i) => ({
            s3Key: u.s3Key ?? u.key,
            key: u.key ?? u.s3Key,
            fileName: files[i]?.name ?? u.fileName,
            mimeType: files[i]?.type ?? u.mimeType,
            sizeBytes: files[i]?.size ?? u.sizeBytes,
          })),
        }),
      });

      if (submitRes.status === 401) throw new Error("You must be logged in to submit an application.");

      const json = await submitRes.json().catch(() => ({}));
      if (!submitRes.ok) throw new Error(json.message || "Application failed");

      setAppRef(json.appRef);
      setFiles([]);
      setPersonalStmt("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ✅ after submit, hide the form (as requested)
  if (appRef) {
    return (
      <main className="bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="rounded-3xl border border-green-200 bg-white p-7 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Scholarship application submitted</h1>
            <p className="mt-2 text-sm text-gray-700">Thank you. We’ve received your scholarship application.</p>

            <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
              <p className="font-semibold">Your reference</p>
              <p className="mt-1 font-mono">{appRef}</p>
            </div>

            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <p className="mt-1">
                You can save and return anytime.
                <br />
                If you don’t hear from us within 5 working days, please{" "}
                <Link
                  href="/enquiry"
                  className="font-semibold text-[color:var(--color-brand)] hover:underline"
                >
                  send an enquiry
                </Link>{" "}
                to request an update.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-brand)] px-6 py-3 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
              >
                Back to course application
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[color:var(--color-brand-soft)]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          {/* LEFT: marketing / reassurance */}
          <section className="hidden lg:block">
            <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <h1 className="text-3xl font-bold text-gray-900">Scholarship Application</h1>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                This form is designed to be straightforward. Tell us your goal, the support you need,
                and why this scholarship would help you progress.
              </p>

              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-red-100 bg-[color:var(--color-brand-soft)] p-5">
                  <p className="text-sm font-semibold text-gray-900">You can save and return anytime</p>
                  <p className="mt-2 text-sm text-gray-700">
                    If you need time to write your statement or gather documents, that’s fine. Submit
                    when you’re ready.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-sm font-semibold text-gray-900">What we look for</p>
                  <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    <li>• A clear goal (study or career)</li>
                    <li>• Genuine need for support</li>
                    <li>• Commitment to complete the programme</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-sm font-semibold text-gray-900">Review timeline</p>
                  <p className="mt-2 text-sm text-gray-700">
                    We aim to respond within <span className="font-semibold text-gray-900">5 working days</span>,
                    but it may take longer during peak periods.
                  </p>
                  <p className="mt-2 text-sm text-gray-700">
                    If you don’t hear from us after 5 working days, please{" "}
                    <Link
                      href="/enquiry"
                      className="font-semibold text-[color:var(--color-brand)] hover:underline"
                    >
                      send an enquiry
                    </Link>{" "}
                    to request an update.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: form */}
          <section>
            <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-gray-900">Apply for scholarship</h2>
                <p className="mt-1 text-sm text-gray-600">Complete the form below. Fields marked * are required.</p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* course */}
                <div>
                  <label className="text-sm font-semibold text-gray-900">What course are you applying for? *</label>
                  <select
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                    value={courseSelected}
                    onChange={(e) => setCourseSelected(e.target.value)}
                  >
                    <option value="">Select a course…</option>
                    {COURSE_GROUPS.map((g) => (
                      <optgroup key={g.title} label={g.title}>
                        {g.options.slice().sort().map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <option value="__OTHER__">Other (not listed)</option>
                  </select>

                  {isOther && (
                    <div className="mt-3">
                      <label className="text-sm font-semibold text-gray-900">
                        Please state your course (min 5 characters) *
                      </label>
                      <input
                        className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                        value={otherCourseName}
                        onChange={(e) => setOtherCourseName(e.target.value)}
                        placeholder="Enter course name"
                      />
                      {otherCourseName.trim() !== "" && otherCourseName.trim().length < 5 && (
                        <p className="mt-2 text-xs text-red-600">Minimum 5 characters.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* names */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-gray-900">First name *</label>
                    <input
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                    />
                    {firstName.trim() !== "" && firstName.trim().length < 2 && (
                      <p className="mt-2 text-xs text-red-600">Minimum 2 characters.</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-900">Last name (Surname) *</label>
                    <input
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                    />
                    {lastName.trim() !== "" && lastName.trim().length < 2 && (
                      <p className="mt-2 text-xs text-red-600">Minimum 2 characters.</p>
                    )}
                  </div>
                </div>

                {/* dob + email */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-gray-900">Date of birth (DD/MM/YYYY) *</label>
                    <input
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                      value={dobInput}
                      onChange={(e) => setDobInput(e.target.value)}
                      placeholder="e.g. 06/05/2009"
                      inputMode="numeric"
                    />
                    {!dobParsed && dobInput.trim() !== "" && (
                      <p className="mt-2 text-xs text-red-600">Use DD/MM/YYYY (e.g. 06/05/2009)</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-900">Email *</label>
                    <input
                      className={`mt-2 w-full rounded-md border px-4 py-3 text-sm outline-none focus:ring-2 ${
                        emailTouched && !emailOk
                          ? "border-red-300 bg-red-50 text-gray-900 focus:border-red-400 focus:ring-red-100"
                          : "border-gray-300 bg-white text-gray-900 focus:border-[color:var(--color-brand)] focus:ring-[color:var(--color-brand-soft)]"
                      }`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      inputMode="email"
                      autoComplete="email"
                    />
                    {emailTouched && !emailOk && (
                      <p className="mt-2 text-xs text-red-600">Please enter a valid email.</p>
                    )}
                  </div>
                </div>

                {/* phone + country */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-gray-900">Phone number *</label>
                    <input
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-900">Country of residence *</label>
                    <input
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                      value={countryOfResidence}
                      onChange={(e) => setCountryOfResidence(e.target.value)}
                      placeholder="e.g. United Kingdom"
                      autoComplete="country-name"
                    />
                  </div>
                </div>

                {/* statement */}
                <div>
                  <div className="flex items-end justify-between gap-4">
                    <label className="text-sm font-semibold text-gray-900">
                      Personal statement (in support of your application) *
                    </label>
                    <div className="text-xs text-gray-500">
                      {personalLen}/{MAX_PERSONAL} • {personalLeft} left
                    </div>
                  </div>

                  <textarea
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                    rows={7}
                    value={personalStmt}
                    onChange={(e) => setPersonalStmt(e.target.value.slice(0, MAX_PERSONAL))}
                    maxLength={MAX_PERSONAL}
                    placeholder="Tell us your goal, your situation, and why scholarship support would help you progress."
                  />

                  <div className="mt-2 flex items-center justify-between gap-4">
                    <p className="text-xs text-gray-500">
                      Minimum {MIN_PERSONAL} characters and maximum {MAX_PERSONAL} characters.
                    </p>

                    {personalStmt.trim() !== "" && personalStmt.trim().length < MIN_PERSONAL && (
                      <p className="text-xs text-red-600">
                        {MIN_PERSONAL - personalStmt.trim().length} more characters needed.
                      </p>
                    )}
                  </div>
                </div>

                {/* attachments */}
                <div className="space-y-2">
                  <div className="flex items-end justify-between gap-3">
                    <label className="text-sm font-semibold text-gray-900">Attachments (optional)</label>

                    {files.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllFiles}
                        className="text-xs font-semibold text-[color:var(--color-brand)] hover:underline"
                      >
                        Remove all
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-600">
                    PDF/images only • max {MAX_FILES} files • max 10MB per file • max 50MB total
                  </p>

                  {/* Custom file picker */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label
                      className="inline-flex cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                      htmlFor="scholarship-files"
                    >
                      Choose files
                    </label>

                    <span className="text-sm text-gray-700">
                      {files.length ? `${files.length} file(s) selected` : "No files chosen"}
                    </span>

                    <input
                      ref={fileInputRef}
                      id="scholarship-files"
                      type="file"
                      multiple
                      accept=".pdf,image/*"
                      onChange={onFilesChange}
                      className="hidden"
                    />
                  </div>

                  <div className="text-sm text-gray-600">
                    Files: {files.length}/{MAX_FILES} • Total: {totalMB} MB
                  </div>

                  {files.length > 0 && (
                    <ul className="mt-2 space-y-2">
                      {files.map((f, idx) => (
                        <li
                          key={`${f.name}-${f.size}-${idx}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{f.name}</p>
                            <p className="text-xs text-gray-600">{(f.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Red confirmation text */}
                <p className="text-sm font-semibold text-red-700">
                  By submitting this form, you confirm the information is accurate.
                </p>

                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className={`w-full rounded-md px-6 py-3 text-sm font-semibold text-white ${
                    !isValid || isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[color:var(--color-brand)] hover:bg-[color:var(--color-brand-dark)]"
                  }`}
                >
                  {isSubmitting ? "Submitting…" : "Submit scholarship application"}
                </button>

                {/* Mobile reassurance */}
                <div className="mt-4 rounded-2xl border border-red-100 bg-[color:var(--color-brand-soft)] p-4 lg:hidden">
                  <p className="mt-1 text-sm text-gray-700">
                    If you don’t hear from us after 5 working days, please{" "}
                    <Link
                      href="/enquiry"
                      className="font-semibold text-[color:var(--color-brand)] hover:underline"
                    >
                      send an enquiry
                    </Link>{" "}
                    to request an update.
                  </p>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
