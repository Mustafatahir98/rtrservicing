# Privacy Policy — ticket #15

Public route: `/privacy-policy`. The old `/legal/privacy` URL redirects here.

The page uses the supplied November 2026 text, the shared brand font, header and
footer, and the same visual design as Terms of Use. Its component, content and
scoped stylesheet are contained in this folder for a focused feature commit.

## Integration files

- `app/privacy-policy/`
- `public/legal/privacy-policy-laptop-workspace.webp` and `public/legal/IMAGE-SOURCES.md`
- `public/legal/privacy-notices/` — the two supplied privacy notice PDFs
- `.gitignore` — two specific exceptions for these public PDFs
- `.gitattributes` — preserve the PDF assets as binary files
- `app/legal/[document]/page.tsx` — legacy redirect
- `components/site-footer.tsx` — public privacy link
- `components/accessibility-widget.tsx` — enable the existing widget on this route
- `app/terms-of-use/page.tsx` — direct Privacy Policy link
- `tests/privacy-policy.browser.mjs`

Requires the existing Terms of Use branding setup (`app/fonts.ts`, the inline
font theme in `app/globals.css`, and `public/fonts/`). No dependencies, backend
changes or environment variables are added. Keep unrelated changes out of the
feature commit. Suggested branch: `feat/15-public-legal-pages`.

Privacy notices are the supplied RTRS-PrivacyNoticeAffiliate.pdf and
RTRS-PrivacyNoticeNonAffiliate.pdf, copied without modification. They are served
locally. The new hero photo's source and credit are in `public/legal/IMAGE-SOURCES.md`.

## Verification

With the local app running, run `node tests/privacy-policy.browser.mjs`.
`TEST_BASE_URL` can select another server. The test checks supplied wording,
all section links, the CCPA link, PDF delivery, legacy redirect, keyboard access,
mobile overflow and axe WCAG A/AA checks at four screen widths. Screenshots are
written into the ignored `.private-review/privacy-policy/` folder.
