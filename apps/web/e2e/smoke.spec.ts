import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("redirects the root route toward the dashboard/auth flow", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/dashboard|sign-in|sign_in/);
  });
});
