import { type Page, type Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly form: Locator;
  readonly emailInput: Locator;
  readonly emailError: Locator;
  readonly passwordInput: Locator;
  readonly passwordError: Locator;
  readonly submitButton: Locator;
  readonly formError: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /witaj ponownie/i });
    this.form = page.getByTestId("login-form");
    this.emailInput = page.getByTestId("login-email-input");
    this.emailError = page.getByTestId("login-email-error");
    this.passwordInput = page.getByTestId("login-password-input");
    this.passwordError = page.getByTestId("login-password-error");
    this.submitButton = page.getByTestId("login-submit-button");
    this.formError = page.getByTestId("login-form-error");
    this.registerLink = page.getByRole("link", { name: /zarejestruj się/i });
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    // Wait for form to be ready and hydrated
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });
    await this.page.waitForTimeout(500); // Wait for React hydration

    // Click and type email (simulates real user interaction)
    await this.emailInput.click();
    await this.emailInput.clear();
    await this.emailInput.pressSequentially(email, { delay: 50 });

    // Click and type password
    await this.passwordInput.click();
    await this.passwordInput.clear();
    await this.passwordInput.pressSequentially(password, { delay: 50 });

    // Submit form
    await this.submitButton.click();
  }

  async navigateToRegister() {
    await this.registerLink.click();
  }

  async waitForFormError() {
    await this.formError.waitFor({ state: "visible" });
  }

  async getFormErrorText(): Promise<string> {
    return (await this.formError.textContent()) || "";
  }
}
