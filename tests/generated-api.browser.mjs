import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const base = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Run against the local synthetic preview only');
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [], requests = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) requests.push(new URL(request.url()).pathname); });
async function api(path, { method = 'GET', data, key, anonymous = false } = {}) {
  return page.evaluate(async ({ path, method, data, key, anonymous }) => {
    const headers = { ...(anonymous ? {} : { Authorization: 'Bearer mock-borrower-access-token' }), ...(data === undefined ? {} : { 'Content-Type': 'application/json' }), ...(key ? { 'Idempotency-Key': key } : {}) };
    const response = await fetch(path, { method, headers, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
    const text = await response.text(); let result; try { result = JSON.parse(text); } catch { result = text; }
    return { status: response.status, data: result, contentType: response.headers.get('Content-Type'), requestId: response.headers.get('X-Request-Id') };
  }, { path, method, data, key, anonymous });
}
async function signIn() {
  await page.goto(`${base}/#sign-in`);
  await page.locator('[name=email]').fill('demo.borrower@example.com');
  await page.locator('[name=password]').fill('DemoBorrower123!');
  await page.getByRole('button', { name: 'Sign in to your Account', exact: true }).click();
  const pendingButton = page.getByRole('button', { name: 'Signing in…', exact: true });
  await pendingButton.waitFor();
  assert.equal(await pendingButton.isDisabled(), true);
  await page.locator('[name=code]').fill('123456');
  await page.getByRole('button', { name: 'Verify and sign in', exact: true }).click();
  await page.getByRole('heading', { name: 'Welcome back, Mustafa.' }).waitFor();
}
try {
  const homeRedirect = await page.request.get(`${base}/home`, { maxRedirects: 0 });
  assert.equal(homeRedirect.status(), 307);
  assert.equal(new URL(homeRedirect.headers().location, base).pathname, '/');
  checks.push('home route redirects before page rendering');
  await page.goto(`${base}/contact`);
  const nameField = page.locator('[name=fullName]'); await nameField.waitFor({ state: 'visible' });
  await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.endsWith('/mockServiceWorker.js'));
  assert.match(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? ''), /mockServiceWorker/, 'Contact submission tests require browser mocks');
  await page.locator('[name=phone]').filter({ visible: true }).fill('(555) 123-4567');
  const invalidNames = ['123456', 'Ali123', '１２３', '---', '...', '   ', '😀'];
  const validNames = ['Mustafa Tahir', "Anne-Marie O'Connor", 'José Álvarez', 'محمد علی', 'A\u0301lvaro'];
  const callbackCount = () => requests.filter(path => path === '/api/v1/public/callback-requests').length;
  const beforeInvalid = callbackCount();
  for (const name of invalidNames) {
    await nameField.fill(name);
    assert.equal(await nameField.evaluate(input => input.checkValidity()), false, `Browser rejects ${name}`);
    await page.getByRole('button', { name: 'Request a Callback', exact: true }).click();
    assert.equal(callbackCount(), beforeInvalid, 'Invalid name must not trigger the callback API');
  }
  // Bypassing the HTML pattern must still fail in the submission adapter.
  const pattern = await nameField.getAttribute('pattern');
  await nameField.evaluate(input => input.removeAttribute('pattern')); await nameField.fill('123456');
  await page.getByRole('button', { name: 'Request a Callback', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'numbers are not allowed' }).waitFor();
  assert.equal(callbackCount(), beforeInvalid);
  await nameField.evaluate((input, pattern) => input.setAttribute('pattern', pattern), pattern);
  for (const name of validNames) {
    await nameField.fill(name); assert.equal(await nameField.evaluate(input => input.checkValidity()), true, `Browser accepts ${name}`);
  }
  const accountField = page.locator('[name=accountNumber]').filter({ visible: true });
  await nameField.fill('Mustafa Tahir');
  for (const accountNumber of ['weqwe', 'RTR-', '-123456', '123 456', 'RTR_100849']) {
    await accountField.fill(accountNumber);
    assert.equal(await accountField.evaluate(input => input.checkValidity()), false, `Browser rejects account ${accountNumber}`);
  }
  for (const accountNumber of ['', '100849201', 'RTR-100849', 'ABC123']) {
    await accountField.fill(accountNumber);
    assert.equal(await accountField.evaluate(input => input.checkValidity()), true, `Browser accepts account ${accountNumber || '(blank)'}`);
  }
  const accountPattern = await accountField.getAttribute('pattern');
  await accountField.evaluate(input => input.removeAttribute('pattern'));
  await accountField.fill('weqwe');
  await page.getByRole('button', { name: 'Request a Callback', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'at least one digit' }).waitFor();
  assert.equal(callbackCount(), beforeInvalid, 'Invalid account must not trigger the callback API');
  await accountField.evaluate((input, pattern) => input.setAttribute('pattern', pattern), accountPattern);
  await accountField.fill('RTR-100849');
  const consentTextVersion = await page.locator('[name=callbackConsentVersion]').inputValue();
  await nameField.fill("Anne-Marie O'Connor");
  await page.getByRole('button', { name: 'Request a Callback', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'your callback request has been received' }).waitFor();
  const callback = { phone: '+15551234567', timeZone: 'America/Chicago', preferredWindow: 'NEXT_AVAILABLE', reason: 'OTHER', consentTextVersion };
  const message = { email: 'synthetic@example.com', phone: '+15551234567', reason: 'OTHER', message: 'Synthetic validation test' };
  for (const accountNumber of ['weqwe', 'RTR-', '-123456', '123 456', 'RTR_100849']) {
    assert.equal((await api('/api/v1/public/callback-requests', { method: 'POST', anonymous: true, data: { ...callback, fullName: 'Mustafa Tahir', accountNumber } })).status, 422, `Callback API rejects account ${accountNumber}`);
    assert.equal((await api('/api/v1/public/messages', { method: 'POST', anonymous: true, data: { ...message, fullName: 'Mustafa Tahir', accountNumber } })).status, 422, `Message API rejects account ${accountNumber}`);
  }
  for (const accountNumber of [null, '100849201', 'RTR-100849', 'ABC123']) {
    assert.equal((await api('/api/v1/public/callback-requests', { method: 'POST', anonymous: true, data: { ...callback, fullName: 'Mustafa Tahir', accountNumber } })).status, 201, `Callback API accepts account ${accountNumber}`);
    assert.equal((await api('/api/v1/public/messages', { method: 'POST', anonymous: true, data: { ...message, fullName: 'Mustafa Tahir', accountNumber } })).status, 201, `Message API accepts account ${accountNumber}`);
  }
  for (const fullName of [...invalidNames, 'A'.repeat(101)]) {
    assert.equal((await api('/api/v1/public/callback-requests', { method: 'POST', anonymous: true, data: { ...callback, fullName } })).status, 422, `Callback API rejects ${fullName}`);
    assert.equal((await api('/api/v1/public/messages', { method: 'POST', anonymous: true, data: { ...message, fullName } })).status, 422, `Message API rejects ${fullName}`);
  }
  for (const fullName of validNames) {
    assert.equal((await api('/api/v1/public/callback-requests', { method: 'POST', anonymous: true, data: { ...callback, fullName } })).status, 201);
    assert.equal((await api('/api/v1/public/messages', { method: 'POST', anonymous: true, data: { ...message, fullName } })).status, 201);
  }
  assert.equal((await api('/api/callback', { method: 'POST', anonymous: true, data: { fullName: '123456', phone: '(555) 123-4567' } })).status, 400);
  await page.getByRole('tab', { name: 'Send Online Message', exact: true }).click();
  await page.locator('[name=email]').fill('synthetic@example.com');
  await page.locator('[name=phone]').filter({ visible: true }).fill('(555) 123-4567');
  await page.locator('[name=message]').fill('Synthetic validation test');
  await page.locator('[name=firstName]').fill('Mustafa'); await page.locator('[name=lastName]').fill('Tahir');
  const messageAccountField = page.locator('[name=accountNumber]').filter({ visible: true });
  await messageAccountField.fill('weqwe');
  assert.equal(await messageAccountField.evaluate(input => input.checkValidity()), false);
  await messageAccountField.fill('100849201');
  assert.equal(await messageAccountField.evaluate(input => input.checkValidity()), true);
  for (const field of ['firstName', 'lastName']) {
    await page.locator(`[name=${field}]`).fill('123456');
    assert.equal(await page.locator(`[name=${field}]`).evaluate(input => input.checkValidity()), false);
    await page.locator(`[name=${field}]`).fill(field === 'firstName' ? 'Mustafa' : 'Tahir');
  }
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'your message has been sent' }).waitFor();
  checks.push('name and account validation in browser/adapter/API, including valid numeric and alphanumeric account IDs');
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      if (args[0] === '/api/auth/sign-in') await new Promise(resolve => window.setTimeout(resolve, 600));
      return originalFetch(...args);
    };
  });
  await signIn();
  const me = await api('/api/v1/me'); assert.equal(me.status, 200); assert.equal(me.data.displayName, 'Mustafa Tahir'); assert.equal(me.data.loans.length, 2); checks.push('generated dashboard and identity');
  const first = me.data.loans[0].loanId, second = me.data.loans[1].loanId;
  const firstSummary = await api(`/api/v1/loans/${first}/summary`), secondSummary = await api(`/api/v1/loans/${second}/summary`);
  assert.notEqual(firstSummary.data.nextPayment.amount, secondSummary.data.nextPayment.amount);
  assert.equal((await api(`/api/v1/loans/${first}/people`)).data.items.length, 2);
  assert.equal((await api(`/api/v1/loans/${second}/people`)).data.items.length, 1); checks.push('distinct loans and single co-borrower relationship');
  const denied = await api('/api/v1/me', { anonymous: true }); assert.equal(denied.status, 401); assert.equal(denied.data.code, 'UNAUTHENTICATED'); assert.match(denied.contentType, /application\/problem\+json/); assert.ok(denied.requestId);
  assert.equal((await api('/api/v1/loans/not-linked/summary')).status, 404); checks.push('auth boundary and RFC 9457 errors');
  const options = (await api(`/api/v1/loans/${first}/payment-options`)).data;
  const terms = (await api(`/api/v1/loans/${first}/authorization-terms?type=ONE_TIME`)).data;
  const bank = (await api(`/api/v1/loans/${first}/bank-accounts`)).data.items[0];
  const input = { amountType: 'REGULAR', amount: options.amountOptions[0].amount, additionalPrincipal: '0.00', draftDate: options.dateOptions.latestDate, bankAccountId: bank.bankAccountId, authorization: { accepted: true, termsVersion: terms.version } };
  const key = crypto.randomUUID();
  const created = await api(`/api/v1/loans/${first}/payments`, { method: 'POST', data: input, key }); assert.equal(created.status, 201); assert.equal(created.data.status, 'SCHEDULED');
  const duplicate = await api(`/api/v1/loans/${first}/payments`, { method: 'POST', data: input, key }); assert.equal(duplicate.data.paymentId, created.data.paymentId);
  const conflict = await api(`/api/v1/loans/${first}/payments`, { method: 'POST', data: { ...input, additionalPrincipal: '1.00' }, key }); assert.equal(conflict.status, 409);
  const staleTerms = await api(`/api/v1/loans/${first}/payments`, { method: 'POST', data: { ...input, authorization: { accepted: true, termsVersion: 'obsolete' } }, key: crypto.randomUUID() }); assert.equal(staleTerms.status, 422);
  assert.equal((await api(`/api/v1/loans/${first}/scheduled-payments`)).data.items.length, 1); checks.push('payment idempotency, conflict and consent version');
  assert.equal((await api(`/api/v1/loans/${first}/scheduled-payments/${created.data.paymentId}`, { method: 'DELETE' })).status, 200);
  assert.equal((await api(`/api/v1/loans/${first}/scheduled-payments/${created.data.paymentId}`, { method: 'DELETE' })).status, 409); checks.push('cancellation and duplicate cancellation');
  const recurringTerms = (await api(`/api/v1/loans/${first}/authorization-terms?type=RECURRING`)).data;
  const date = new Date(`${options.dateOptions.earliestDate}T00:00:00Z`); date.setUTCMonth(date.getUTCMonth() + 1, 1);
  const schedule = { frequency: 'MONTHLY', firstDraftDate: date.toISOString().slice(0, 10), secondDayOfMonth: null };
  const preview = await api(`/api/v1/loans/${first}/autopay/preview`, { method: 'POST', data: schedule }); assert.equal(preview.status, 200); assert.equal(preview.data.amountPerDraft, '2450.00');
  const enrollment = { schedule, bankAccountId: bank.bankAccountId, expectedRulesVersion: preview.data.rulesVersion, expectedAmountPerDraft: preview.data.amountPerDraft, expectedTotalPerYear: preview.data.totalPerYear, authorization: { accepted: true, termsVersion: recurringTerms.version } }, autoKey = crypto.randomUUID();
  assert.equal((await api(`/api/v1/loans/${first}/autopay`, { method: 'PUT', data: enrollment, key: autoKey })).data.enrolled, true);
  assert.equal((await api(`/api/v1/loans/${first}/autopay`, { method: 'PUT', data: { ...enrollment, schedule: { ...schedule, frequency: 'WEEKLY' } }, key: autoKey })).status, 409);
  assert.equal((await api(`/api/v1/loans/${first}/autopay`, { method: 'DELETE' })).data.enrolled, false); checks.push('AutoPay preview, activation, idempotency and cancellation');
  const profile = (await api('/api/v1/me/profile')).data; assert.equal(profile.fullName, 'Mustafa Tahir'); assert.equal(profile.personId, 'mock-borrower');
  assert.equal((await api('/api/v1/me/profile/mailing-address', { method: 'PUT', data: { ...profile.mailingAddress, city: 'Dallas' } })).data.mailingAddress.city, 'Dallas');
  const changed = await api('/api/v1/me/profile/email-change', { method: 'POST', data: { newEmail: 'mustafa.updated@example.com' } }); assert.equal(changed.status, 202);
  assert.equal((await api('/api/v1/me/profile/email-change/confirm', { method: 'POST', data: { emailChangeId: changed.data.emailChangeId, code: '000000' } })).status, 422);
  assert.equal((await api('/api/v1/me/profile/email-change/confirm', { method: 'POST', data: { emailChangeId: changed.data.emailChangeId, code: '123456' } })).data.email, 'mustafa.updated@example.com'); checks.push('self profile and verified email change');
  const preferences = (await api(`/api/v1/me/communication-preferences?loanId=${first}`)).data;
  assert.equal((await api('/api/v1/me/communication-preferences', { method: 'PUT', data: { loanId: first, choices: [{ channel: 'SMS', enabled: true, consentTextVersion: 'obsolete' }] } })).status, 409);
  const sms = preferences.choices.find(choice => choice.channel === 'SMS');
  assert.equal((await api('/api/v1/me/communication-preferences', { method: 'PUT', data: { loanId: first, choices: [{ channel: sms.channel, enabled: true, consentTextVersion: sms.consentTextVersion }] } })).status, 200); checks.push('versioned communication preferences');
  const docs = (await api(`/api/v1/loans/${first}/documents`)).data;
  const link = await api(`/api/v1/loans/${first}/documents/${docs.items[0].documentId}/link`, { method: 'POST' }); assert.equal(link.status, 200);
  const pdf = await page.evaluate(async url => { const response = await fetch(url); return { status: response.status, type: response.headers.get('Content-Type'), signature: (await response.text()).slice(0, 5) }; }, link.data.url); assert.equal(pdf.signature, '%PDF-'); checks.push('short-lived document links and PDF download');
  const csv = await api(`/api/v1/loans/${first}/payments/export?status=POSTED`); assert.equal(csv.status, 200); assert.match(csv.data, /Mustafa Tahir/); assert.doesNotMatch(csv.data, /Ahsan Khan/); checks.push('filtered CSV endpoint');
  for (const loanId of [first, second]) {
    const byName = await api(`/api/v1/loans/${loanId}/payments?q=Mustafa`);
    assert.equal(byName.status, 200); assert.ok(byName.data.items.length > 0);
    assert.ok(byName.data.items.every(payment => payment.madeBy === 'Mustafa Tahir'));
    const byOtherName = await api(`/api/v1/loans/${loanId}/payments?q=Ahsan`);
    assert.equal(byOtherName.status, 200); assert.equal(byOtherName.data.items.length, 0);
    const csvByName = await api(`/api/v1/loans/${loanId}/payments/export?q=Mustafa`);
    assert.equal(csvByName.status, 200); assert.match(csvByName.data, /Mustafa Tahir/); assert.doesNotMatch(csvByName.data, /Ahsan Khan/);
  }
  // Full page navigation intentionally resets synthetic data; the tab session remains.
  await page.goto(`${base}/dashboard/payment-history`); await page.getByRole('heading', { name: 'Payment History', exact: true }).waitFor();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.locator('table tbody tr').first().getByText('Mustafa Tahir', { exact: true }).waitFor();
  const paymentSearch = page.getByRole('searchbox', { name: 'Search payment history' });
  await paymentSearch.pressSequentially('MOCK-PAY-1');
  assert.equal(await paymentSearch.inputValue(), 'MOCK-PAY-1');
  assert.equal(new URL(page.url()).searchParams.get('q'), 'MOCK-PAY-1');
  assert.equal(await page.locator('table tbody tr').count(), 1);
  await page.reload();
  await paymentSearch.waitFor();
  assert.equal(await paymentSearch.inputValue(), 'MOCK-PAY-1');
  await paymentSearch.fill('');
  await paymentSearch.pressSequentially('Mustafa');
  assert.equal(await paymentSearch.inputValue(), 'Mustafa');
  assert.equal(new URL(page.url()).searchParams.get('q'), 'Mustafa');
  await page.locator('table tbody tr').first().getByText('Mustafa Tahir', { exact: true }).waitFor();
  assert.ok(await page.locator('table tbody tr').count() > 0);
  await paymentSearch.fill('');
  checks.push('payment history rapid typing, URL persistence and visible initiator search');
  await page.setViewportSize({ width: 390, height: 844 });
  const receiptTrigger = page.getByRole('button', { name: 'View receipt MOCK-PAY-1', exact: true }).filter({ visible: true });
  await receiptTrigger.click();
  await page.getByRole('dialog').waitFor(); await page.getByRole('heading', { name: 'Payment Allocation' }).waitFor(); await page.getByRole('dialog').getByText('Mustafa Tahir', { exact: true }).first().waitFor(); await page.getByRole('button', { name: 'Close receipt' }).click();
  await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'View receipt MOCK-PAY-1');
  checks.push('borrower name in two-loan API/search/CSV, desktop history, mobile receipt and close focus');
  await page.goto(`${base}/dashboard/account?tab=co`);
  const coDetails = page.getByTestId('co-borrower-details');
  await coDetails.getByText('Ahsan Khan', { exact: true }).waitFor();
  assert.equal(await coDetails.locator('input,form,button').count(), 0);
  assert.doesNotMatch(await coDetails.innerText(), /co.borrower@example|Mailing Address|90210|Regulatory Preferences/);
  const coPath = `/api/mock/loans/${first}/people/mock-co-borrower/profile`;
  assert.equal((await api(coPath)).status, 404);
  assert.equal((await api(coPath, { anonymous: true })).status, 404);
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) assert.equal((await api(coPath, { method, data: { first_name: 'Changed' } })).status, 403);
  const coNames = (await api(`/api/v1/loans/${first}/people`)).data.items;
  assert.ok(coNames.every(person => Object.keys(person).sort().join(',') === 'displayName,isMe,personId,role'));
  await page.goto(`${base}/dashboard/account?loan=${second}&tab=co`);
  await page.getByText('No co-borrower on this loan', { exact: true }).waitFor();
  checks.push('names-only co-borrower view, no personal data payload and rejected profile access/writes');
  await page.goto(`${base}/dashboard/payments`); await page.getByRole('heading', { name: 'Select Payment Amount' }).waitFor(); await page.getByRole('button', { name: 'Next', exact: true }).click(); await page.getByRole('heading', { name: 'Choose Process Date' }).waitFor();
  await page.getByText('Late-fee timing and amount are not verified for this preview loan. Check the loan terms.').waitFor();
  assert.equal(await page.getByText(/\$0 Late Fee|Late fee: \$/).count(), 0);
  await page.locator('input[name=dateType][value=due]').check(); await page.getByRole('button', { name: 'Next', exact: true }).click(); await page.getByRole('button', { name: 'Review & Authorize', exact: true }).click(); await page.getByRole('dialog').getByRole('checkbox').check(); await page.getByRole('button', { name: 'Confirm Payment', exact: true }).click(); await page.getByRole('heading', { name: 'Preview payment confirmed' }).waitFor(); checks.push('payment wizard through the generated client and no unverified late-fee badge');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel Payment', exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Yes, cancel payment' }).click();
  await page.getByRole('heading', { name: 'Payment Cancelled' }).waitFor();
  await page.getByRole('heading', { name: 'Cancellation Details' }).waitFor();
  await page.getByRole('heading', { name: /payment is still due/ }).waitFor();
  await page.getByText('Not verified', { exact: true }).waitFor();
  await page.getByText(/This preview does not verify your loan's late-fee date/).waitFor();
  assert.equal(await page.getByText(/15-day grace window|last day before a late fee may apply/i).count(), 0);
  assert.match(await page.getByRole('link', { name: 'Make a Payment Now' }).getAttribute('href'), new RegExp(`loan=${first}`));
  assert.match(await page.getByRole('link', { name: 'Set Up AutoPay' }).getAttribute('href'), /tab=autopay/);
  await page.getByRole('link', { name: '(877) 469-7325' }).waitFor();
  checks.push('scheduled payment cancellation opens details and due reminder');
  await page.goto(`${base}/help-center`); await page.getByRole('heading', { name: 'How Can We Help You?' }).waitFor(); await page.getByText('Why was my account transferred to RTR?', { exact: true }).waitFor(); checks.push('generated FAQ hook');
  await page.goto(`${base}/dashboard/payments?tab=autopay&frequency=semi_monthly`);
  await page.getByRole('heading', { name: 'Select Payment Frequency', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Next', exact: true }).click(); await page.getByRole('heading', { name: 'Select First Draft Day', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Next', exact: true }).click(); await page.getByRole('region', { name: 'ACH Electronic Authorization' }).getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Activate AutoPay', exact: true }).click(); await page.getByRole('heading', { name: 'AutoPay is Active', exact: true }).waitFor(); checks.push('semi-monthly AutoPay wizard and first draft preview');
  await page.getByRole('button', { name: 'Toggle portal navigation' }).click();
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await page.waitForURL(`${base}/`);
  await page.goto(`${base}/dashboard`, { waitUntil: 'load' });
  await page.waitForURL(`${base}/`);
  await page.waitForLoadState('load');
  await page.getByRole('button', { name: 'Sign in to your Account', exact: true }).waitFor();
  checks.push('logout removes portal access and public page reaches load event');
  await page.locator('[name=email]').fill('demo.borrower@example.com');
  await page.locator('[name=password]').fill('DemoBorrower123!');
  await page.getByRole('button', { name: 'Sign in to your Account', exact: true }).click();
  assert.equal(new URL(page.url()).search, '', 'Credentials must never appear in the URL');
  await page.locator('[name=code]').fill('123456');
  await page.getByRole('button', { name: 'Verify and sign in', exact: true }).click();
  await page.getByRole('heading', { name: 'Welcome back, Mustafa.' }).waitFor();
  await page.getByRole('button', { name: 'Toggle portal navigation' }).click();
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await page.waitForURL(`${base}/`);
  checks.push('immediate sign-in after session expiry without reload or credentials in URL');
  await page.getByRole('link', { name: 'Register Now' }).click();
  await page.locator('[name=accountNumber]').fill(first);
  await page.locator('[name=ssnLast4]').fill('1234'); await page.locator('[name=zipCode]').fill('90210');
  await page.locator('.hm-register [name=email]').fill('new.borrower@example.com');
  await page.getByRole('button', { name: 'Verify my details', exact: true }).click();
  await page.locator('[name=registrationCode]').fill('123456'); await page.getByRole('button', { name: 'Verify registration code', exact: true }).click();
  await page.locator('.hm-register [name=password]').fill('DemoBorrower123!'); await page.locator('[name=confirmPassword]').fill('DemoBorrower123!');
  await page.locator('[name=acceptDisclosures]').check(); await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await page.getByRole('button', { name: 'Sign in to your Account', exact: true }).waitFor(); checks.push('registration UI with generated operations and disclosure versions');
  await page.locator('#sign-in [name=email]').fill('new.borrower@example.com');
  await page.locator('#sign-in [name=password]').fill('DemoBorrower123!');
  const registeredSignIn = page.waitForResponse(response => new URL(response.url()).pathname === '/api/auth/sign-in');
  await page.getByRole('button', { name: 'Sign in to your Account', exact: true }).click();
  assert.equal((await registeredSignIn).status(), 200, 'Registered account sign-in must be handled by MSW, not the 501 server fallback');
  await page.locator('[name=code]').fill('123456');
  await page.getByRole('button', { name: 'Verify and sign in', exact: true }).click();
  await page.getByRole('heading', { name: 'Welcome back, Mustafa.' }).waitFor();
  checks.push('Chrome sign-in with the registered account avoids POST 501');
  assert.equal(requests.some(path => path === '/api/portal/mock-data'), false, 'Retired snapshot endpoint must not be used');
  assert.deepEqual(errors, []);
  mkdirSync('.private-review/generated-api', { recursive: true });
  writeFileSync('.private-review/generated-api/results.json', JSON.stringify({ checks, requests: [...new Set(requests)], errors }, null, 2));
  console.log(`Passed ${checks.length} contract and browser checks.`);
} catch (error) {
  console.error('Generated API check failed at:', page.url());
  console.error('Browser errors:', errors);
  throw error;
} finally { await browser.close(); }
