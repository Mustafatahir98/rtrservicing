"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Accessibility } from "@t-2/accessibility";

// Served on both the public site and the authenticated borrower portal. The
// widget is a bundled dependency with no network access of its own: the only
// outbound URL it ships is the default dyslexia font on a public CDN, which is
// disabled below so no borrower page ever calls a third party.
const PUBLIC_PATHS = ["/", "/contact", "/help-center", "/terms-of-use", "/privacy-policy", "/sms-terms", "/privacy-notice-affiliate", "/privacy-notice-non-affiliate"];

export default function AccessibilityWidget() {
  const pathname = usePathname();
  const publicPage = PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/legal/");
  const portalPage = pathname.startsWith("/dashboard");
  const enabled = publicPage || portalPage;
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const widgetInstance = useRef<Accessibility | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let widget: Accessibility | undefined;
    void import("@t-2/accessibility").then(({ Accessibility }) => {
      if (!active || !panel.current) return;
      widget = new Accessibility({
        container: panel.current,
        // One key for both surfaces: a display preference chosen on the public
        // site stays in effect after the borrower signs in. Display settings
        // only; no account data is written to storage.
        storageKey: "rtr-public-accessibility",
        // Never fetch the font from a CDN. Keeps authenticated pages free of
        // third-party requests.
        dyslexiaFontUrl: null,
        features: {
          presets: false,
          grayscale: false,
          highContrast: true,
          lowSaturation: true,
          invert: false,
          fontScale: false,
          lineHeight: true,
          letterSpacing: true,
          textAlign: false,
          hideImages: false,
          bigCursor: false,
          readingGuide: true,
        },
        labels: { title: "Accessibility options" },
        theme: {
          "--a11yw-accent": "#00649e",
          "--a11yw-accent-strong": "#004f7d",
          "--a11yw-accent-soft": "#e3f0f9",
        },
      });
      widgetInstance.current = widget;
      setStatus("ready");
    }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; widget?.destroy(); widgetInstance.current = null; setOpen(false); };
  }, [enabled]);

  // Close the panel when moving between routes, so an open panel never carries
  // over to a new screen (the trigger also sits in a different place on the
  // portal). Adjusted during render rather than in an effect.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setOpen(false);
  }

  if (!enabled) return null;

  function closePanel() {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  }

  return <div
    className="accessibility-widget"
    // The portal has a fixed bottom navigation bar on small screens; this marks
    // the surface so the trigger can be lifted clear of it.
    data-surface={portalPage ? "portal" : "public"}
    onKeyDown={event => { if (event.key === "Escape" && open) closePanel(); }}
  >
    <button
      ref={trigger}
      type="button"
      className="accessibility-widget-trigger"
      aria-label="Accessibility options"
      aria-expanded={open}
      aria-controls="accessibility-widget-panel"
      disabled={status === "loading"}
      onClick={() => { if (widgetInstance.current) setOpen(value => !value); }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4" r="2" /><path d="M4 8h16M12 8v12m0-7-5 8m5-8 5 8" /></svg>
      <span>Accessibility</span>
    </button>
    <section
      id="accessibility-widget-panel"
      className="accessibility-widget-panel"
      aria-label="Accessibility settings"
      hidden={!open}
    >
      <button type="button" className="accessibility-widget-close" aria-label="Close accessibility settings" onClick={closePanel}>&times;</button>
      {status === "error" ? <p role="alert">Accessibility controls could not load. Please try reloading this page.</p> : null}
      <div ref={panel} />
    </section>
  </div>;
}
