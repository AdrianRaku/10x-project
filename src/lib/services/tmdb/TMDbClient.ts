import { HttpClient } from "../HttpClient";
import { CacheService } from "../CacheService";

/**
 * Client for interacting with TMDb API.
 * Implements Facade Pattern with caching support.
 */
export class TMDbClient {
  private readonly TMDB_API_BASE_URL = "https://api.themoviedb.org/3";
  private readonly http: HttpClient;
  private readonly cache: CacheService;
  private readonly apiKey: string;

  constructor(apiKey: string, cache?: CacheService) {
    if (!apiKey) {
      throw new Error("TMDb API key is required");
    }
    this.apiKey = apiKey;
    this.http = new HttpClient();
    this.cache = cache || new CacheService();
  }

  /**
   * Performs a GET request to TMDb API with caching.
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    // Build cache key
    const cacheKey = `tmdb:${endpoint}:${JSON.stringify(params || {})}`;

    // Check cache
    const cached = await this.cache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build URL
    const url = new URL(`${this.TMDB_API_BASE_URL}${endpoint}`);
    url.searchParams.append("api_key", this.apiKey);
    url.searchParams.append("language", "pl-PL");

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value);
      }
    }

    // Fetch data
    const data = await this.http.get<T>(url.toString());

    // Cache for 1 hour
    await this.cache.set(cacheKey, data, 3600);

    return data;
  }
}
