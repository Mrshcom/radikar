import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const useSystemChrome =
  !process.env.CI &&
  (process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === "1" ||
    existsSync("/Applications/Google Chrome.app"));
const browserChannel = useSystemChrome ? "chrome" : undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3161",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "desktop-chromium",
      testIgnore: "**/*.mobile.spec.ts",
      use: { ...devices["Desktop Chrome"], channel: browserChannel },
    },
    {
      name: "mobile-chromium",
      testMatch: "**/*.mobile.spec.ts",
      use: { ...devices["Pixel 7"], channel: browserChannel },
    },
  ],
  webServer: [
    {
      command: "EXPOSE_DEVELOPMENT_OTP=true npm --prefix ../.. run dev:api",
      url: "http://localhost:3162/ready",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "NEXT_PUBLIC_API_BASE_URL=http://localhost:3162 npm run dev",
      url: "http://localhost:3161",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
