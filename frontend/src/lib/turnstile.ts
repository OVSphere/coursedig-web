// src/lib/turnstile.ts

type TurnstileResult =
  | { ok: true }
  | { ok: false; message: string; codes?: string[] };

function firstIp(ipHeader?: string | null) {
  if (!ipHeader) return null;
  // x-forwarded-for can be "client, proxy1, proxy2"
  return ipHeader.split(",")[0]?.trim() || null;
}

export async function verifyTurnstile(
  token: string | null,
  ip?: string | null
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  /**
   * ✅ Local/dev convenience:
   * - If TURNSTILE_SECRET_KEY is not set, we bypass captcha.
   * - This is handy in local dev, but make sure you DO set it in production.
   */
  if (!secret) {
    return { ok: true };
  }

  if (!token) {
    return { ok: false, message: "Captcha is required." };
  }

  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);

  const cleanIp = firstIp(ip);
  if (cleanIp) form.append("remoteip", cleanIp);

  let data: any = null;

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form }
    );

    data = await res.json().catch(() => null);
  } catch (err) {
    return {
      ok: false,
      message: "Captcha verification could not be completed. Please try again.",
      codes: ["network_error"],
    };
  }

  if (!data?.success) {
    const codes: string[] = Array.isArray(data?.["error-codes"])
      ? data["error-codes"]
      : [];

    // ✅ More helpful messages based on Cloudflare codes
    const message =
      codes.includes("missing-input-response")
        ? "Captcha is required."
        : codes.includes("invalid-input-response")
        ? "Captcha verification failed. Please try again."
        : codes.includes("invalid-input-secret")
        ? "Captcha is misconfigured (invalid secret key)."
        : codes.includes("invalid-domain")
        ? "Captcha domain is not allowed. Add this domain in Cloudflare Turnstile settings."
        : "Captcha verification failed. Please try again.";

    return { ok: false, message, codes };
  }

  return { ok: true };
}
