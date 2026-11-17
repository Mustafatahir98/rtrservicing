import assert from "node:assert/strict";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import axe from "axe-core";

const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const output = new URL("../.private-review/privacy-notices/", import.meta.url);
mkdirSync(output, { recursive: true });
const normalize = value => value.replace(/\s+/g, " ").trim();
const plain = nodes => nodes.map(node => typeof node === "string" ? node : plain(node.children)).join("");
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const variant of ["affiliate", "non-affiliate"]) {
    const notice = JSON.parse(readFileSync(new URL(`../app/_privacy-notices/${variant}.json`, import.meta.url), "utf8"));
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      const response = await page.goto(`${baseURL}/privacy-notice-${variant}`);
      assert.equal(response.status(), 200);
      await page.getByRole("heading", { name: notice.title, exact: true, level: 1 }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.locator("main header img").evaluate(image => image.decode());
      assert.equal(await page.locator("h1").count(), 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "Page fits viewport; only table scrolls");
      for (const section of notice.sections) {
        const region = page.locator(`#${section.id}`);
        if (section.kind === "facts") {
          assert.deepEqual((await region.locator("dt").allTextContents()).map(normalize), section.rows.map(row => row.label));
          assert.deepEqual((await region.locator("dd").allTextContents()).map(normalize), section.rows.map(row => normalize(plain(row.content))));
        } else if (section.kind === "sharing") {
          assert.equal(await region.locator('thead th[scope="col"]').count(), 3);
          assert.equal(await region.locator('tbody th[scope="row"]').count(), 7);
          assert.deepEqual((await region.locator("tbody th").allTextContents()).map(normalize), section.rows.map(row => normalize(plain(row.reason))));
          assert.deepEqual((await region.locator("tbody td").allTextContents()).map(normalize), section.rows.flatMap(row => [row.shares, row.limit]));
          assert.deepEqual(section.rows.map(row => row.shares), variant === "affiliate" ? Array(7).fill("Yes") : ["Yes", ...Array(6).fill("No")]);
          if (width <= 640) {
            const scroll = region.getByRole("region", { name: "Information sharing table" });
            await scroll.focus();
            await page.keyboard.press("ArrowRight");
            await page.waitForFunction(() => document.activeElement.scrollLeft > 0);
          }
        } else {
          assert.deepEqual((await region.locator(":scope > p").allTextContents()).map(normalize), section.paragraphs.map(nodes => normalize(plain(nodes))));
        }
      }
      assert.equal(await page.getByRole("contentinfo").getByRole("link", { name: notice.title, exact: true }).getAttribute("href"), `/privacy-notice-${variant}`);
      const pdf = page.getByRole("link", { name: "Printer-friendly version (PDF)", exact: true });
      assert.equal(await pdf.getAttribute("href"), notice.pdf);
      const file = await page.request.get(new URL(notice.pdf, baseURL).href);
      assert.equal((await file.body()).subarray(0, 5).toString(), "%PDF-");
      await page.addScriptTag({ content: axe.source });
      const violations = await page.evaluate(async () => {
        const result = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } });
        return result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }));
      });
      assert.deepEqual(violations, [], `${variant} accessibility at ${width}px`);
      await page.evaluate(() => { document.activeElement.blur(); window.scrollTo({ top: 0, behavior: "instant" }); });
      await page.screenshot({ path: fileURLToPath(new URL(`${variant}-${width}.png`, output)), fullPage: false });
      console.log(`PASS: ${variant} source content, sharing choices, PDF, footer, keyboard table and accessibility at ${width}px`);
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
