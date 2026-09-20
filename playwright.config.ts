import { readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// The e2e/smoke tests create records ("Codex smoke marina …", "Test e2e …"). Those were
// found in the production database, so refuse to run against it by accident. Point
// VITE_SUPABASE_URL at a separate Supabase project (staging) in .env.local, or set
// E2E_ALLOW_PROD=1 to override on purpose.
const PROD_SUPABASE_REF = "baovynyqzjbbzroyoeod";
function configuredSupabaseUrl(): string {
  if (process.env.VITE_SUPABASE_URL) return process.env.VITE_SUPABASE_URL;
  for (const file of [".env.local", ".env"]) {
    try {
      const m = /^VITE_SUPABASE_URL=(.*)$/m.exec(readFileSync(file, "utf8"));
      if (m) return m[1].trim();
    } catch { /* file not present */ }
  }
  return "";
}
if (configuredSupabaseUrl().includes(PROD_SUPABASE_REF) && process.env.E2E_ALLOW_PROD !== "1") {
  throw new Error(
    "Refusing to run e2e tests against the production Supabase project. " +
      "Use a staging project, or set E2E_ALLOW_PROD=1 if you really mean it.",
  );
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    headless: false,
    viewport: { width: 1400, height: 900 },
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
