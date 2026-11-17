import assert from "node:assert/strict";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import axe from "axe-core";

const content = JSON.parse(readFileSync(new URL("../app/sms-terms/content.json", import.meta.url), "utf8"));
const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const output = new URL("../.private-review/sms-terms/", import.meta.url);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const response = await page.goto(`${baseURL}/sms-terms`);
    assert.equal(response.status(), 200);
    await page.getByRole("heading", { name: "SMS Terms of Service", level: 1 }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    const photo = page.locator("main header img");
    await photo.evaluate(image => image.decode());
    assert.match(decodeURIComponent(await photo.getAttribute("src")), /sms-terms-smartphone-messaging\.webp/);
    assert.equal(await photo.getAttribute("alt"), "");
    assert.equal(await page.title(), "SMS Terms of Service | RTR Servicing");
    assert.equal(await page.locator("article > div p").first().textContent(), content.introduction);
    const expected = content.sections.flatMap(section => section.paragraphs)
      .map(text => text.replace(/\[([^\]]+)\]\(mailto:[^)]+\)/g, "$1"));
    assert.deepEqual(await page.locator("article section p").allTextContents(), expected);
    assert.equal(await page.locator("article strong").filter({ hasText: "“STOP”" }).count(), 1);
    assert.equal(await page.locator("article strong").filter({ hasText: "“HELP”" }).count(), 1);
    assert.equal(await page.locator('article a[href="mailto:support@rtrservicing.com"]').count(), 2);
    assert.equal(await page.locator('article a[href="tel:+18774697325"]').count(), 2);
    assert.equal(await page.locator("article").getByRole("link", { name: "Privacy Policy", exact: true }).getAttribute("href"), "/privacy-policy");
    assert.equal(await page.getByRole("contentinfo").getByRole("link", { name: "SMS Terms", exact: true }).getAttribute("href"), "/sms-terms");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No overflow at ${width}px`);

    const contrast = await page.locator("main header").evaluate(hero => {
      const luminance = rgb => rgb.map(value => {
        const c = value / 255;
        return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
      }).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
      const overlay = getComputedStyle(hero, "::after");
      if (!`${overlay.backgroundImage} ${overlay.backgroundColor}`.includes("0.92")) throw new Error("Missing contrast-protection overlay");
      const background = luminance([0, 24, 38].map(c => c * .92 + 255 * .08));
      return [...hero.querySelectorAll("h1, h1 span, p, time, [class*='eyebrow']")]
        .filter(element => element.textContent.trim())
        .map(element => (luminance(getComputedStyle(element).color.match(/[\d.]+/g).slice(0, 3).map(Number)) + .05) / (background + .05));
    });
    assert.ok(contrast.every(ratio => ratio >= 4.5), "Hero text meets normal-text contrast even against a white photo pixel");

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
    await page.screenshot({ path: fileURLToPath(new URL(`sms-${width}.png`, output)), fullPage: false });
    console.log(`PASS: SMS wording, STOP/HELP, links, hero contrast and accessibility at ${width}px`);
  }
  await page.goto(`${baseURL}/terms-of-use`);
  await page.locator("article").getByRole("link", { name: "SMS Terms", exact: true }).click();
  await page.waitForURL("**/sms-terms");
  await page.goto(`${baseURL}/sms-terms`);
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
  console.log("PASS: Terms cross-link, keyboard access and accessibility controls");
} finally {
  await browser.close();
}
