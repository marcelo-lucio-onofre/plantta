import { test as base, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const COVERAGE_DIR = join(process.cwd(), ".nyc_output");

/**
 * Grabs whatever the app has accumulated in `window.__coverage__` (Istanbul
 * instrumentation, see vite.config.ts) and writes it to .nyc_output as its
 * own file — nyc merges every file in that directory when reporting.
 *
 * Client-side navigation (react-router) never resets `window.__coverage__`,
 * only a real page load does — so this only needs to run once per test, at
 * the end. A test that does more than one `page.goto()` should call this
 * itself before each reload, or coverage from before that point is lost.
 */
export async function collectCoverage(page: import("@playwright/test").Page) {
  const coverage = await page.evaluate(() => (window as unknown as { __coverage__?: unknown }).__coverage__).catch(() => null);
  if (!coverage) return;
  mkdirSync(COVERAGE_DIR, { recursive: true });
  writeFileSync(join(COVERAGE_DIR, `coverage-${randomUUID()}.json`), JSON.stringify(coverage));
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await use(page);
    await collectCoverage(page);
  },
});

export { expect };
