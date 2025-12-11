import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { getTestCredentials } from "./helpers/test-credentials";

test.describe("Login Debug - Troubleshooting", () => {
  test("debug: check login flow and credentials", async ({ page }) => {
    const credentials = getTestCredentials();
    const loginPage = new LoginPage(page);

    console.log("Test credentials loaded:");
    console.log("- Username:", credentials.username);
    console.log("- Password:", credentials.password ? "***SET***" : "NOT SET");

    // Navigate to login page
    await loginPage.goto();
    console.log("Current URL after goto:", page.url());

    // Check if form elements are visible
    const emailVisible = await loginPage.emailInput.isVisible().catch(() => false);
    const passwordVisible = await loginPage.passwordInput.isVisible().catch(() => false);
    const submitVisible = await loginPage.submitButton.isVisible().catch(() => false);

    console.log("Form elements visibility:");
    console.log("- Email input:", emailVisible);
    console.log("- Password input:", passwordVisible);
    console.log("- Submit button:", submitVisible);

    if (!emailVisible || !passwordVisible) {
      console.log("⚠️  Form elements not found! Check data-test-id attributes");

      // Try alternative selectors
      const emailById = await page
        .locator("#email")
        .isVisible()
        .catch(() => false);
      const passwordById = await page
        .locator("#password")
        .isVisible()
        .catch(() => false);
      console.log("Alternative selectors (by ID):");
      console.log("- Email #email:", emailById);
      console.log("- Password #password:", passwordById);
    }

    // Fill in credentials
    await loginPage.login(credentials.username, credentials.password);
    console.log("Login form submitted");

    // Wait a bit and check for errors
    await page.waitForTimeout(3000);

    // Check if still on login page (indicates error)
    const currentUrl = page.url();
    console.log("Current URL after login:", currentUrl);

    // Check for error messages
    const hasFormError = await loginPage.formError.isVisible().catch(() => false);
    console.log("Form error visible:", hasFormError);

    if (hasFormError) {
      const errorText = await loginPage.getFormErrorText();
      console.log("❌ LOGIN ERROR MESSAGE:", errorText);
    } else {
      console.log("ℹ️  No form error message displayed");
    }

    // Check for validation errors
    const hasEmailError = await loginPage.emailError.isVisible().catch(() => false);
    const hasPasswordError = await loginPage.passwordError.isVisible().catch(() => false);

    if (hasEmailError) {
      const emailError = await loginPage.emailError.textContent();
      console.log("❌ Email validation error:", emailError);
    }

    if (hasPasswordError) {
      const passwordError = await loginPage.passwordError.textContent();
      console.log("❌ Password validation error:", passwordError);
    }

    // Check if redirected away from login
    const isStillOnLogin = currentUrl.includes("/login");
    console.log("Still on login page:", isStillOnLogin);

    if (!isStillOnLogin) {
      console.log("✓ Login successful - redirected to:", currentUrl);
    } else {
      console.log("✗ Login failed - still on login page");

      // Take a screenshot for debugging
      await page.screenshot({ path: "login-debug-failure.png", fullPage: true });
      console.log("Screenshot saved to: login-debug-failure.png");
    }

    // This test is for debugging only, always pass
    expect(true).toBe(true);
  });

  test("debug: check if .env.test is loaded", async () => {
    console.log("\n=== Environment Variables Check ===");
    console.log("E2E_USERNAME:", process.env.E2E_USERNAME || "NOT SET");
    console.log("E2E_PASSWORD:", process.env.E2E_PASSWORD ? "SET" : "NOT SET");
    console.log("===================================\n");

    expect(process.env.E2E_USERNAME).toBeDefined();
    expect(process.env.E2E_PASSWORD).toBeDefined();
  });
});
