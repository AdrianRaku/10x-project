import type { APIRoute } from "astro";
import { z } from "zod";
import { validateRequest, requireAuth } from "../../lib/middleware/validation.middleware";
import {
  GenerateRecommendationsCommand,
  RecommendationsErrorHandler,
} from "../../lib/commands/GenerateRecommendationsCommand";

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
 * Refactored endpoint using Command Pattern and middleware.
 */
export const POST: APIRoute = async (context) => {
  const startTime = Date.now();

  try {
    // 1. Validate authentication
    const authResult = requireAuth(context);
    if (!authResult.success) {
      return authResult.response;
    }

    // 2. Validate request body
    const validationResult = await validateRequest(GenerateRecommendationsSchema)(context);
    if (!validationResult.success) {
      return validationResult.response;
    }

    // 3. Verify API keys are configured
    const openRouterApiKey = import.meta.env.OPENROUTER_API_KEY;
    const tmdbApiKey = import.meta.env.TMDB_API_KEY;

    if (!openRouterApiKey || !tmdbApiKey) {
      console.error("[recommendations] API keys not configured");
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

    // 4. Execute command
    const dailyLimit = parseInt(import.meta.env.DAILY_RECOMMENDATION_LIMIT || "10");
    const command = new GenerateRecommendationsCommand(context.locals.supabase);

    const result = await command.execute({
      userId: authResult.userId,
      prompt: validationResult.data.prompt,
      dailyLimit,
      openRouterApiKey,
      tmdbApiKey,
    });

    console.log(`[recommendations] Request completed in ${result.duration}ms for user ${authResult.userId}`);

    return new Response(
      JSON.stringify({
        data: result.recommendations,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    return RecommendationsErrorHandler.handleError(error, duration);
  }
};

