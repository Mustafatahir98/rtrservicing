import localFont from "next/font/local";

export const googleSansFlex = localFont({
  src: "../public/fonts/google-sans-flex-latin-variable.woff2",
  weight: "1 1000",
  style: "normal",
  display: "swap",
  variable: "--font-google-sans-flex",
  adjustFontFallback: false,
});
