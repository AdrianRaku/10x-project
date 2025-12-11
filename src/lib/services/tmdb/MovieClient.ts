import type { MovieSearchResultDto } from "../../../types";
import { TMDbClient } from "./TMDbClient";

/**
 * Response structure from TMDb API for movie search.
 */
interface TMDbSearchResponse {
  results: {
    id: number;
    title: string;
    poster_path: string | null;
    release_date: string;
  }[];
}

/**
 * Response structure from TMDb API for movie details.
 */
interface TMDbMovieDetailsResponse {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
}

/**
 * Client for movie-related TMDb operations.
 * Part of Facade Pattern implementation.
 */
export class MovieClient {
  constructor(private client: TMDbClient) {}

  /**
   * Searches for movies using the TMDb API.
   */
  async search(query: string): Promise<MovieSearchResultDto[]> {
    if (!query || query.trim().length === 0) {
      throw new Error("Search query cannot be empty");
    }

    const data = await this.client.get<TMDbSearchResponse>("/search/movie", {
      query: query.trim(),
    });

    return data.results.map((movie) => ({
      tmdb_id: movie.id,
      title: movie.title,
      posterPath: movie.poster_path,
      releaseDate: movie.release_date,
    }));
  }

  /**
   * Fetches movie details from TMDb API by movie ID.
   */
  async getDetails(tmdbId: number): Promise<MovieSearchResultDto> {
    if (!tmdbId || tmdbId <= 0) {
      throw new Error("Invalid TMDb ID");
    }

    const data = await this.client.get<TMDbMovieDetailsResponse>(`/movie/${tmdbId}`);

    return {
      tmdb_id: data.id,
      title: data.title,
      posterPath: data.poster_path,
      releaseDate: data.release_date,
    };
  }

  /**
   * Searches for a movie by title and year, and returns the best match.
   */
  async findByTitleAndYear(title: string, year: number): Promise<MovieSearchResultDto | null> {
    if (!title || title.trim().length === 0) {
      throw new Error("Movie title cannot be empty");
    }

    if (!year || year < 1888 || year > 2100) {
      throw new Error("Invalid year");
    }

    const data = await this.client.get<TMDbSearchResponse>("/search/movie", {
      query: title.trim(),
      year: year.toString(),
    });

    if (data.results.length === 0) {
      return null;
    }

    const movie = data.results[0];
    return {
      tmdb_id: movie.id,
      title: movie.title,
      posterPath: movie.poster_path,
      releaseDate: movie.release_date,
    };
  }
}
