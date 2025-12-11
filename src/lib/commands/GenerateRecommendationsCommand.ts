import type { RecommendationDto } from "../../types";
import type { SupabaseClient } from "../../db/supabase.client";
import {
  RecommendationsService,
  InsufficientRatingsError,
  DailyLimitExceededError,
  AIResponseParsingError,
} from "../services/recommendations.service";
import { MoviesService } from "../services/movies.service";

/**
 * Parameters for generating recommendations.
 */
export interface GenerateRecommendationsParams {
  userId: string;
  prompt?: string;
  dailyLimit: number;
  openRouterApiKey: string;
  tmdbApiKey: string;
}

/**
 * Result of recommendation generation.
 */
export interface GenerateRecommendationsResult {
  recommendations: RecommendationDto[];
  duration: number;
}

/**
 * Command for generating movie recommendations.
 * Implements Command Pattern for encapsulating business logic.
 */
export class GenerateRecommendationsCommand {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Executes the recommendation generation command.
   */
  async execute(params: GenerateRecommendationsParams): Promise<GenerateRecommendationsResult> {
    const startTime = Date.now();

    // 1. Generate AI recommendations
    const recommendationsService = new RecommendationsService(params.dailyLimit);
    const aiRecommendations = await recommendationsService.generateRecommendations(
      params.userId,
      params.prompt,
      this.supabase,
      params.openRouterApiKey
    );

    // 2. Enrich with TMDb data
    const moviesService = new MoviesService(params.tmdbApiKey);
    const enrichedRecommendations = await this.enrichWithTMDbData(aiRecommendations, moviesService);

    const duration = Date.now() - startTime;

    return {
      recommendations: enrichedRecommendations,
      duration,
    };
  }

  /**
   * Enriches AI recommendations with TMDb poster data.
   */
  private async enrichWithTMDbData(
    recommendations: RecommendationDto[],
    moviesService: MoviesService
  ): Promise<RecommendationDto[]> {
    return Promise.all(
      recommendations.map(async (rec) => {
        try {
          const movieDetails = await moviesService.findMovieByTitleAndYear(rec.title, rec.year);

          if (!movieDetails) {
            console.warn(`[recommendations] No TMDb match found for "${rec.title}" (${rec.year})`);
            return { ...rec, posterPath: null };
          }

          return {
            tmdb_id: movieDetails.tmdb_id,
            title: movieDetails.title,
            year: rec.year,
            posterPath: movieDetails.posterPath,
          };
        } catch (error) {
          console.error(`[recommendations] Failed to search for "${rec.title}" (${rec.year}):`, error);
          return { ...rec, posterPath: null };
        }
      })
    );
  }
}

/**
 * Error handler for recommendations command.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class RecommendationsErrorHandler {
  /**
   * Handles known business errors and returns appropriate HTTP response.
   */
  static handleError(error: unknown, duration: number): Response {
    if (error instanceof InsufficientRatingsError) {
      console.log(`[recommendations] Insufficient ratings after ${duration}ms`);
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "You must have at least 10 rated movies to generate recommendations",
          details: {
            currentRatingsCount: error.currentCount,
            requiredRatingsCount: error.requiredCount,
          },
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof DailyLimitExceededError) {
      console.log(`[recommendations] Daily limit exceeded after ${duration}ms`);
      return new Response(
        JSON.stringify({
          error: "Too Many Requests",
          message: "Daily recommendation limit exceeded. Please try again tomorrow.",
          details: {
            dailyLimit: error.dailyLimit,
            requestsToday: error.requestsToday,
            resetTime: error.resetTime.toISOString(),
          },
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof AIResponseParsingError) {
      console.error(`[recommendations] AI parsing error after ${duration}ms:`, error.message);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to process AI response. Please try again.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.error(`[recommendations] Unexpected error after ${duration}ms:`, {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to generate recommendations. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
