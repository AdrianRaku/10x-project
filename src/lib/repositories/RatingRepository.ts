import type { SupabaseClient } from "../../db/supabase.client";
/**
 * Represents a user's rating for a movie.
 */
export interface UserRating {
  tmdb_id: number;
  rating: number;
}
/**
 * Repository for managing movie ratings data access.
 * Implements Repository Pattern for clean separation of data layer.
 */
export class RatingRepository {
  constructor(private supabase: SupabaseClient) {}
  /**
   * Retrieves user's rating history from the database.
   * 
   * @param userId - The authenticated user's ID
   * @returns Array of user's ratings ordered by creation date (newest first)
   */
  async getUserRatings(userId: string): Promise<UserRating[]> {
    const { data, error } = await this.supabase
      .from("ratings")
      .select("tmdb_id, rating")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      throw error;
    }
    return data || [];
  }
  /**
   * Counts how many ratings a user has.
   * 
   * @param userId - The authenticated user's ID
   * @returns Number of ratings the user has
   */
  async getRatingsCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("ratings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if (error) {
      throw error;
    }
    return count || 0;
  }
}
