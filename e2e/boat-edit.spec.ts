/**
 * E2E: Edit all boat data sections for ENJOY (owner_admin role)
 * Covers: General info, Identificadores, Dimensiones (5 subtabs), Tanques
 */
import { test, expect, type Page } from "@playwright/test";

const EMAIL = "jdiazrv@me.com";
const PASSWORD = "maxfile";
const BOAT_NAME = "ENJOY";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto("/");
  await page.waitForSelector('input[type="email"]', { timeout: 20_000 });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  // Wait for app shell sidebar
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

async function openTab(page: Page, label: string) {
  const tabBtn = page.locator(".boat-detail-page .tab-btn").filter({ hasText: label }).first();
  await tabBtn.click();
  await page.waitForTimeout(500);
}

async function openModal(page: Page, btnTitle: string) {
  await page.locator(`button[title="${btnTitle}"]`).first().click();
  // Modal uses class modal-backdrop / modal-box
  await page.waitForSelector(".modal-backdrop", { timeout: 10_000 });
  await page.waitForTimeout(300);
}

async function saveModal(page: Page) {
  // Primary save button inside the modal body
  await page.locator(".modal-box .btn-primary").last().click();
  await page.waitForSelector(".modal-backdrop", { state: "hidden", timeout: 20_000 });
  await page.waitForTimeout(600);
}

async function switchModalTab(page: Page, label: string) {
  await page.locator(".modal-box .tab-btn").filter({ hasText: label }).first().click();
  await page.waitForTimeout(400);
}

async function fillByLabel(page: Page, labelText: string, value: string) {
  const container = page.locator(".modal-box label")
    .filter({ hasText: new RegExp(labelText, "i") }).first();
  const input = container.locator("input, textarea").first();
  await input.clear();
  await input.fill(value);
}

