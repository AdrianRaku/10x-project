import type { MovieSearchResultDto } from "../../types";
import { TMDbClient } from "./tmdb/TMDbClient";
import { MovieClient } from "./tmdb/MovieClient";
import { CacheService } from "./CacheService";

/**
 * Movies Service using Facade Pattern.
 * Provides a simplified interface to TMDb API operations.
 */
export class MoviesService {
  private readonly movieClient: MovieClient;

  constructor(apiKey: string, cache?: CacheService) {
    const tmdbClient = new TMDbClient(apiKey, cache);
    this.movieClient = new MovieClient(tmdbClient);
  }

  /**
   * Searches for movies using the TMDb API.
   */
  async searchMovies(query: string): Promise<MovieSearchResultDto[]> {
    return this.movieClient.search(query);
  }

  /**
   * Fetches movie details from TMDb API by movie ID.
   */
  async getMovieDetails(tmdbId: number): Promise<MovieSearchResultDto> {
    return this.movieClient.getDetails(tmdbId);
  }

  /**
   * Searches for a movie by title and year, and returns the best match.
   */
  async findMovieByTitleAndYear(title: string, year: number): Promise<MovieSearchResultDto | null> {
    return this.movieClient.findByTitleAndYear(title, year);
  }
}
