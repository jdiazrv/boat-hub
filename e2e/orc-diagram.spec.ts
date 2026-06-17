/**
 * Visual inspection: ORC rig diagram in boat detail → Dimensiones tab
 */
import { test, expect, type Page } from "@playwright/test";

const EMAIL    = "jdiazrv@me.com";
const PASSWORD = "maxfile";
const BOAT_NAME = "REWIND";   // use REWIND which has full ORC data

async function login(page: Page) {
  await page.goto("/");
  await page.waitForSelector('input[type="email"]', { timeout: 20_000 });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForSelector(".sidebar", { timeout: 30_000 });
}

async function openBoatDetail(page: Page, boatName: string) {
  await page.goto("/boats");
  await page.waitForSelector(".panel-card", { timeout: 15_000 });
  const card = page.locator(".panel-card").filter({ hasText: boatName }).first();
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.click();
  await page.waitForSelector(".boat-detail-page", { timeout: 10_000 });
}

test("ORC diagram renders correctly in Dimensiones tab", async ({ page }) => {
  await login(page);
  await openBoatDetail(page, BOAT_NAME);

  // Click Dimensiones tab
  const dimTab = page.locator(".tab-btn").filter({ hasText: /Dimensiones/i }).first();
  await dimTab.click();
  await page.waitForTimeout(600);

  // SVG should be present
  const svg = page.locator("svg[aria-label='Diagrama aparejo ORC']").first();
  await expect(svg).toBeVisible({ timeout: 8_000 });

  // Screenshot of just the diagram section
  await page.screenshot({
    path: "e2e/screenshots/orc-diagram-full.png",
    fullPage: false,
  });

  // Also screenshot just the SVG element
  await svg.screenshot({ path: "e2e/screenshots/orc-diagram-svg.png" });

  // Basic structure checks
  // Mast line
  await expect(svg.locator("line").first()).toBeVisible();
  // Has dimension text (P, IG labels)
  const svgText = await svg.textContent();
  expect(svgText).toContain("P");
  expect(svgText).toContain("IG");
  expect(svgText).toContain("LOA");
  expect(svgText).toContain("J");
  expect(svgText).toContain("E");
});
