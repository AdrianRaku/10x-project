import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /witaj ponownie/i });
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/hasło/i);
    this.submitButton = page.getByRole('button', { name: /zaloguj/i });
    this.registerLink = page.getByRole('link', { name: /zarejestruj się/i });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async navigateToRegister() {
    await this.registerLink.click();
  }
}
