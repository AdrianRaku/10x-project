import type { SupabaseClient } from "../../db/supabase.client";

/**
 * Repository for managing AI recommendation requests.
 * Tracks when users generate recommendations for rate limiting.
 */
export class RecommendationRequestRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Logs a new recommendation request for a user.
   *
   * @param userId - The user ID making the request
   */
  async logRequest(userId: string): Promise<void> {
    const { error } = await this.supabase.from("ai_recommendation_requests").insert({ user_id: userId });

    if (error) {
      throw new Error(`Failed to log recommendation request: ${error.message}`);
    }
  }

  /**
   * Gets the number of recommendation requests made by a user today.
   *
   * @param userId - The user ID to check
   * @returns The count of requests made today
   */
  async getRequestsCountToday(userId: string): Promise<number> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const { count, error } = await this.supabase
      .from("ai_recommendation_requests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", today.toISOString());

    if (error) {
      throw new Error(`Failed to get request count: ${error.message}`);
    }

    return count ?? 0;
  }
}
