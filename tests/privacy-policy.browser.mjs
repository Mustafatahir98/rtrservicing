import assert from "node:assert/strict";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import axe from "axe-core";

const content = JSON.parse(readFileSync(new URL("../app/privacy-policy/content.json", import.meta.url), "utf8"));
const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const output = new URL("../.private-review/privacy-policy/", import.meta.url);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const response = await page.goto(`${baseURL}/privacy-policy`);
    assert.equal(response.status(), 200);
    await page.getByRole("heading", { name: "Privacy Policy", level: 1 }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    const photo = page.locator("main header img");
    await photo.evaluate(image => image.decode());
    assert.match(decodeURIComponent(await photo.getAttribute("src")), /privacy-policy-laptop-workspace\.webp/);
    assert.equal(await photo.getAttribute("alt"), "");
    assert.equal(await page.title(), "Privacy Policy | RTR Servicing");
    assert.equal(await page.locator("article > div p").first().textContent(), content.introduction);
    assert.deepEqual(await page.locator("article section p:not([class])").allTextContents(), content.sections.flatMap(section => section.paragraphs));
    const ccpa = content.sections.find(section => section.link).link;
    assert.equal(await page.getByRole("link", { name: ccpa.label, exact: true }).getAttribute("href"), ccpa.href);
    assert.equal(await page.locator('article a[href="tel:+18774697325"]').count(), 1);
    assert.equal(await page.getByRole("contentinfo").getByRole("link", { name: "Privacy Policy", exact: true }).getAttribute("href"), "/privacy-policy");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No overflow at ${width}px`);

    const contents = page.getByRole("navigation", { name: "On this page" });
    if (width <= 1024) await contents.locator("summary").click();
    for (const section of content.sections) {
      await contents.getByRole("link", { name: section.title, exact: true }).click();
      await page.waitForFunction(id => location.hash === `#${id}`, section.id);
    }
    if (width <= 1024) await contents.locator("summary").click();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.addScriptTag({ content: axe.source });
    const violations = await page.evaluate(async () => {
      const results = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } });
      return results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }));
    });
    assert.deepEqual(violations, [], `Accessibility at ${width}px`);
    await page.screenshot({ path: fileURLToPath(new URL(`privacy-${width}.png`, output)), fullPage: false });
    console.log(`PASS: supplied privacy text, links, image, reflow and accessibility at ${width}px`);
  }

  for (const [name, filename] of [["Affiliate", "rtr-privacy-notice-affiliate.pdf"], ["Non-Affiliate", "rtr-privacy-notice-non-affiliate.pdf"]]) {
    const link = page.locator("article").getByRole("link", { name: `${name} Privacy Notice`, exact: true });
    assert.equal(await link.getAttribute("href"), name === "Affiliate" ? "/privacy-notice-affiliate" : "/privacy-notice-non-affiliate");
    const response = await page.request.get(`${baseURL}/legal/privacy-notices/${filename}`);
    assert.equal(response.status(), 200);
    assert.match(response.headers()["content-type"], /application\/pdf/);
    assert.equal((await response.body()).subarray(0, 5).toString(), "%PDF-");
  }
  await page.goto(`${baseURL}/legal/privacy`);
  await page.waitForURL("**/privacy-policy");
  await page.goto(`${baseURL}/privacy-policy`);
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), "Skip to main content");
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement.id), "main-content");
  const widget = page.getByRole("button", { name: "Accessibility options", exact: true });
  await widget.click();
  assert.equal(await widget.getAttribute("aria-expanded"), "true");
  await page.keyboard.press("Escape");
  assert.equal(await widget.getAttribute("aria-expanded"), "false");
  assert.deepEqual(errors, []);
  console.log("PASS: both PDF notices, old privacy URL, keyboard skip link and accessibility controls");
} finally {
  await browser.close();
}
