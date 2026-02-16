// src/lib/turnstile.ts

type TurnstileResult =
  | { ok: true }
  | { ok: false; message: string; codes?: string[] };

function firstIp(ipHeader?: string | null) {
  if (!ipHeader) return null;
  return ipHeader.split(",")[0]?.trim() || null;
}

function looksLikeIp(v: string) {
  return /^[0-9a-fA-F:.]+$/.test(v);
}

function normaliseHost(host: string) {
  return host.trim().toLowerCase().replace(/^www\./, "");
}

function parseAllowedHostnames() {
  const raw = (process.env.TURNSTILE_ALLOWED_HOSTNAMES || "").trim();
  if (!raw) return null;

  const list = raw
    .split(",")
    .map((s) => normaliseHost(s))
    .filter(Boolean);

  return list.length ? list : null;
}

function messageFromCodes(codes: string[]) {
  if (codes.includes("missing-input-response")) return "Verification is required.";
  if (codes.includes("invalid-input-response")) return "Verification failed. Please try again.";
  if (codes.includes("timeout-or-duplicate")) return "Verification expired. Please try again.";
  if (codes.includes("bad-request")) return "Verification could not be completed. Please try again.";

  if (codes.includes("missing-input-secret")) return "Verification is not configured.";
  if (codes.includes("invalid-input-secret")) return "Verification is not configured.";
  if (codes.includes("invalid-domain"))
    return "Verification domain is not allowed.";

  return "Verification failed. Please try again.";
}

export async function verifyTurnstile(
  token: string | null,
  ip?: string | null
): Promise<TurnstileResult> {
  const secret = (process.env.TURNSTILE_SECRET_KEY || "").trim();
  const isProd = process.env.NODE_ENV === "production";

  // If not configured: bypass in non-prod; fail in prod (but with neutral wording)
  if (!secret) {
    if (isProd) {
      return {
        ok: false,
        message: "Verification is not configured. Please try again later.",
        codes: ["missing-input-secret"],
      };
    }
    return { ok: true };
  }

  const cleanToken = (token || "").trim();
  if (!cleanToken) {
    return { ok: false, message: "Verification is required.", codes: ["missing-input-response"] };
  }

  const form = new FormData();
  form.append("secret", secret);
  form.append("response", cleanToken);

  const cleanIp = firstIp(ip);
  if (cleanIp && looksLikeIp(cleanIp)) {
    form.append("remoteip", cleanIp);
  }

  let data: any = null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      signal: controller.signal,
    });

    data = await res.json().catch(() => null);
  } catch {
    return {
      ok: false,
      message: "Verification could not be completed. Please try again.",
      codes: ["network_error"],
    };
  } finally {
    clearTimeout(timeout);
  }

  if (!data?.success) {
    const codes: string[] = Array.isArray(data?.["error-codes"]) ? data["error-codes"] : [];
    return { ok: false, message: messageFromCodes(codes), codes };
  }

  const allowed = parseAllowedHostnames();
  const hostname = typeof data?.hostname === "string" ? normaliseHost(data.hostname) : null;

  if (allowed && hostname && !allowed.includes(hostname)) {
    return {
      ok: false,
      message: "Verification domain is not allowed.",
      codes: ["invalid-domain"],
    };
  }

  return { ok: true };
}
