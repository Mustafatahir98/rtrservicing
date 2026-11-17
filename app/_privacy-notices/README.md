# Affiliate and Non-Affiliate Privacy Notices

Routes: `/privacy-notice-affiliate` and `/privacy-notice-non-affiliate`.

Both routes share this private component/style folder. Content JSON was imported
from the supplied `privacy-notice-affiliate.html` and
`privacy-notice-non-affiliate.html` without changing the legal wording or sharing
choices. Only supported text, paragraph, list, emphasis, line break and link nodes
are retained; source scripts and styles are not used.

Facts use semantic definition lists. The sharing matrix uses a caption, column
and row headers, and a keyboard-focusable horizontal scroll region on mobile.
The original PDFs, including the Affiliate mail-in form, remain linked locally.
No new forms, consent tracking, account behavior or backend services are added.

Include these folders, both route folders, the new hero image, the footer/widget
changes, updated Privacy Policy links and the browser test in the feature PR.
The image source is recorded in `public/legal/IMAGE-SOURCES.md`.

Run `node tests/privacy-notices.browser.mjs` with the app running. It verifies
both notices at four viewport widths, complete source content, distinct sharing
choices, PDFs, footer links, keyboard scrolling and axe WCAG A/AA checks.
