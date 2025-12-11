import type { SupabaseClient } from "../../db/supabase.client";
import type { RecommendationDto } from "../../types";
import { RatingRepository } from "../repositories/RatingRepository";
import { RecommendationRequestRepository } from "../repositories/RecommendationRequestRepository";
import { AIRecommendationStrategy } from "./recommendations/strategies/AIRecommendationStrategy";

// ============================================================================
// Custom Error Classes
// ============================================================================

/**
 * Error thrown when user has insufficient ratings to generate recommendations.
 */
export class InsufficientRatingsError extends Error {
  constructor(
    public currentCount: number,
    public requiredCount = 10
  ) {
    super(`User has only ${currentCount} ratings, minimum ${requiredCount} required`);
    this.name = "InsufficientRatingsError";
  }
}

/**
 * Error thrown when user exceeds daily recommendation limit.
 */
export class DailyLimitExceededError extends Error {
  constructor(
    public dailyLimit: number,
    public requestsToday: number,
    public resetTime: Date
  ) {
    super(`Daily limit of ${dailyLimit} requests exceeded`);
    this.name = "DailyLimitExceededError";
  }
}

// Re-export AIResponseParsingError for backward compatibility
export { AIResponseParsingError } from "./recommendations/strategies/AIRecommendationStrategy";

// ============================================================================
// RecommendationsService (Refactored)
// ============================================================================

/**
 * Service responsible for generating AI-powered movie recommendations.
 * Refactored to use Strategy, Repository, and Builder patterns.
 */
export class RecommendationsService {
  private readonly MINIMUM_RATINGS = 10;
  private readonly DAILY_LIMIT: number;

  constructor(dailyLimit?: number) {
    this.DAILY_LIMIT = dailyLimit || 10;
  }

  /**
   * Generates personalized movie recommendations for a user.
   *
   * @param userId - The authenticated user's ID
   * @param prompt - Optional user prompt for additional context
   * @param supabase - Supabase client instance
   * @param openRouterApiKey - OpenRouter API key
   * @returns Array of 5 movie recommendations
   * @throws {InsufficientRatingsError} When user has less than 10 ratings
   * @throws {DailyLimitExceededError} When daily limit is exceeded
   * @throws {AIResponseParsingError} When AI response is invalid
   */
  async generateRecommendations(
    userId: string,
    prompt: string | undefined,
    supabase: SupabaseClient,
    openRouterApiKey: string
  ): Promise<RecommendationDto[]> {
    // 1. Initialize repositories
    const ratingRepository = new RatingRepository(supabase);
    const requestRepository = new RecommendationRequestRepository(supabase);

    // 2. Validate user has enough ratings and check daily limit
    await this.validateUserEligibility(userId, ratingRepository, requestRepository);

    // 3. Generate recommendations using AI strategy
    const strategy = new AIRecommendationStrategy(supabase, openRouterApiKey);
    const recommendations = await strategy.generate(userId, prompt);

    // 4. Log the request
    await requestRepository.logRequest(userId);

    return recommendations;
  }

  /**
   * Validates that user is eligible for recommendations.
   */
  private async validateUserEligibility(
    userId: string,
    ratingRepository: RatingRepository,
    requestRepository: RecommendationRequestRepository
  ): Promise<void> {
    // Fetch data in parallel
    const [ratingsCount, requestsCount] = await Promise.all([
      ratingRepository.getRatingsCount(userId),
      requestRepository.getRequestsCountToday(userId),
    ]);

    // Check minimum ratings requirement
    if (ratingsCount < this.MINIMUM_RATINGS) {
      throw new InsufficientRatingsError(ratingsCount, this.MINIMUM_RATINGS);
    }

    // Check daily limit
    if (requestsCount >= this.DAILY_LIMIT) {
      const resetTime = new Date();
      resetTime.setUTCHours(24, 0, 0, 0);
      throw new DailyLimitExceededError(this.DAILY_LIMIT, requestsCount, resetTime);
    }
  }
}
