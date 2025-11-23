import type { AddOrUpdateRatingCommand, RatingDto } from "../../types";
import type { SupabaseClient } from "../../db/supabase.client";

interface UpsertRatingResult {
  rating: RatingDto;
  wasCreated: boolean;
}

export class RatingsService {
  /**
   * Creates a new rating or updates an existing one for a user.
   * Uses Supabase's upsert functionality based on the unique key (user_id, tmdb_id).
   *
   * @param command - The rating data containing tmdb_id and rating value
   * @param userId - The user ID to associate with the rating
   * @param supabase - Supabase client
   * @returns Object containing the rating data and whether it was newly created
   * @throws Error if the operation fails
   */
  async upsertRating(
    command: AddOrUpdateRatingCommand,
    userId: string,
    supabase: SupabaseClient
  ): Promise<UpsertRatingResult> {
    // Perform upsert operation
    const { data, error } = await supabase
      .from("ratings")
      .upsert(
        {
          user_id: userId,
          tmdb_id: command.tmdb_id,
          rating: command.rating,
        },
        {
          onConflict: "user_id,tmdb_id",
        }
      )
      .select("tmdb_id, rating, created_at, updated_at")
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Failed to upsert rating");
    }

    // Determine if the record was created or updated by comparing timestamps
    const wasCreated = data.created_at === data.updated_at;

    // Return the rating DTO and operation status
    return {
      rating: {
        tmdb_id: data.tmdb_id,
        rating: data.rating,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
      wasCreated,
    };
  }
}
