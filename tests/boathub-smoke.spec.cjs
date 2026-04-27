const { test, expect } = require("@playwright/test");

async function login(page) {
  page.on("console", (msg) => console.log("console", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("pageerror", err.message));

  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error("Set E2E_EMAIL and E2E_PASSWORD to run the smoke test.");
  }

  await page.goto("http://127.0.0.1:5174/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/Contrasena|Contraseña|Password/i).fill(password);
  await page.getByRole("button", { name: /Entrar|Sign in/i }).click();
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".sidebar")).toBeVisible({ timeout: 15000 });
}

test("login and inspect navigation", async ({ page }) => {
  await login(page);

  const links = await page.locator("a.nav-link").evaluateAll((nodes) =>
    nodes.map((node) => ({ text: node.textContent?.trim(), href: node.href }))
  );
  console.log("NAV_LINKS", JSON.stringify(links, null, 2));

  const buttons = await page.locator("button").evaluateAll((nodes) =>
    nodes.slice(0, 80).map((node) => node.textContent?.trim() || node.getAttribute("title") || node.getAttribute("aria-label"))
  );
  console.log("BUTTONS", JSON.stringify(buttons, null, 2));
});

test("inspect pages", async ({ page }) => {
  await login(page);

  const paths = [
    "/maintenance",
    "/preventive",
    "/observations",
    "/haul-outs",
    "/future-actions",
    "/purchases",
    "/inventory",
    "/hours",
    "/fuel",
    "/marinas",
    "/shipyards",
    "/systems",
    "/admin/maintenance-templates",
    "/settings",
  ];

  for (const path of paths) {
    await page.goto(`http://127.0.0.1:5174${path}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    const buttons = await page.locator("button").evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.trim() || node.getAttribute("title") || node.getAttribute("aria-label"))
    );
    const labels = await page.locator("label").evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.trim())
    );
    const heads = await page.locator("h2,h3,.empty-state,p.form-error").evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.trim()).filter(Boolean).slice(0, 12)
    );
    console.log("PAGE", path, JSON.stringify({ buttons, labels, heads }, null, 2));
  }
});

async function submitModal(page) {
  await page.locator(".modal-box button[type='submit']").click();
  try {
    await expect(page.locator(".modal-box")).toHaveCount(0, { timeout: 6000 });
    return { ok: true };
  } catch {
    const error = await page.locator(".modal-box .form-error").textContent().catch(() => null);
    await page.screenshot({ path: `test-results/modal-failure-${Date.now()}.png`, fullPage: true }).catch(() => {});
    await page.locator(".modal-close").click({ timeout: 1000 }).catch(() => {});
    await expect(page.locator(".modal-box")).toHaveCount(0, { timeout: 2000 }).catch(() => {});
    return { ok: false, error: error?.trim() || "Modal did not close" };
  }
}

async function selectFirstNonEmpty(page, labelText) {
  const select = page.locator("label", { hasText: labelText }).locator("select");
  const options = await select.locator("option").evaluateAll((nodes) =>
    nodes.map((node) => node.value).filter(Boolean)
  );
  if (options[0]) {
    await select.selectOption(options[0]);
  }
  return Boolean(options[0]);
}

test("create data from each menu", async ({ page }) => {
  test.setTimeout(300000);
  await login(page);
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const results = [];

  async function run(name, path, action) {
    await page.goto(`http://127.0.0.1:5174${path}`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(700);
    try {
      const result = await action();
      results.push({ name, ok: result?.ok !== false, error: result?.error ?? null });
      console.log("CREATE_RESULT", JSON.stringify(results.at(-1)));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ name, ok: false, error: message });
      console.log("CREATE_RESULT", JSON.stringify(results.at(-1)));
    }
  }

  await run("maintenance", "/maintenance", async () => {
    await page.getByRole("button", { name: /\+\s*Nueva tarea/i }).click();
    await page.locator(".picker-row").first().click();
    return submitModal(page);
  });

  await run("observations", "/observations", async () => {
    await page.getByRole("button", { name: /\+\s*Nueva observacion/i }).click();
    await page.getByLabel(/Titulo|Título/i).fill(`Codex smoke observacion ${stamp}`);
    return submitModal(page);
  });

  await run("haul-outs", "/haul-outs", async () => {
    await page.getByRole("button", { name: /\+\s*Nueva varada/i }).click();
    await page.getByLabel(/Nombre/i).fill(`Codex smoke varada ${stamp}`);
    return submitModal(page);
  });

  await run("haul-out item", "/haul-outs", async () => {
    await page.getByText(`Codex smoke varada ${stamp}`).click();
    await page.getByRole("button", { name: /\+\s*Nuevo item|\+\s*Nueva partida|\+\s*Nuevo/i }).click();
    await page.getByLabel(/Titulo|Título/i).fill(`Codex smoke trabajo ${stamp}`);
    return submitModal(page);
  });

  await run("future-actions", "/future-actions", async () => {
    await page.getByRole("button", { name: /\+\s*Nueva accion/i }).click();
    await page.getByLabel(/Titulo|Título/i).fill(`Codex smoke accion ${stamp}`);
    return submitModal(page);
  });

  await run("purchases", "/purchases", async () => {
    await page.getByRole("button", { name: /\+\s*Nueva compra/i }).click();
    await page.getByLabel(/Articulo|Artículo/i).fill(`Codex smoke compra ${stamp}`);
    return submitModal(page);
  });

  await run("inventory", "/inventory", async () => {
    await page.getByRole("button", { name: /\+\s*Añadir elemento/i }).click();
    await page.getByLabel(/Nombre/i).fill(`Codex smoke inventario ${stamp}`);
    return submitModal(page);
  });

  await run("hours", "/hours", async () => {
    await page.getByRole("button", { name: /\+\s*Nuevo registro de horas/i }).click();
    await selectFirstNonEmpty(page, "Contador");
    await page.getByLabel(/Horas/i).fill("123");
    return submitModal(page);
  });

  await run("fuel", "/fuel", async () => {
    await page.getByRole("button", { name: /\+\s*Nuevo repostaje/i }).click();
    await page.getByLabel(/Cantidad/i).fill("50");
    await page.getByLabel(/Proveedor/i).fill(`Codex smoke proveedor ${stamp}`);
    return submitModal(page);
  });

  await run("marinas", "/marinas", async () => {
    await page.getByRole("button", { name: /\+\s*Nueva marina/i }).click();
    await page.getByLabel(/Nombre/i).fill(`Codex smoke marina ${stamp}`);
    return submitModal(page);
  });

  await run("shipyards", "/shipyards", async () => {
    await page.getByRole("button", { name: /\+\s*Nuevo varadero/i }).click();
    await page.getByLabel(/Nombre/i).fill(`Codex smoke varadero ${stamp}`);
    return submitModal(page);
  });

  await run("systems", "/systems", async () => {
    const select = page.locator(".page-header select").first();
    if (await select.count() === 0) return { ok: true, error: "No systems left to add" };
    const options = await select.locator("option").evaluateAll((nodes) =>
      nodes.map((node) => node.value).filter(Boolean)
    );
    if (!options[0]) return { ok: true, error: "No systems left to add" };
    await select.selectOption(options[0]);
    await page.getByRole("button", { name: /^Añadir$/i }).click();
    await page.waitForTimeout(1500);
    const pageError = await page.locator(".form-error, .inline-error").textContent().catch(() => null);
    return pageError ? { ok: false, error: pageError.trim() } : { ok: true };
  });

  const failed = results.filter((result) => !result.ok);
  console.log("CREATE_SUMMARY", JSON.stringify(results, null, 2));
  expect(failed, JSON.stringify(results, null, 2)).toEqual([]);
});
