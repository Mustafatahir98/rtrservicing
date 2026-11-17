import assert from "node:assert/strict";
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import axe from "axe-core";

const content = JSON.parse(readFileSync(new URL("../app/terms-of-use/content.json", import.meta.url), "utf8"));
const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const outputDirectory = new URL("../.private-review/terms-of-use/", import.meta.url);
mkdirSync(outputDirectory, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const response = await page.goto(`${baseURL}/terms-of-use`);
    assert.equal(response.status(), 200);
    await page.getByRole("heading", { name: "Terms of Use", level: 1 }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    const heroPhoto = page.locator('main header img');
    await heroPhoto.evaluate(image => image.decode());
    assert.equal(await heroPhoto.evaluate(image => image.naturalWidth > 0), true, "Local hero photograph loads");
    assert.equal(await heroPhoto.getAttribute("alt"), "", "Decorative background has no redundant screen-reader description");
    assert.equal(await heroPhoto.locator("..").getAttribute("aria-hidden"), "true");
    const heroContrast = await page.locator("main header").evaluate(hero => {
      const overlay = getComputedStyle(hero, "::after").backgroundImage;
      const uniform = getComputedStyle(hero, "::after").backgroundColor;
      if (!`${overlay} ${uniform}`.includes("0.92")) throw new Error("Required text-protection overlay is missing");
      const luminance = rgb => rgb.map(value => {
        const channel = value / 255;
        return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
      }).reduce((sum, channel, i) => sum + channel * [.2126, .7152, .0722][i], 0);
      // Bright white is the worst possible photo pixel behind the dark overlay.
      const background = [0, 24, 38].map(channel => channel * .92 + 255 * .08);
      return [...hero.querySelectorAll("h1, h1 span, p, time, [class*='eyebrow']")]
        .filter(element => element.textContent.trim())
        .map(element => {
          const foreground = getComputedStyle(element).color.match(/[\d.]+/g).slice(0, 3).map(Number);
          const ratio = (luminance(foreground) + .05) / (luminance(background) + .05);
          return { text: element.textContent, ratio };
        });
    });
    assert.ok(heroContrast.every(item => item.ratio >= 4.5), `Hero text contrast at ${width}px: ${JSON.stringify(heroContrast)}`);
    if (width === 1440) {
      const client = await page.context().newCDPSession(page);
      await client.send("DOM.enable");
      await client.send("CSS.enable");
      const { root } = await client.send("DOM.getDocument");
      const { nodeId } = await client.send("DOM.querySelector", { nodeId: root.nodeId, selector: "main h1" });
      const { fonts } = await client.send("CSS.getPlatformFontsForNode", { nodeId });
      assert.ok(fonts.some(font => font.isCustomFont && /Google Sans Flex/i.test(font.familyName)), "Brand font actually renders instead of Arial");
      await client.detach();
    }
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await page.title(), "Terms of Use | RTR Servicing");

    // Every supplied paragraph must appear in full and in its original order.
    const expected = content.sections.flatMap(section => section.paragraphs)
      .map(text => text.replace(/\[([^\]]+)\]\(mailto:[^)]+\)/g, "$1"));
    const actual = await page.locator("article section p").allTextContents();
    assert.deepEqual(actual, expected, `Legal wording at ${width}px`);
    assert.equal(await page.locator('p[lang="es"]').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No horizontal overflow at ${width}px`);
    assert.equal(await page.getByRole("contentinfo").getByRole("link", { name: "Terms of Use", exact: true }).getAttribute("href"), "/terms-of-use");

    const contents = page.getByRole("navigation", { name: "On this page" });
    if (width <= 1024) await contents.locator("summary").click();
    for (const section of content.sections) {
      assert.equal(await contents.locator(`a[href="#${section.id}"]:visible`).count(), 1);
      assert.equal(await page.locator(`#${section.id} h2`).innerText(), `${String(content.sections.indexOf(section) + 1).padStart(2, "0")}\n${section.title}`);
    }
    await contents.getByRole("link", { name: "Accessibility", exact: true }).click();
    await page.waitForFunction(() => location.hash === "#accessibility");
    await page.waitForFunction(() => {
      const top = document.querySelector("#accessibility-heading").getBoundingClientRect().top;
      return top >= 90 && top < 300;
    });
    const heading = await page.locator("#accessibility-heading").boundingBox();
    assert.ok(heading.y >= 90 && heading.y < 1000, "Anchor heading stays below the shared header");
    await page.locator('article a[href="#main-content"]').click();
    if (width <= 1024) await contents.locator("summary").click();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.addScriptTag({ content: axe.source });
    const accessibilityResults = await page.evaluate(async () => {
      const results = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } });
      return results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }));
    });
    assert.deepEqual(accessibilityResults, [], `Automated accessibility violations at ${width}px`);
    await page.screenshot({ path: fileURLToPath(new URL(`terms-${width}.png`, outputDirectory)), fullPage: false });
    console.log(`PASS: Terms of Use, all 43 paragraphs, navigation and layout at ${width}px`);
  }

  await page.goto(`${baseURL}/legal/terms`);
  await page.waitForURL("**/terms-of-use");
  assert.equal(await page.getByRole("heading", { name: "Terms of Use", level: 1 }).count(), 1);
  await page.goto(`${baseURL}/terms-of-use`);
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), "Skip to main content");
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement.id), "main-content");
  const accessibility = page.getByRole("button", { name: "Accessibility options", exact: true });
  await accessibility.click();
  assert.equal(await accessibility.getAttribute("aria-expanded"), "true");
  await page.keyboard.press("Escape");
  assert.equal(await accessibility.getAttribute("aria-expanded"), "false");
  assert.equal(await accessibility.evaluate(element => document.activeElement === element), true, "Widget returns keyboard focus to its trigger");
  const missing = await page.goto(`${baseURL}/legal/not-a-real-document`);
  assert.equal(missing.status(), 404);
  assert.deepEqual(errors, [], "No browser runtime errors");
  console.log("PASS: old Terms URL redirects; unknown legal document returns 404; no runtime errors");
} finally {
  await browser.close();
}
