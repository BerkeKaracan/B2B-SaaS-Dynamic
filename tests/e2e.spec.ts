import { test, expect } from "@playwright/test";

test("Live Vercel Application Health Check", async ({ page }) => {
  await page.goto("https://b2-b-saa-s-dynamic.vercel.app/login");

  const body = page.locator("body");
  await expect(body).toBeVisible();
});
