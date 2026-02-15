//frontend/src/app/components/TurnstileWidget.tsx
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
  // ✅ NEW: allow parent to force-reset the widget
  resetSignal?: number;
};

export default function TurnstileWidget({
  onToken,
  theme = "light",
  resetSignal = 0,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const tryRender = () => {
    if (!window.turnstile || !ref.current || !siteKey) return;

    // Prevent duplicate renders
    if (widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(ref.current, {
      sitekey: siteKey,
      theme,
      callback: (token: string) => onToken(token),
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });
  };

  useEffect(() => {
    tryRender();

    return () => {
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }
      widgetIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey, theme]);

  // ✅ Reset when parent changes resetSignal
  useEffect(() => {
    if (!window.turnstile || !widgetIdRef.current) return;
    try {
      window.turnstile.reset(widgetIdRef.current);
      onToken("");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

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
        onLoad={tryRender}
      />
      <div ref={ref} />
    </>
  );
}
