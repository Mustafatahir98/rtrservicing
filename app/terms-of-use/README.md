# Terms of Use — ticket #15

Route: `/terms-of-use`. Existing `/legal/terms` links redirect here.

This folder contains the page, scoped CSS and the supplied November 2026 text.
It uses the existing site header, footer, font and public-site wrapper. No new
dependencies, API calls, database changes or environment variables are needed.

## Include in the feature PR

- `app/terms-of-use/`
- `app/legal/[document]/page.tsx` — redirect the old Terms page
- `components/site-footer.tsx` — link to the new page
- `tests/terms-of-use.browser.mjs` — wording, links, redirect and responsive checks
- `app/fonts.ts` and `public/fonts/` — self-host the existing Google Sans Flex brand font
- `app/globals.css` — resolve the brand font variable on page wrappers
- `public/legal/terms-of-use-contract-signing.webp` — new web-sourced contract photograph
- `components/accessibility-widget.tsx` — enable the existing widget on this public route

Keep unrelated working-tree changes out of the commit. The patch can be applied
to the developer's integration branch; preserve any newer changes in its shared
header/footer and legal route. Suggested branch: `feat/15-public-legal-pages`.

## Content

`content.json` preserves all 43 paragraphs from the supplied pasted text, in
order. Section headings are added for navigation. Email Markdown is rendered as
an email link; phone numbers and the Privacy Policy reference are linked.
The SMS Terms and Privacy Policy references link to their dedicated public pages.

The supplied text includes both an 18-year minimum and a later 19-year statement
without a state heading. Both are preserved for the content owner to confirm.

The other legal pages and their approval status are unchanged.

## Branding assets

Google Sans Flex is served locally so development and builds do not fall back to
Arial when Google Fonts cannot be reached. The official Latin variable WOFF2
and its OFL license are in `public/fonts/`; the existing font export and CSS
variable names are preserved for all consumers. Source:
https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@1..1000&display=swap
and https://github.com/google/fonts/blob/main/ofl/googlesansflex/OFL.txt.

The hero uses a new photograph sourced from Pexels, not another website page:
"Person Signing a Contract" by Kaboompics, photo ID 5387258.
Source: https://www.pexels.com/photo/person-signing-a-contract-5387258/.
The downloaded photo is optimized to a 1920px WebP in `public/legal/` (about 80 KB).
It is served
through Next Image as a decorative full hero background on desktop, tablet and
mobile. A dark blue overlay protects text contrast. Forced-colors and print
modes remove the decorative image and use readable system/print colors.

## Verify

With the app running locally, run `node tests/terms-of-use.browser.mjs` (Chrome
required). It checks the rendered legal wording, section links, the footer link,
legacy redirect, 404 behavior and horizontal overflow at four viewport widths.
It also confirms that the photograph loads and Chrome renders Google Sans Flex.
The test runs axe WCAG A/AA checks at each width, checks hero contrast against a
worst-case white photo pixel, and exercises the skip link and accessibility
widget with keyboard focus return. Automated checks do not replace a full
assistive-technology review.
Use `TEST_BASE_URL` for a different local server. Screenshots go into the ignored
`.private-review/terms-of-use/` folder.
