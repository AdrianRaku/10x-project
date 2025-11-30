import type { MovieSearchResultDto } from "../../types";

/**
 * Response structure from TMDb API for movie search.
 * Contains only the fields we need from the external API.
 */
interface TMDbSearchResponse {
  results: {
    id: number;
    title: string;
    poster_path: string | null;
    release_date: string;
  }[];
}

export class MoviesService {
  private readonly TMDB_API_BASE_URL = "https://api.themoviedb.org/3";
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("TMDb API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Searches for movies using the TMDb API.
   * Acts as a proxy to hide the API key from the client.
   *
   * @param query - The search query string
   * @returns Array of movie search results
   * @throws Error if the TMDb API request fails
   */
  async searchMovies(query: string): Promise<MovieSearchResultDto[]> {
    if (!query || query.trim().length === 0) {
      throw new Error("Search query cannot be empty");
    }

    // Construct the TMDb API URL
    const url = new URL(`${this.TMDB_API_BASE_URL}/search/movie`);
    url.searchParams.append("api_key", this.apiKey);
    url.searchParams.append("query", query.trim());
    url.searchParams.append("language", "pl-PL");

    // Make the request to TMDb API
    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch (error) {
      throw new Error(`Failed to connect to TMDb API: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    // Check if the response is successful
    if (!response.ok) {
      throw new Error(`TMDb API returned error status: ${response.status} ${response.statusText}`);
    }

    // Parse the response
    let data: TMDbSearchResponse;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error(`Failed to parse TMDb API response: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    // Map TMDb results to our DTO format
    return data.results.map((movie) => ({
      tmdb_id: movie.id,
      title: movie.title,
      posterPath: movie.poster_path,
      releaseDate: movie.release_date,
    }));
  }
}
