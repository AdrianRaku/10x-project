import { type Page, type Locator } from "@playwright/test";
import { MovieSearchComponent } from "../components/movie-search.component";
import { RecommendationGeneratorComponent } from "../components/recommendation-generator.component";

export class MainPage {
  readonly page: Page;
  readonly movieSearch: MovieSearchComponent;
  readonly recommendationGenerator: RecommendationGeneratorComponent;

  // Header elements
  readonly heading: Locator;
  readonly ratingsCountMessage: Locator;
  readonly ratingsCount: Locator;
  readonly recommendationsLockedMessage: Locator;
  readonly ratingsThreshold: Locator;
  readonly ratingsProgressBar: Locator;
  readonly ratingsProgressFill: Locator;
  readonly ratingsProgressText: Locator;

  // Recommendations section
  readonly recommendationsSection: Locator;
  readonly recommendationsNewBadge: Locator;
  readonly recommendationsGeneratorContainer: Locator;
  readonly recommendationsResults: Locator;
  readonly recommendationsList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.movieSearch = new MovieSearchComponent(page);
    this.recommendationGenerator = new RecommendationGeneratorComponent(page);

    // Header elements
    this.heading = page.getByRole("heading", { level: 1 });
    this.ratingsCountMessage = page.getByTestId("ratings-count-message");
    this.ratingsCount = page.getByTestId("ratings-count");
    this.recommendationsLockedMessage = page.getByTestId("recommendations-locked-message");
    this.ratingsThreshold = page.getByTestId("ratings-threshold");
    this.ratingsProgressBar = page.getByTestId("ratings-progress-bar");
    this.ratingsProgressFill = page.getByTestId("ratings-progress-fill");
    this.ratingsProgressText = page.getByTestId("ratings-progress-text");

    // Recommendations section
    this.recommendationsSection = page.getByTestId("recommendations-section");
    this.recommendationsNewBadge = page.getByTestId("recommendations-new-badge");
    this.recommendationsGeneratorContainer = page.getByTestId("recommendations-generator-container");
    this.recommendationsResults = page.getByTestId("recommendations-results");
    this.recommendationsList = page.getByTestId("recommendations-list");
  }

  async goto() {
    await this.page.goto("/");
  }

  async isRecommendationsUnlocked(): Promise<boolean> {
    return await this.recommendationsSection.isVisible();
  }

  async isRecommendationsLocked(): Promise<boolean> {
    return await this.recommendationsLockedMessage.isVisible();
  }

  async getRatingsProgress(): Promise<{ current: number; total: number }> {
    const text = await this.ratingsProgressText.textContent();
    const [current, total] = text?.split("/").map((n) => parseInt(n.trim())) || [0, 0];
    return { current, total };
  }

  async getRatingsCount(): Promise<number> {
    const text = await this.ratingsCount.textContent();
    return parseInt(text || "0");
  }

  async getRatingsThreshold(): Promise<number> {
    const text = await this.ratingsThreshold.textContent();
    return parseInt(text || "0");
  }

  async waitForRecommendationsToUnlock() {
    // The ratings count is server-rendered, so we need to reload to get updated count
    await this.page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
    await this.page.waitForTimeout(1000); // Wait for content to stabilize

    // Check current state for debugging
    const isStillLocked = await this.recommendationsLockedMessage.isVisible().catch(() => false);
    if (isStillLocked) {
      const progress = await this.getRatingsProgress();
      throw new Error(`Recommendations still locked after reload. Progress: ${progress.current}/${progress.total}`);
    }

    // Now wait for recommendations section to appear
    await this.recommendationsSection.waitFor({ state: "visible", timeout: 10000 });
  }

  async getRecommendationsCount(): Promise<number> {
    const cards = await this.recommendationsList.locator('[data-test-id^="movie-card-"]').count();
    return cards;
  }
}
