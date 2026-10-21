"use client";

import { useSyncExternalStore } from "react";

const phoneQuery = "(max-width: 640px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(phoneQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/* Renders exactly one lazy map frame for the current layout (never both), so only one map is downloaded. */
export default function HqMap({ wideSrc, narrowSrc, title }: { wideSrc: string; narrowSrc: string; title: string }) {
  const isPhone = useSyncExternalStore(subscribe, () => window.matchMedia(phoneQuery).matches, () => null);
  if (isPhone === null) return <div className="ct-map-frame ct-map-placeholder" aria-hidden="true" />;
  return <iframe key={isPhone ? "narrow" : "wide"} className="ct-map-frame" title={title} src={isPhone ? narrowSrc : wideSrc} loading="lazy" />;
}
