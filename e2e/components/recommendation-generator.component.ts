import { type Page, type Locator } from '@playwright/test';

export class RecommendationGeneratorComponent {
  readonly page: Page;
  readonly container: Locator;
  readonly form: Locator;
  readonly promptInput: Locator;
  readonly usageCounter: Locator;
  readonly generateButton: Locator;
  readonly errorMessage: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId('recommendation-generator');
    this.form = page.getByTestId('recommendation-form');
    this.promptInput = page.getByTestId('recommendation-prompt-input');
    this.usageCounter = page.getByTestId('recommendations-usage-counter');
    this.generateButton = page.getByTestId('generate-recommendations-button');
    this.errorMessage = page.getByTestId('recommendation-error');
    this.loadingIndicator = page.getByTestId('recommendation-loading');
  }

  async generateRecommendations(prompt?: string) {
    if (prompt) {
      await this.promptInput.fill(prompt);
    }
    await this.generateButton.click();
  }

  async fillPrompt(prompt: string) {
    await this.promptInput.fill(prompt);
  }

  async clearPrompt() {
    await this.promptInput.clear();
  }

  async clickGenerate() {
    await this.generateButton.click();
  }

  async waitForRecommendations() {
    // Wait for loading to start (with timeout in case it's too fast)
    await this.loadingIndicator.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {
      console.log('Loading indicator did not appear (might be too fast)');
    });

    // Wait for loading to finish (with timeout in case API is slow)
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {
      console.log('Loading indicator did not disappear within 30s');
    });

    // Extra wait for results to render
    await this.page.waitForTimeout(1000);
  }

  async isLoading(): Promise<boolean> {
    return await this.loadingIndicator.isVisible();
  }

  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async getErrorText(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  async isButtonDisabled(): Promise<boolean> {
    return await this.generateButton.isDisabled();
  }

  async isButtonEnabled(): Promise<boolean> {
    return await this.generateButton.isEnabled();
  }

  async getUsageCount(): Promise<{ used: number; limit: number }> {
    const text = await this.usageCounter.textContent();
    const match = text?.match(/Wykorzystano: (\d+) \/ (\d+)/);
    if (match) {
      return {
        used: parseInt(match[1]),
        limit: parseInt(match[2]),
      };
    }
    return { used: 0, limit: 0 };
  }

  async hasReachedLimit(): Promise<boolean> {
    const { used, limit } = await this.getUsageCount();
    return used >= limit;
  }

  async generateAndWaitForResults(prompt?: string) {
    await this.generateRecommendations(prompt);
    await this.waitForRecommendations();
  }
}
