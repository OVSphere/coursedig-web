// frontend/src/app/components/TurnstileWidget.tsx
"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: any) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

type Props = {
  onToken: (token: string) => void;
  theme?: "light" | "dark" | "auto";
};

export default function TurnstileWidget({ onToken, theme = "light" }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!ref.current || !siteKey) return;

    let cancelled = false;
    let attempts = 0;

    const renderOnce = () => {
      if (cancelled) return;
      if (!window.turnstile || !ref.current) return false;

      // If already rendered, do nothing (prevents re-render loops / vibration)
      if (widgetIdRef.current) return true;

      try {
        widgetIdRef.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          theme,

          // ✅ Force user interaction (stops “auto success” feel on mobile)
          appearance: "interaction-only",

          // ✅ Don't auto-execute repeatedly
          execution: "render",

          callback: (token: string) => onToken(token),
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        });

        return true;
      } catch {
        return false;
      }
    };

    // Try immediately
    if (renderOnce()) return;

    // Then retry a few times until the script is ready
    const t = setInterval(() => {
      attempts += 1;
      const ok = renderOnce();
      if (ok || attempts >= 50) {
        clearInterval(t);
      }
    }, 100);

    return () => {
      cancelled = true;
      clearInterval(t);

      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [onToken, theme, siteKey]);

  if (!siteKey) {
    return (
      <p className="text-xs text-gray-500">
        CAPTCHA not configured (missing NEXT_PUBLIC_TURNSTILE_SITE_KEY).
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div ref={ref} />
    </>
  );
}
