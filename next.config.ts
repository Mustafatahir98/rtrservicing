import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// No nonces: the portal has no third-party scripts, frames or API origins.
// Revisit connect-src/frame-src when Servicing Captain or Repay are called from the browser.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Browsers ignore HSTS over plain-http localhost; it applies on the HTTPS demo and production.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/home", destination: "/", permanent: false }];
  },
  images: {
    qualities: [75, 90],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // Exact peer-testing hosts only; use the same origins as the auth allowlist.
  allowedDevOrigins: (process.env.PORTAL_ALLOWED_ORIGINS ?? "").split(",").map(value => value.trim()).filter(Boolean).map(value => {
    const origin = new URL(value);
    if (origin.protocol !== "https:" || value !== origin.origin || origin.hostname.includes("*")) {
      throw new Error("PORTAL_ALLOWED_ORIGINS must contain exact HTTPS origins without wildcards or paths.");
    }
    return origin.hostname;
  }),
};

export default nextConfig;
