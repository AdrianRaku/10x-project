import type { RecommendationDto } from "../../../../types";

/**
 * Strategy interface for different recommendation algorithms.
 * Implements Strategy Pattern for flexible recommendation generation.
 */
export interface RecommendationStrategy {
  /**
   * Generates movie recommendations for a user.
   *
   * @param userId - The authenticated user's ID
   * @param userPrompt - Optional user prompt for additional context
   * @returns Array of movie recommendations
   */
  generate(userId: string, userPrompt?: string): Promise<RecommendationDto[]>;
}

