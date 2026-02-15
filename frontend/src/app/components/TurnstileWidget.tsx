//frontend/src/app/components/TurnstileWidget.tsx
"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef } from "react";

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

  /**
   * When this number changes, the widget will reset.
   * Useful after submit or when user edits fields.
   */
  resetSignal?: number;

  /**
   * Turnstile behaviour:
   * - "interaction-only" helps avoid showing success too early.
   * - "always" always shows widget prompt.
   */
  appearance?: "always" | "interaction-only";

  /**
   * Optional: helps Turnstile score intent per form.
   */
  action?: string;
};

export default function TurnstileWidget({
  onToken,
  theme = "light",
  resetSignal,
  appearance = "interaction-only",
  action,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";

  // stable options object (avoids re-render loops)
  const opts = useMemo(
    () => ({
      sitekey: siteKey,
      theme,
      appearance,
      action,
      callback: (token: string) => onToken(token),
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    }),
    [siteKey, theme, appearance, action, onToken]
  );

  useEffect(() => {
    if (!ref.current) return;
    if (!siteKey) return;

    const tryRender = () => {
      if (!window.turnstile || !ref.current) return;

      // remove any previous widget instance
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }

      try {
        widgetIdRef.current = window.turnstile.render(ref.current, opts);
      } catch {
        // ignore
      }
    };

    // Render as soon as turnstile script is available
    const t = setInterval(() => {
      tryRender();
      if (window.turnstile && widgetIdRef.current) clearInterval(t);
    }, 150);

    return () => {
      clearInterval(t);
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }
    };
  }, [siteKey, opts]);

  // Reset when resetSignal changes
  useEffect(() => {
    if (!window.turnstile) return;
    if (!widgetIdRef.current) return;
    if (resetSignal == null) return;

    try {
      window.turnstile.reset(widgetIdRef.current);
    } catch {}

    // also clear token in parent
    onToken("");
  }, [resetSignal, onToken]);

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
