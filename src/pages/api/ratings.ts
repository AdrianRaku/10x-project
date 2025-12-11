import type { APIRoute } from "astro";
import { z } from "zod";
import { validateRequest, requireAuth } from "../../lib/middleware/validation.middleware";
import { RatingsService } from "../../lib/services/ratings.service";

export const prerender = false;

/**
 * Zod schema for validating the request body.
 */
const addOrUpdateRatingSchema = z.object({
  tmdb_id: z.number().int().positive({
    message: "tmdb_id must be a positive integer",
  }),
  rating: z.number().int().min(1).max(10, {
    message: "rating must be an integer between 1 and 10",
  }),
});

/**
 * POST /api/ratings - Refactored with middleware pattern
 */
export const POST: APIRoute = async (context) => {
  // 1. Validate authentication
  const authResult = requireAuth(context);
  if (!authResult.success) {
    return authResult.response;
  }

  // 2. Validate request body
  const validationResult = await validateRequest(addOrUpdateRatingSchema)(context);
  if (!validationResult.success) {
    return validationResult.response;
  }

  // 3. Execute business logic
  try {
    const ratingsService = new RatingsService();
    const result = await ratingsService.upsertRating(validationResult.data, authResult.userId, context.locals.supabase);

    const statusCode = result.wasCreated ? 201 : 200;

    return new Response(
      JSON.stringify({
        data: result.rating,
      }),
      {
        status: statusCode,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Handle database constraint violations
    if (error && typeof error === "object" && "code" in error) {
      const pgError = error as { code: string; message: string };

      if (pgError.code === "23514") {
        return new Response(
          JSON.stringify({
            error: "Unprocessable Entity",
            message: "Rating value does not meet database constraints",
          }),
          {
            status: 422,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    console.error("Error upserting rating:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while processing your request",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

/**
 * GET /api/ratings - Refactored with middleware pattern
 */
export const GET: APIRoute = async (context) => {
  // 1. Validate authentication
  const authResult = requireAuth(context);
  if (!authResult.success) {
    return authResult.response;
  }

  // 2. Fetch ratings
  try {
    const { data, error } = await context.locals.supabase
      .from("ratings")
      .select("tmdb_id, rating, created_at, updated_at")
      .eq("user_id", authResult.userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching ratings:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to fetch ratings",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        data: data || [],
        count: data?.length || 0,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/ratings:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while processing your request",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
