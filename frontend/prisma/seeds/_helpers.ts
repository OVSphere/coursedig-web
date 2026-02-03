// prisma/seeds/_helpers.ts
import fs from "fs";
import path from "path";

type Wrapped<T> = { courses?: T[] };

export function readJsonArray<T = any>(relativePathFromPrisma: string): T[] {
  const fullPath = path.join(process.cwd(), "prisma", relativePathFromPrisma);
  const raw = fs.readFileSync(fullPath, "utf8").trim();

  if (!raw) return []; // empty file => empty list

  const parsed = JSON.parse(raw);

  // ✅ Allow either:
  // 1) [ ... ]
  // 2) { "courses": [ ... ] }
  if (Array.isArray(parsed)) return parsed as T[];

  const wrapped = parsed as Wrapped<T>;
  if (wrapped && Array.isArray(wrapped.courses)) return wrapped.courses;

  throw new Error(
    `${relativePathFromPrisma} must be a JSON array OR an object like { "courses": [...] }`
  );
}
