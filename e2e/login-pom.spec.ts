import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';

test.describe('Login Page - Using Page Object Model', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('displays all required elements', async () => {
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
  });

  test('can fill login form', async () => {
    await loginPage.emailInput.fill('test@example.com');
    await loginPage.passwordInput.fill('password123');

    await expect(loginPage.emailInput).toHaveValue('test@example.com');
    await expect(loginPage.passwordInput).toHaveValue('password123');
  });

  test('can navigate to register page', async ({ page }) => {
    await loginPage.navigateToRegister();
    await expect(page).toHaveURL(/\/register/);
  });

  test('password field is masked', async () => {
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });
});
