import { type Page, type Locator, expect } from '@playwright/test';

export class MovieRatingComponent {
  readonly page: Page;
  readonly parent: Locator;
  readonly rateButton: Locator;
  readonly dialog: Locator;
  readonly dialogTitle: Locator;
  readonly starsContainer: Locator;
  readonly selectedRatingDisplay: Locator;
  readonly errorMessage: Locator;
  readonly cancelButton: Locator;
  readonly submitButton: Locator;

  constructor(page: Page, parent: Locator) {
    this.page = page;
    this.parent = parent;
    this.rateButton = parent.getByTestId('rate-movie-button');
    this.dialog = page.getByTestId('rating-dialog');
    this.dialogTitle = this.dialog.getByRole('heading', { name: /oceń film/i });
    this.starsContainer = page.getByTestId('rating-stars-container');
    this.selectedRatingDisplay = page.getByTestId('selected-rating-display');
    this.errorMessage = page.getByTestId('rating-error');
    this.cancelButton = page.getByTestId('rating-cancel-button');
    this.submitButton = page.getByTestId('rating-submit-button');
  }

  async openRatingDialog() {
    await this.rateButton.click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  async closeDialog() {
    await this.cancelButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async selectRating(rating: number) {
    if (rating < 1 || rating > 10) {
      throw new Error('Rating must be between 1 and 10');
    }
    const starButton = this.page.getByTestId(`rating-star-${rating}`);

    // Wait for star to be stable before clicking
    await starButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.page.waitForTimeout(500); // Extra wait for stability

    await starButton.click({ force: true }); // Force click to avoid stability issues
  }

  async submitRating() {
    // Wait for button to be enabled (not disabled)
    await expect(this.submitButton).toBeEnabled({ timeout: 5000 });
    await this.submitButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async rateMovie(rating: number) {
    await this.openRatingDialog();
    await this.selectRating(rating);
    await this.submitRating();
  }

  async getCurrentRating(): Promise<string | null> {
    const buttonText = await this.rateButton.textContent();
    const match = buttonText?.match(/Twoja ocena: (\d+)\/10/);
    return match ? match[1] : null;
  }

  async hasRating(): Promise<boolean> {
    // Wait for button to be stable
    await this.rateButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.page.waitForTimeout(300); // Wait for content to load

    const text = await this.rateButton.textContent();
    return text?.includes('Twoja ocena:') || false;
  }

  async getSelectedRating(): Promise<string> {
    return await this.selectedRatingDisplay.textContent() || '';
  }

  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async getErrorText(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  async isDialogOpen(): Promise<boolean> {
    return await this.dialog.isVisible();
  }

  async waitForSubmitSuccess() {
    await this.dialog.waitFor({ state: 'hidden' });
  }
}
