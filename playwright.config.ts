import { defineConfig, devices } from "@playwright/test"

/**
 * End-to-end tests against the local stack: `pnpm db:start`, `pnpm db:reset`, `pnpm seed:demo`,
 * `pnpm dev`, then `pnpm test:e2e`.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
