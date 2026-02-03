"use client";

import { useMemo, useState } from "react";

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

// ---- Course list (as agreed) ----
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
  if (dt.getUTCFullYear() !== yyyy || dt.getUTCMonth() !== mm - 1 || dt.getUTCDate() !== dd) return null;

  return { dob: `${m[1]}/${m[2]}/${m[3]}`, ddmmyyyy: `${m[1]}${m[2]}${m[3]}` };
}

export default function ApplyPage() {
  const [courseSelected, setCourseSelected] = useState("");
  const [otherCourseName, setOtherCourseName] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dobInput, setDobInput] = useState(""); // DD/MM/YYYY
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState("");
  const [personalStmt, setPersonalStmt] = useState("");

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appRef, setAppRef] = useState<string | null>(null);

  const totalBytes = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

  const dobParsed = useMemo(() => parseDobDDMMYYYY(dobInput), [dobInput]);

  const isOther = courseSelected === "__OTHER__";
  const finalCourseName = isOther ? otherCourseName.trim() : courseSelected.trim();

  const isValid =
    finalCourseName.length >= 5 &&
    firstName.trim().length >= 5 &&
    lastName.trim().length >= 5 &&
    dobParsed !== null &&
    email.includes("@") &&
    phone.trim().length > 0 &&
    countryOfResidence.trim().length > 0 &&
    personalStmt.trim().length >= 50;

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const combined = [...files, ...selected].slice(0, MAX_FILES);

    for (const f of combined) {
      if (!ALLOWED.includes(f.type)) {
        setError("Only PDF, JPG, PNG, WEBP allowed.");
        return;
      }
      if (f.size > MAX_FILE_BYTES) {
        setError("Each file must be 10MB or less.");
        return;
      }
    }

    const bytes = combined.reduce((s, f) => s + f.size, 0);
    if (bytes > MAX_TOTAL_BYTES) {
      setError("Total attachments must be <= 50MB.");
      return;
    }

    setError(null);
    setFiles(combined);
  }

  function removeFile(idx: number) {
    setFiles(files.filter((_, i) => i !== idx));
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
        if (!Array.isArray(uploads) || uploads.length !== files.length) throw new Error("Presign response mismatch.");
      }

      // 2) Upload to S3
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
          if (!put.ok) throw new Error(`S3 upload failed for ${file.name}`);
        })
      );

      // 3) Submit application (DB + emails)
      const submitRes = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationType: "COURSE",
          courseName: finalCourseName,
          firstName,
          lastName,
          dob: dobParsed?.dob, // DD/MM/YYYY (server strips digits)
          email,
          phone,
          countryOfResidence,
          message: personalStmt,
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
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Course Application Form</h1>

      {appRef && (
        <div className="rounded border border-green-700 bg-green-900/20 p-4 text-green-200">
          <p className="font-semibold">Application submitted</p>
          <p>Your reference: <span className="font-mono">{appRef}</span></p>
        </div>
      )}

      {error && (
        <div className="rounded border border-red-700 bg-red-900/20 p-4 text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Course FIRST */}
        <div>
          <label className="text-sm font-medium">What course are you applying for? *</label>
          <select
            className="w-full border rounded p-2"
            value={courseSelected}
            onChange={(e) => setCourseSelected(e.target.value)}
          >
            <option value="">Select a course…</option>
            {COURSE_GROUPS.map((g) => (
              <optgroup key={g.title} label={g.title}>
                {g.options.slice().sort().map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </optgroup>
            ))}
            <option value="__OTHER__">Other (not listed)</option>
          </select>

          {isOther && (
            <div className="mt-2">
              <label className="text-sm font-medium">Other course name *</label>
              <input
                className="w-full border rounded p-2"
                value={otherCourseName}
                onChange={(e) => setOtherCourseName(e.target.value)}
                placeholder="Enter course name"
              />
              {otherCourseName.trim() !== "" && otherCourseName.trim().length < 5 && (
                <p className="text-xs text-red-400 mt-1">Minimum 5 characters.</p>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">First name *</label>
            <input className="w-full border rounded p-2" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            {firstName.trim() !== "" && firstName.trim().length < 5 && (
              <p className="text-xs text-red-400 mt-1">Minimum 5 characters.</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Last name (Surname) *</label>
            <input className="w-full border rounded p-2" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            {lastName.trim() !== "" && lastName.trim().length < 5 && (
              <p className="text-xs text-red-400 mt-1">Minimum 5 characters.</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Date of birth (DD/MM/YYYY) *</label>
            <input
              className="w-full border rounded p-2"
              value={dobInput}
              onChange={(e) => setDobInput(e.target.value)}
              placeholder="e.g. 06/05/2009"
            />
            {!dobParsed && dobInput.trim() !== "" && (
              <p className="text-xs text-red-400 mt-1">Use DD/MM/YYYY (e.g. 06/05/2009)</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Email *</label>
            <input className="w-full border rounded p-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>

          <div>
            <label className="text-sm font-medium">Phone number *</label>
            <input className="w-full border rounded p-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Country of residence *</label>
            <input className="w-full border rounded p-2" value={countryOfResidence} onChange={(e) => setCountryOfResidence(e.target.value)} placeholder="e.g. United Kingdom" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Personal statement (in support of your application) *</label>
          <textarea className="w-full border rounded p-2" rows={6} value={personalStmt} onChange={(e) => setPersonalStmt(e.target.value)} />
          {personalStmt.trim() !== "" && personalStmt.trim().length < 50 && (
            <p className="text-xs text-red-400 mt-1">Minimum 50 characters.</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Attachments (optional) — PDF/images only, max {MAX_FILES} files, max 10MB per file, max 50MB total
          </label>

          <input type="file" multiple accept=".pdf,image/*" onChange={onFilesChange} />

          <div className="text-sm opacity-80">
            Files: {files.length}/{MAX_FILES} • Total: {totalMB} MB
          </div>

          {files.length > 0 && (
            <ul className="text-sm list-disc pl-5 space-y-1">
              {files.map((f, idx) => (
                <li key={idx} className="flex items-center justify-between gap-3">
                  <span>{f.name} ({(f.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  <button type="button" onClick={() => removeFile(idx)} className="text-xs underline">
                    remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`px-6 py-2 rounded text-white ${!isValid || isSubmitting ? "bg-gray-600" : "bg-black hover:bg-gray-800"}`}
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </main>
  );
}
