import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const base = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Use the local synthetic preview only');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const output = '.private-review/payoff-presentation';
mkdirSync(output, { recursive: true });
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(15_000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/#sign-in`);
  await page.locator('[name=email]').fill('demo.borrower@example.com');
  await page.locator('[name=password]').fill('DemoBorrower123!');
  await page.getByRole('button', { name: 'Sign in to your Account', exact: true }).click();
  await page.locator('[name=code]').fill('123456');
  await page.getByRole('button', { name: 'Verify and sign in', exact: true }).click();
  await page.getByRole('heading', { name: 'Welcome back, Mustafa.' }).waitFor();
  const loans = await page.evaluate(async () => {
    const result = await fetch('/api/v1/me', { headers: { Authorization: 'Bearer mock-borrower-access-token' } });
    return (await result.json()).loans;
  });
  for (const loan of loans) {
    const result = await page.evaluate(async id => {
      const headers = { Authorization: 'Bearer mock-borrower-access-token' };
      const read = async path => (await fetch(path, { headers })).json();
      const options = await read(`/api/v1/loans/${id}/payment-options`);
      const terms = await read(`/api/v1/loans/${id}/authorization-terms?type=ONE_TIME`);
      const banks = await read(`/api/v1/loans/${id}/bank-accounts`);
      const rejects = [];
      for (const payoffQuoteId of [null, 'forged-quote-id']) {
        const response = await fetch(`/api/v1/loans/${id}/payments`, {
          method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
          body: JSON.stringify({ amountType: 'PAYOFF', amount: '1.00', additionalPrincipal: '0.00', draftDate: options.dateOptions.latestDate, bankAccountId: banks.items[0].bankAccountId, payoffQuoteId, authorization: { accepted: true, termsVersion: terms.version } }),
        });
        rejects.push({ status: response.status, code: (await response.json()).code });
      }
      return { payoffOptions: options.amountOptions.filter(item => item.type === 'PAYOFF').length, rejects };
    }, loan.loanId);
    assert.equal(result.payoffOptions, 0);
    assert.deepEqual(result.rejects, [{ status: 409, code: 'PAYOFF_QUOTE_REQUIRED' }, { status: 409, code: 'PAYOFF_QUOTE_REQUIRED' }]);
  }
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const loan of loans) {
      await page.goto(`${base}/dashboard/payments?loan=${loan.loanId}`);
      await page.getByRole('heading', { name: 'Select Payment Amount', exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: /Payoff Balance/ }).count(), 0);
      await page.getByRole('button', { name: /Other Amount/ }).click();
      await page.locator('[name=customAmount]').fill('100.00');
      await page.getByRole('button', { name: /Regular Payment/ }).click();
      const request = page.getByRole('link', { name: 'Request Payoff Quote', exact: true });
      assert.match(await request.getAttribute('href'), new RegExp(`loan=${loan.loanId}.*tab=payoff`));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `${output}/payments-${loan.loanId}-${width}.png`, fullPage: true });
      await request.click();
      await page.getByRole('heading', { name: 'Payoff Demand Quotes', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Request quote', exact: true }).waitFor();
      await page.getByText('Preview quote. Amounts are examples, not official payoff instructions', { exact: false }).waitFor();
      const payoffDate = page.getByLabel('Requested payoff date');
      const dateLayout = await payoffDate.evaluate(input => {
        const label = input.closest('label').getBoundingClientRect();
        const field = input.parentElement.getBoundingClientRect();
        const nativeInput = input.getBoundingClientRect();
        return { labelLeft: label.left, labelRight: label.right, fieldLeft: field.left, fieldRight: field.right, inputLeft: nativeInput.left, inputRight: nativeInput.right };
      });
      assert.ok(dateLayout.fieldLeft >= dateLayout.labelLeft && dateLayout.fieldRight <= dateLayout.labelRight, `Payoff date field overflows at ${width}px`);
      assert.ok(dateLayout.inputLeft >= dateLayout.fieldLeft && dateLayout.inputRight <= dateLayout.fieldRight, `Native date input overflows at ${width}px`);
      const dateMinimum = await payoffDate.getAttribute('min');
      const nextDate = new Date(Date.parse(`${dateMinimum}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
      await payoffDate.fill(nextDate);
      assert.equal(await payoffDate.inputValue(), nextDate);
      assert.notEqual(await page.locator('[data-payoff-date-display]').textContent(), 'Choose a date');
      if (width === 390 && loan.loanId === loans[0].loanId) {
        await page.getByRole('button', { name: 'Request quote', exact: true }).click();
        const quoteCard = page.locator('[aria-labelledby="payoff-quotes-title"] li').first();
        await quoteCard.getByRole('heading', { name: 'Payoff quote', exact: true }).waitFor();
        assert.match(await quoteCard.getByText(/^Reference:/).textContent(), /^Reference: DEMO-PQ-/);
        const cardLayout = await quoteCard.evaluate(card => {
          const panel = card.getBoundingClientRect();
          const preview = card.querySelector('button');
          const action = preview.getBoundingClientRect();
          return { fits: action.left >= panel.left && action.right <= panel.right, fontSize: getComputedStyle(preview).fontSize };
        });
        assert.equal(cardLayout.fits, true, 'Payoff PDF action must fit inside its card');
        assert.equal(cardLayout.fontSize, '16px');
      }
      assert.equal(await page.getByRole('link', { name: 'Contact Customer Solutions', exact: true }).getAttribute('href'), '/contact#message');
      await page.goto(`${base}/dashboard/account?loan=${loan.loanId}`);
      await page.getByRole('heading', { name: 'Planning to pay off your loan?', exact: true }).waitFor();
      assert.equal(await page.getByText('Quote valid through statement cycle', { exact: true }).count(), 0);
      assert.equal(await page.getByText('Payoff quote available:', { exact: true }).count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `${output}/overview-${loan.loanId}-${width}.png`, fullPage: true });
    }
  }
  await page.getByRole('link', { name: 'Request Payoff Quote', exact: true }).click();
  await page.getByRole('link', { name: 'Contact Customer Solutions', exact: true }).click();
  await page.getByRole('heading', { name: 'Send Us a Message', exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/dashboard/documents?loan=${loans[0].loanId}&tab=payoff`);
  await page.getByRole('heading', { name: 'Payoff Demand Quotes', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Contact Customer Solutions', exact: true }).click();
  await page.getByRole('heading', { name: 'Send Us a Message', exact: true }).waitFor();
  await page.goBack();
  await page.getByRole('heading', { name: 'Payoff Demand Quotes', exact: true }).waitFor();
  const returnedMobileLayout = await page.evaluate(() => {
    const tabs = document.querySelector('[aria-label="Document categories"]');
    const categorySelect = [...document.querySelectorAll('select')].find(select => select.value === 'payoff');
    const title = [...document.querySelectorAll('h1')].find(heading => heading.textContent.includes('Documents'));
    return {
      tabs: tabs && getComputedStyle(tabs).display,
      select: categorySelect && getComputedStyle(categorySelect.parentElement).display,
      titleSize: title && getComputedStyle(title).fontSize,
      mobileNav: getComputedStyle(document.querySelector('[aria-label="Mobile borrower navigation"]')).display,
      overflows: document.documentElement.scrollWidth > innerWidth,
    };
  });
  assert.deepEqual(returnedMobileLayout, { tabs: 'none', select: 'flex', titleSize: '26px', mobileNav: 'flex', overflows: false });
  assert.deepEqual(errors, []);
  console.log('Passed payoff display, contact path, two-loan isolation, responsive layout and rejected unquoted payoff checks.');
} finally { await browser.close(); }
