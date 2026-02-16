// frontend/src/app/components/TurnstileWidget.tsx
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
  resetSignal?: number;
  appearance?: "always" | "interaction-only";
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

  const [scriptReady, setScriptReady] = useState(false);

  const siteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();

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

    if (widgetIdRef.current) {
      removeWidget();
    }

    try {
      widgetIdRef.current = window.turnstile.render(ref.current, opts);
    } catch {
      // ignore
    }
  }, [opts, removeWidget, siteKey]);

  useEffect(() => {
    if (!scriptReady) return;
    renderWidget();

    return () => {
      removeWidget();
    };
  }, [scriptReady, renderWidget, removeWidget]);

  useEffect(() => {
    if (resetSignal == null) return;

    onToken("");

    if (!scriptReady) return;
    renderWidget();
  }, [resetSignal, onToken, scriptReady, renderWidget]);

  // If not configured, render nothing (silent)
  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div ref={ref} style={{ minHeight: 72 }} />
    </>
  );
}
