/**
 * Simple in-memory cache service.
 * In production, consider using Redis or similar.
 */
export class CacheService {
  private cache = new Map<string, { data: unknown; expiresAt: number }>();

  /**
   * Gets a value from cache.
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Sets a value in cache with TTL in seconds.
   */
  async set(key: string, data: unknown, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Clears all cache entries.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clears expired entries (garbage collection).
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}
