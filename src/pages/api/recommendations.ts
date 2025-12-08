import type { APIRoute } from "astro";
import { z } from "zod";
import type { RecommendationDto } from "../../types";
import {
  RecommendationsService,
  InsufficientRatingsError,
  DailyLimitExceededError,
  AIResponseParsingError,
} from "../../lib/services/recommendations.service";
import { MoviesService } from "../../lib/services/movies.service";

export const prerender = false;

/**
 * Validation schema for the request body.
 */
const GenerateRecommendationsSchema = z.object({
  prompt: z
    .string()
    .max(500, {
      message: "Prompt cannot exceed 500 characters",
    })
    .optional(),
});

/**
 * POST /api/recommendations
 *
 * Generates personalized movie recommendations for the authenticated user.
 *
 * Request body:
 * - prompt (optional): User's additional context or preferences (max 500 chars)
 *
 * Responses:
 * - 200: Success - returns array of 5 recommendations
 * - 400: Bad Request - invalid JSON or validation error
 * - 401: Unauthorized - user not authenticated
 * - 403: Forbidden - user has less than 10 ratings
 * - 429: Too Many Requests - daily limit exceeded
 * - 500: Internal Server Error - AI or database error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = Date.now();

  try {
    // 1. Parse and validate JSON body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Validate schema
    const validation = GenerateRecommendationsSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid request data",
          details: validation.error.flatten(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Get authenticated user from middleware
    const user = locals.user;

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;

    // 4. Verify OpenRouter API key is configured
    const openRouterApiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      console.error("[recommendations] OPENROUTER_API_KEY not configured");
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Service temporarily unavailable",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 5. Generate recommendations using the service
    const dailyLimit = parseInt(import.meta.env.DAILY_RECOMMENDATION_LIMIT || "10");
    const recommendationsService = new RecommendationsService(dailyLimit);

    const aiRecommendations = await recommendationsService.generateRecommendations(
      userId,
      validation.data.prompt,
      locals.supabase,
      openRouterApiKey
    );

    // 6. Enrich recommendations with TMDb data (poster paths)
    const tmdbApiKey = import.meta.env.TMDB_API_KEY;
    if (!tmdbApiKey) {
      console.error("[recommendations] TMDB_API_KEY not configured");
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Service temporarily unavailable",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const moviesService = new MoviesService(tmdbApiKey);

    // Fetch movie details in parallel for all recommendations
    // IMPORTANT: We search by title and year because AI-generated TMDb IDs are often incorrect
    const enrichedRecommendations: RecommendationDto[] = await Promise.all(
      aiRecommendations.map(async (rec) => {
        try {
          // Search for the correct movie by title and year
          const movieDetails = await moviesService.findMovieByTitleAndYear(rec.title, rec.year);

          if (!movieDetails) {
            console.warn(`[recommendations] No TMDb match found for "${rec.title}" (${rec.year})`);
            return {
              ...rec,
              posterPath: null,
            };
          }

          // Use the correct TMDb ID from the search result
          return {
            tmdb_id: movieDetails.tmdb_id,
            title: movieDetails.title,
            year: rec.year,
            posterPath: movieDetails.posterPath,
          };
        } catch (error) {
          // If search fails, return recommendation without poster and original data
          console.error(`[recommendations] Failed to search for "${rec.title}" (${rec.year}):`, error);
          return {
            ...rec,
            posterPath: null,
          };
        }
      })
    );

    // 7. Success - return enriched recommendations
    const duration = Date.now() - startTime;
    console.log(`[recommendations] Request completed in ${duration}ms for user ${userId}`);

    return new Response(
      JSON.stringify({
        data: enrichedRecommendations,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    // Handle known business errors
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

    // Handle unexpected errors
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
};
