// src/lib/turnstile.ts

type TurnstileResult =
  | { ok: true }
  | { ok: false; message: string; codes?: string[] };

function firstIp(ipHeader?: string | null) {
  if (!ipHeader) return null;
  // x-forwarded-for can be "client, proxy1, proxy2"
  return ipHeader.split(",")[0]?.trim() || null;
}

function looksLikeIp(v: string) {
  // simple check for IPv4 / IPv6-ish strings
  return /^[0-9a-fA-F:.]+$/.test(v);
}

function normaliseHost(host: string) {
  return host.trim().toLowerCase().replace(/^www\./, "");
}

function parseAllowedHostnames() {
  // Optional: set this to tighten hostname checks
  // e.g. TURNSTILE_ALLOWED_HOSTNAMES=coursedig.com,www.coursedig.com
  const raw = (process.env.TURNSTILE_ALLOWED_HOSTNAMES || "").trim();
  if (!raw) return null;

  const list = raw
    .split(",")
    .map((s) => normaliseHost(s))
    .filter(Boolean);

  return list.length ? list : null;
}

function messageFromCodes(codes: string[]) {
  // Cloudflare Turnstile error codes (common)
  if (codes.includes("missing-input-response")) return "Captcha is required.";
  if (codes.includes("invalid-input-response")) return "Captcha verification failed. Please try again.";
  if (codes.includes("timeout-or-duplicate")) return "Captcha expired. Please try again.";
  if (codes.includes("bad-request")) return "Captcha verification could not be completed. Please try again.";

  // Misconfig
  if (codes.includes("missing-input-secret")) return "Captcha is misconfigured (missing secret key).";
  if (codes.includes("invalid-input-secret")) return "Captcha is misconfigured (invalid secret key).";
  if (codes.includes("invalid-domain"))
    return "Captcha domain is not allowed. Add this domain in Cloudflare Turnstile settings.";

  return "Captcha verification failed. Please try again.";
}

export async function verifyTurnstile(
  token: string | null,
  ip?: string | null
): Promise<TurnstileResult> {
  const secret = (process.env.TURNSTILE_SECRET_KEY || "").trim();
  const isProd = process.env.NODE_ENV === "production";

  /**
   * ✅ Behaviour:
   * - In DEV: if secret is missing, bypass (convenience).
   * - In PROD: if secret is missing, DO NOT bypass (fail loudly).
   */
  if (!secret) {
    if (isProd) {
      return {
        ok: false,
        message: "Captcha is not configured. Please try again later.",
        codes: ["missing-input-secret"],
      };
    }
    return { ok: true };
  }

  const cleanToken = (token || "").trim();
  if (!cleanToken) {
    return { ok: false, message: "Captcha is required.", codes: ["missing-input-response"] };
  }

  const form = new FormData();
  form.append("secret", secret);
  form.append("response", cleanToken);

  const cleanIp = firstIp(ip);
  if (cleanIp && looksLikeIp(cleanIp)) {
    form.append("remoteip", cleanIp);
  }

  let data: any = null;

  // Small timeout so your API doesn’t hang if CF has a hiccup
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      signal: controller.signal,
    });

    data = await res.json().catch(() => null);
  } catch (err) {
    return {
      ok: false,
      message: "Captcha verification could not be completed. Please try again.",
      codes: ["network_error"],
    };
  } finally {
    clearTimeout(timeout);
  }

  if (!data?.success) {
    const codes: string[] = Array.isArray(data?.["error-codes"]) ? data["error-codes"] : [];
    return { ok: false, message: messageFromCodes(codes), codes };
  }

  /**
   * Optional hardening: verify hostname
   * Turnstile includes `hostname` on success.
   */
  const allowed = parseAllowedHostnames();
  const hostname = typeof data?.hostname === "string" ? normaliseHost(data.hostname) : null;

  if (allowed && hostname && !allowed.includes(hostname)) {
    return {
      ok: false,
      message:
        "Captcha domain is not allowed. Add this domain in Cloudflare Turnstile settings.",
      codes: ["invalid-domain"],
    };
  }

  return { ok: true };
}
