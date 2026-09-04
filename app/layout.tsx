import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "RTR Servicing | Loan Servicing Made Simple",
  description: "Secure, customer-focused loan servicing for payments, statements, and account details.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script id="remove-extension-hydration-attributes" strategy="beforeInteractive">
          {`(() => {
            const attribute = "bis_skin_checked";
            const clean = (root) => {
              if (root.nodeType !== Node.ELEMENT_NODE) return;
              root.removeAttribute(attribute);
              root.querySelectorAll("[" + attribute + "]").forEach((element) => {
                element.removeAttribute(attribute);
              });
            };

            clean(document.documentElement);

            const observer = new MutationObserver((mutations) => {
              for (const mutation of mutations) {
                if (mutation.type === "attributes") {
                  mutation.target.removeAttribute(attribute);
                } else {
                  mutation.addedNodes.forEach(clean);
                }
              }
            });

            observer.observe(document.documentElement, {
              attributes: true,
              attributeFilter: [attribute],
              childList: true,
              subtree: true,
            });

            window.addEventListener("load", () => {
              window.setTimeout(() => observer.disconnect(), 1000);
            }, { once: true });
          })();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
