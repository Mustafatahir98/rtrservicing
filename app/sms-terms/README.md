# SMS Terms of Service — ticket #15

Public route: `/sms-terms`.

This folder contains the SMS page, its scoped stylesheet and the exact supplied
November 2026 text. Navigation headings are added for readability. STOP and HELP
are emphasized; email, phone and Privacy Policy references are linked.

## Integration files

- `app/sms-terms/`
- `public/legal/sms-terms-smartphone-messaging.webp` and `public/legal/IMAGE-SOURCES.md`
- `components/site-footer.tsx` — SMS Terms link
- `components/accessibility-widget.tsx` — include this public route
- `app/terms-of-use/page.tsx` — link its SMS Terms reference
- `tests/sms-terms.browser.mjs`

Uses the existing shared header, footer, local brand font and `/privacy-policy`
page. No dependencies, environment settings, backend changes or opt-in forms are
added. Keep unrelated changes out of the feature commit. Suggested branch:
`feat/15-public-legal-pages`.

The new hero photograph is downloaded from Pexels, optimized and served locally.
Source and photographer credit are in `public/legal/IMAGE-SOURCES.md`.

## Verify

With the app running, run `node tests/sms-terms.browser.mjs`. Set `TEST_BASE_URL`
for another server. Checks include supplied wording, STOP/HELP emphasis, links,
keyboard access, mobile reflow and automated axe WCAG A/AA scans at four widths.
Screenshots go into the ignored `.private-review/sms-terms/` folder.
