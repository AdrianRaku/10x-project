import { type Page, type Locator } from "@playwright/test";
import { MovieRatingComponent } from "./movie-rating.component";

export class MovieCardComponent {
  readonly page: Page;
  readonly tmdbId: number;
  readonly card: Locator;
  readonly link: Locator;
  readonly title: Locator;
  readonly year: Locator;
  readonly rating: MovieRatingComponent;

  constructor(page: Page, tmdbId: number) {
    this.page = page;
    this.tmdbId = tmdbId;
    this.card = page.getByTestId(`movie-card-${tmdbId}`);
    this.link = this.card.getByTestId("movie-card-link");
    this.title = this.card.getByRole("heading");
    this.year = this.card.locator('[class*="CardDescription"]');
    this.rating = new MovieRatingComponent(page, this.card);
  }

  async clickCard() {
    await this.link.click();
  }

  async getTitle(): Promise<string> {
    return (await this.title.textContent()) || "";
  }

  async getYear(): Promise<string> {
    return (await this.year.textContent()) || "";
  }

  async rateMovie(rating: number) {
    // Check if already rated
    const wasRated = await this.rating.hasRating();

    await this.rating.openRatingDialog();
    await this.rating.selectRating(rating);
    await this.rating.submitRating();

    // Wait for the rating to be saved to the server
    await this.page.waitForTimeout(1000);

    return { wasAlreadyRated: wasRated };
  }

  async isVisible(): Promise<boolean> {
    return await this.card.isVisible();
  }

  async waitForVisible() {
    await this.card.waitFor({ state: "visible" });
  }
}