async function selectByLabel(page: Page, labelText: string, value: string) {
  const container = page.locator(".modal-box label")
    .filter({ hasText: new RegExp(labelText, "i") }).first();
  await container.locator("select").first().selectOption(value);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Boat data editing — ENJOY", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await openBoatDetail(page, BOAT_NAME);
  });

  // ── 1. General — datos básicos del barco ─────────────────────────────────
  test("1. General — editar datos básicos del barco", async ({ page }) => {
    await openTab(page, "General");

    // Confirm edit button is visible
    const editBtn = page.locator('button[title="Editar datos del barco"]');
    await expect(editBtn).toBeVisible({ timeout: 5_000 });
    await editBtn.click();
    await page.waitForSelector(".modal-backdrop", { timeout: 10_000 });
    await page.waitForTimeout(300);

    // Edit propulsion field (always present)
    const propulsionLabel = page.locator(".modal-box label").filter({ hasText: /Propulsión/i }).first();
    if (await propulsionLabel.isVisible()) {
      await propulsionLabel.locator("input, select").first().fill("Motor + Vela");
    }

    // Edit notes textarea if present
    const textarea = page.locator(".modal-box textarea").first();
    if (await textarea.isVisible()) {
      await textarea.fill("Test e2e — notas actualizadas");
    }

    await saveModal(page);
    await expect(page.locator(".boat-detail-page")).toBeVisible();
    console.log("✓ General datos básicos OK");
  });

  // ── 2. General — identificadores internacionales ──────────────────────────
  test("2. General — editar identificadores internacionales", async ({ page }) => {
    await openTab(page, "General");
    await openModal(page, "Editar identificadores internacionales");

    await fillByLabel(page, "MMSI", "224123456");
    await fillByLabel(page, "Indicativo", "EA3RDW");

    await saveModal(page);
    await expect(page.locator(".boat-detail-page")).toBeVisible();
    // Verify saved value visible
    await expect(page.locator("text=224123456")).toBeVisible({ timeout: 8_000 });
    console.log("✓ Identificadores OK");
  });

  // ── 3. Dimensiones — subtab Casco ────────────────────────────────────────
  test("3. Dimensiones — subtab Casco", async ({ page }) => {
    await openTab(page, "Dimensiones");
    await openModal(page, "Editar dimensiones");

    await expect(page.locator(".modal-box .tab-btn.active")).toContainText("Casco");

    await fillByLabel(page, "Diseñador", "Judel/Vrolijk");
    await fillByLabel(page, "Constructor", "Dehler");
    await fillByLabel(page, "Fecha de serie", "01/2006");
    await fillByLabel(page, "Construcción del casco", "Cored");
    await fillByLabel(page, "LOA", "14.265");
    await fillByLabel(page, "Manga máxima", "4.168");
    await fillByLabel(page, "Calado", "2.463");
    await fillByLabel(page, "Desplazamiento", "14213");
    await fillByLabel(page, "Tipo hélice", "Folding 3 blades");
    await fillByLabel(page, "Diámetro hélice", "0.500");
    await fillByLabel(page, "Peso máximo", "650");
    await fillByLabel(page, "Peso mínimo", "488");

    await saveModal(page);
    await expect(page.locator("text=Judel/Vrolijk")).toBeVisible({ timeout: 8_000 });
    console.log("✓ Dimensiones Casco OK");
  });

  // ── 4. Dimensiones — subtab Aparejo ──────────────────────────────────────
  test("4. Dimensiones — subtab Aparejo", async ({ page }) => {
    await openTab(page, "Dimensiones");
    await openModal(page, "Editar dimensiones");
    await switchModalTab(page, "Aparejo");

    await fillByLabel(page, "^P —", "18.700");
    await fillByLabel(page, "^E —", "6.120");
    await fillByLabel(page, "IG —", "19.800");
    await fillByLabel(page, "ISP —", "19.800");
    await fillByLabel(page, "J —", "5.450");
    await fillByLabel(page, "BAS —", "1.810");
    await fillByLabel(page, "TPS —", "6.800");
    await fillByLabel(page, "Pares de barraganetes", "3");
    await selectByLabel(page, "Palo de carbono", "true");
    await selectByLabel(page, "Enrollador foque", "true");
    await selectByLabel(page, "Enrollador mayor", "false");

    await saveModal(page);
    await expect(page.locator(".boat-detail-page")).toBeVisible();
    console.log("✓ Dimensiones Aparejo OK");
  });

  // ── 5. Dimensiones — subtab Superficies ──────────────────────────────────
  test("5. Dimensiones — subtab Superficies", async ({ page }) => {
    await openTab(page, "Dimensiones");
    await openModal(page, "Editar dimensiones");
    await switchModalTab(page, "Superficies");

    await fillByLabel(page, "Mayor", "64.60");
    await fillByLabel(page, "Génova", "66.23");
    await fillByLabel(page, "Spinnaker", "179.41");

    await saveModal(page);
    // Use first() to avoid strict mode violation (value may appear in multiple places)
    await expect(page.locator("text=64.6").first()).toBeVisible({ timeout: 8_000 });
    console.log("✓ Dimensiones Superficies OK");
  });

  // ── 6. Dimensiones — subtab Velas ────────────────────────────────────────
  test("6. Dimensiones — subtab Velas (inventario)", async ({ page }) => {
    await openTab(page, "Dimensiones");
    await openModal(page, "Editar dimensiones");
    await switchModalTab(page, "Velas");

    // Add a new sail
    await page.locator(".modal-box button").filter({ hasText: "+ Añadir vela" }).click();
    await page.waitForTimeout(400);

    // Fill the last sail card
    const cards = page.locator(".modal-box .boat-detail-section");
    const last = cards.last();
    await last.locator("label").filter({ hasText: "Nombre" }).locator("input").fill("Foque tormenta E2E");
    await last.locator("select").first().selectOption("storm_jib");
    await last.locator("label").filter({ hasText: "Área" }).locator("input").fill("19.82");

    await saveModal(page);
    await expect(page.locator(".boat-detail-page")).toBeVisible();
    console.log("✓ Dimensiones Velas OK");
  });

  // ── 7. Polares — tab propio ──────────────────────────────────────────────
  test("7. Polares — tab propio y edición", async ({ page }) => {
    await openTab(page, "Polares");
    await openModal(page, "Editar polares");

    await page.locator(".modal-box label").filter({ hasText: /Velocidades de viento/i })
      .locator("input").fill("6,8,10,12,14,16,20");
    await page.locator(".modal-box label").filter({ hasText: /Ángulos de ceñida/i })
      .locator("input").fill("43.8,41.8,40.6,39.6,39.0,38.8,38.7");
    await page.locator(".modal-box label").filter({ hasText: /VMG ceñida/i })
      .locator("input").fill("3.82,4.65,5.22,5.55,5.71,5.81,5.88");
    await page.locator(".modal-box label").filter({ hasText: /VMG popa/i })
      .locator("input").fill("4.03,5.11,6.04,6.74,7.17,7.54,8.46");
    await page.locator(".modal-box label").filter({ hasText: /Ángulos de popa/i })
      .locator("input").fill("143.3,146.9,148.7,149.6,150.5,170.0,176.3");

    // Add a polar row
    await page.locator(".modal-box button").filter({ hasText: "+ Añadir fila TWA" }).click();
    await page.waitForTimeout(300);

    await page.locator(".modal-box label").filter({ hasText: /TWA \(°\)/i })
      .last().locator("input").fill("90");
    await page.locator(".modal-box label").filter({ hasText: /Velocidades \(kt/i })
      .last().locator("input").fill("6.37,7.44,8.08,8.46,8.74,8.98,9.36");

    await saveModal(page);
    await expect(page.locator(".boat-detail-page")).toBeVisible();
    console.log("✓ Dimensiones Polares OK");
  });

  // ── 8. Tanques ────────────────────────────────────────────────────────────
  test("8. Tanques — editar tanque existente y añadir uno nuevo", async ({ page }) => {
    await openTab(page, "Tanques");
    await openModal(page, "Editar tanques");

    // Edit first existing tank's capacity if there is one.
    const firstCard = page.locator(".modal-box .boat-detail-section").first();
    const firstCapacity = firstCard.locator('input[type="number"]').first();
    if (await firstCapacity.count()) {
      await firstCapacity.clear();
      await firstCapacity.fill("270");
    }

    // Add a new tank
    await page.locator(".modal-box button").filter({ hasText: "+ Añadir tanque" }).click();
    await page.waitForTimeout(500);

    // The new (last) card — fill by position within that card
    const cards = page.locator(".modal-box .boat-detail-section");
    const newCard = cards.last();

    // "Nombre" is the first text input in the card (not number type)
    const textInputs = newCard.locator('input:not([type="number"])');
    await textInputs.first().fill("Agua potable E2E");

    // "Tipo" select is the first select in the card
    await newCard.locator("select").first().selectOption("fresh_water");

    // Capacity is the first number input in the card
    await newCard.locator('input[type="number"]').first().fill("200");

    await saveModal(page);
    await expect(page.locator(".boat-detail-page")).toBeVisible();
    console.log("✓ Tanques OK");
  });
});
