import { type Page, type Locator } from "@playwright/test";
import { MovieCardComponent } from "./movie-card.component";

export class MovieSearchComponent {
  readonly page: Page;
  readonly container: Locator;
  readonly searchInput: Locator;
  readonly loadingIndicator: Locator;
  readonly errorMessage: Locator;
  readonly noResultsMessage: Locator;
  readonly resultsContainer: Locator;
  private ratedMovieIds = new Set<number>();

  // Diverse movie search queries that are likely to return different movies
  private readonly diverseSearchQueries = [
    "Inception",
    "Interstellar",
    "Avatar",
    "Titanic",
    "Gladiator",
    "Forrest Gump",
    "Pulp Fiction",
    "Fight Club",
    "Dark Knight",
    "Godfather",
    "Shawshank",
    "Schindler",
    "Lord of the Rings",
    "Star Wars",
    "Jurassic Park",
    "Django Unchained",
    "Inglourious Basterds",
    "Goodfellas",
    "Prestige",
    "Departed",
    "Green Mile",
    "Seven",
    "Silence of the Lambs",
    "American Beauty",
    "Usual Suspects",
    "Memento",
    "Leon Professional",
    "Saving Private Ryan",
    "Terminator",
    "Alien",
    "Blade Runner",
    "Die Hard",
    "Predator",
    "Rocky",
    "Rambo",
    "Indiana Jones",
    "Back to the Future",
    "Ghostbusters",
    "Top Gun",
    "Mission Impossible",
  ];

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId("movie-search");
    this.searchInput = page.getByTestId("movie-search-input");
    this.loadingIndicator = page.getByTestId("movie-search-loading");
    this.errorMessage = page.getByTestId("movie-search-error");
    this.noResultsMessage = page.getByTestId("movie-search-no-results");
    this.resultsContainer = page.getByTestId("movie-search-results");
  }

  async search(query: string) {
    // Clear first to ensure we start fresh
    await this.searchInput.clear();
    // Type to properly trigger React onChange events
    await this.searchInput.pressSequentially(query, { delay: 50 });
  }

  async clearSearch() {
    await this.searchInput.clear();
    // Wait for results to be cleared
    await this.resultsContainer.waitFor({ state: "detached", timeout: 2000 }).catch(() => {
      // Ignore timeout - results may already be cleared
    });
  }

  async waitForResults() {
    // Wait for either results, error, or no results message
    // This will resolve as soon as any of these conditions is met
    try {
      await Promise.race([
        this.resultsContainer.waitFor({ state: "attached", timeout: 15000 }),
        this.errorMessage.waitFor({ state: "attached", timeout: 15000 }),
        this.noResultsMessage.waitFor({ state: "attached", timeout: 15000 }),
      ]);
    } catch {
      // Log current state for debugging
      const isLoading = await this.isLoading();
      const hasError = await this.hasError();
      const hasNoResults = await this.hasNoResults();
      throw new Error(
        `Search did not complete. State: loading=${isLoading}, error=${hasError}, noResults=${hasNoResults}`
      );
    }
  }

  async waitForLoading() {
    await this.loadingIndicator.waitFor({ state: "visible" });
  }

  async waitForSuccessfulResults() {
    // Wait for either loading to appear or results to appear immediately
    await Promise.race([
      this.loadingIndicator.waitFor({ state: "visible", timeout: 3000 }).catch(() => {
        // Ignore - may load instantly
      }),
      this.resultsContainer.waitFor({ state: "attached", timeout: 3000 }).catch(() => {
        // Ignore - may still be loading
      }),
      this.page.waitForTimeout(1000), // Minimum wait for debounce + network
    ]);

    // Now wait for search to complete - results should be visible
    await this.resultsContainer.waitFor({ state: "visible", timeout: 15000 });

    // Ensure loading is done
    await this.loadingIndicator.waitFor({ state: "detached", timeout: 2000 }).catch(() => {
      // Ignore - loading may already be done
    });
  }

  async isLoading(): Promise<boolean> {
    return await this.loadingIndicator.isVisible();
  }

  async hasResults(): Promise<boolean> {
    return await this.resultsContainer.isVisible();
  }

  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async hasNoResults(): Promise<boolean> {
    return await this.noResultsMessage.isVisible();
  }

  async getResultsCount(): Promise<number> {
    return await this.resultsContainer.locator('[data-test-id^="movie-card-"]').count();
  }

  async getMovieCard(tmdbId: number): Promise<MovieCardComponent> {
    return new MovieCardComponent(this.page, tmdbId);
  }

  async getFirstMovieCard(): Promise<MovieCardComponent> {
    const firstCard = this.resultsContainer.locator('[data-test-id^="movie-card-"]').first();
    await firstCard.waitFor({ state: "visible", timeout: 5000 });
    const testId = await firstCard.getAttribute("data-test-id");
    const tmdbId = parseInt(testId?.replace("movie-card-", "") || "0");

    if (!tmdbId || tmdbId === 0) {
      throw new Error("Failed to extract movie ID from first card");
    }

    return new MovieCardComponent(this.page, tmdbId);
  }

  async getAllMovieCards(): Promise<MovieCardComponent[]> {
    const cards = await this.resultsContainer.locator('[data-test-id^="movie-card-"]').all();
    const movieCards: MovieCardComponent[] = [];

    for (const card of cards) {
      const testId = await card.getAttribute("data-test-id");
      const tmdbId = parseInt(testId?.replace("movie-card-", "") || "0");
      movieCards.push(new MovieCardComponent(this.page, tmdbId));
    }

    return movieCards;
  }

  async searchAndWaitForResults(query: string) {
    await this.search(query);

    // Wait for network request to complete
    const response = await this.page.waitForResponse(
      (response) => response.url().includes("/api/movies/search") && response.status() === 200,
      { timeout: 15000 }
    );

    // Check if we got results
    const json = await response.json();
    if (!json.data || json.data.length === 0) {
      // Don't throw error, just log it - let the test try another movie
      console.log(`Search for "${query}" returned no results, will try another`);
      return; // Return early, searchAndGetUnratedMovie will handle this
    }

    // Wait for results to be rendered
    await this.resultsContainer.waitFor({ state: "visible", timeout: 5000 });

    // Verify we have at least one movie card
    const count = await this.getResultsCount();
    if (count === 0) {
      throw new Error(`Search for "${query}" rendered no movie cards`);
    }
  }

  /**
   * Search for and return an unrated movie card.
   * Uses diverse search queries and tracks rated movies to avoid duplicates.
   */
  async searchAndGetUnratedMovie(index: number): Promise<MovieCardComponent> {
    const query = this.diverseSearchQueries[index % this.diverseSearchQueries.length];

    try {
      await this.searchAndWaitForResults(query);
    } catch (error) {
      throw new Error(`Search failed for "${query}": ${error.message}`);
    }

    // Check if results are visible
    const hasResults = await this.resultsContainer.isVisible().catch(() => false);
    if (!hasResults) {
      throw new Error(`No results container visible for "${query}"`);
    }

    // Get all movie cards from results
    const cards = await this.getAllMovieCards();

    if (cards.length === 0) {
      throw new Error(`No movie cards found for "${query}"`);
    }

    // Find first unrated movie
    for (const card of cards) {
      if (!this.ratedMovieIds.has(card.tmdbId)) {
        this.ratedMovieIds.add(card.tmdbId);
        return card;
      }
    }

    throw new Error(`All ${cards.length} movies in search results for "${query}" have already been rated`);
  }

  /**
   * Mark a movie as rated (useful when rating movies outside this component)
   */
  markAsRated(tmdbId: number) {
    this.ratedMovieIds.add(tmdbId);
  }
}
