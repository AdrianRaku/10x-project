import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    testIdAttribute: "data-test-id",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "./scripts/dev-server.sh",
    url: "http://localhost:3000",
    reuseExistingServer: false, // Always restart to get fresh data after cleanup
    timeout: 120 * 1000, // 2 minutes
  },
});
