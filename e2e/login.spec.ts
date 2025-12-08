import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Logowanie - MyFilms/);
  });

  test('displays login form elements', async ({ page }) => {
    // Check for header
    await expect(page.getByRole('heading', { name: /witaj ponownie/i })).toBeVisible();

    // Check for form inputs
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/hasło/i)).toBeVisible();

    // Check for submit button
    await expect(page.getByRole('button', { name: /zaloguj/i })).toBeVisible();
  });

  test('displays link to registration', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /zarejestruj się/i });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', '/register');
  });

  test('displays error on empty form submission', async ({ page }) => {
    // Click submit button without filling the form
    await page.getByRole('button', { name: /zaloguj/i }).click();

    // Browser validation should prevent submission
    // or form should show validation errors
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeFocused();
  });

  test('navigates to register page when clicking register link', async ({ page }) => {
    await page.getByRole('link', { name: /zarejestruj się/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });
});
