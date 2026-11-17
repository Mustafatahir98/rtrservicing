# RTR Servicing — public site and borrower portal

Public pages, legal pages and the complete borrower portal, with a browser-based
MSW mock API. All borrower, account, payment and registration data is synthetic.
There is no admin portal, database, live sign-in provider, real payment execution
or email delivery in this distribution.

## Run locally

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No environment file is required. Mock mode is enabled
by the dev, build and start scripts so the demo sign-in works out of the box.
For a production preview, run `npm run build` followed by `npm start`.

## Demo account

- Email: `demo.borrower@example.com`
- Password: `DemoBorrower123!`
- Verification code: `123456`

These are public synthetic fixtures, not real account credentials. No email or
SMS verification message is sent. Session and mock-data changes are local.

## Included pages

Public home, Contact and Help Center; Terms of Use; Privacy Policy; SMS Terms;
Affiliate and Non-Affiliate Privacy Notices, with their supplied PDFs. The
remaining legal reference pages retain their existing placeholder content.

The borrower portal includes dashboard, account/loan details, payments, AutoPay,
payment history, documents, payoff and cancellation flows. Generated API client,
the API contract and browser mock handlers are included for these features.

Images and the brand font are served locally; source/license records are kept
beside the legal image and font assets.

## Checks

- `npm run test:unit`
- `npm run lint`
- `npm run build`
- With a local preview running: `npm run test:api`, `npm run test:payoff`,
  `node tests/terms-of-use.browser.mjs`, `node tests/privacy-policy.browser.mjs`,
  `node tests/sms-terms.browser.mjs`, `node tests/privacy-notices.browser.mjs`.

Browser checks use locally installed Chrome. `TEST_BASE_URL` can select a local
preview on another port. Reports and screenshots stay in ignored review folders.
