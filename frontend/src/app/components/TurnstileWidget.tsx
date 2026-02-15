//frontend/src/app/components/TurnstileWidget.tsx
"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

  // Track whether the Turnstile script has loaded
  const [scriptReady, setScriptReady] = useState(false);

  const siteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();

  // Stable options object
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

  const removeWidget = useCallback(() => {
    if (!window.turnstile) return;
    if (!widgetIdRef.current) return;

    try {
      window.turnstile.remove(widgetIdRef.current);
    } catch {
      // ignore
    } finally {
      widgetIdRef.current = null;
    }
  }, []);

  const renderWidget = useCallback(() => {
    if (!ref.current) return;
    if (!siteKey) return;
    if (!window.turnstile) return;

    // If a widget exists, remove first (prevents duplicates)
    if (widgetIdRef.current) {
      removeWidget();
    }

    try {
      widgetIdRef.current = window.turnstile.render(ref.current, opts);
    } catch {
      // ignore
    }
  }, [opts, removeWidget, siteKey]);

  // Render when script is ready
  useEffect(() => {
    if (!scriptReady) return;
    renderWidget();

    return () => {
      removeWidget();
    };
  }, [scriptReady, renderWidget, removeWidget]);

  // Reset when resetSignal changes
  useEffect(() => {
    if (resetSignal == null) return;

    // Always clear token in parent
    onToken("");

    // If script not ready yet, do nothing (it will render when ready)
    if (!scriptReady) return;

    // Hard reset (remove + render) is more reliable than reset()
    renderWidget();
  }, [resetSignal, onToken, scriptReady, renderWidget]);

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
        onLoad={() => setScriptReady(true)}
      />
      <div
        ref={ref}
        // helps avoid “invisible” widget area on some layouts
        style={{ minHeight: 72 }}
      />
    </>
  );
}
