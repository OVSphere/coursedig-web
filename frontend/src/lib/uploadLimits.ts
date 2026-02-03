// src/lib/uploadLimits.ts

/**
 * Safely read numeric env vars with fallback
 */
export function numEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Upload limits (configured via .env)
 *
 * Spec:
 * - MAX_FILES: 10
 * - MAX_PER_FILE_MB: 10
 * - MAX_TOTAL_MB: 100 (10 × 10MB)
 */
export const UPLOAD_LIMITS = {
  MAX_FILES: numEnv("APP_MAX_FILES", 10),
  MAX_TOTAL_MB: numEnv("APP_MAX_TOTAL_MB", 100),
  MAX_PER_FILE_MB: numEnv("APP_MAX_PER_FILE_MB", 10),
};

/**
 * Derived byte limits (used by API + presign routes)
 */
export const UPLOAD_LIMIT_BYTES = {
  MAX_TOTAL_BYTES: UPLOAD_LIMITS.MAX_TOTAL_MB * 1024 * 1024,
  MAX_PER_FILE_BYTES: UPLOAD_LIMITS.MAX_PER_FILE_MB * 1024 * 1024,
};
