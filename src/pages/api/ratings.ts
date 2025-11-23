import type { APIRoute } from "astro";
import { z } from "zod";

import { RatingsService } from "../../lib/services/ratings.service";

export const prerender = false;

// Zod schema for validating the request body
const addOrUpdateRatingSchema = z.object({
  tmdb_id: z.number().int().positive({
    message: "tmdb_id must be a positive integer",
  }),
  rating: z.number().int().min(1).max(10, {
    message: "rating must be an integer between 1 and 10",
  }),
});

export const POST: APIRoute = async ({ request, locals }) => {
  // Parse and validate request body
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
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Validate request body against schema
  const validationResult = addOrUpdateRatingSchema.safeParse(body);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        message: "Invalid request data",
        details: validationResult.error.errors,
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Get default user ID from environment
  const defaultUserId = import.meta.env.DEFAULT_USER_ID;

  if (!defaultUserId) {
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "DEFAULT_USER_ID environment variable is not set",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Execute upsert operation
  try {
    const ratingsService = new RatingsService();
    const result = await ratingsService.upsertRating(validationResult.data, defaultUserId, locals.supabase);

    // Return appropriate status code based on operation type
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

      // PostgreSQL check constraint violation
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

    // Log unexpected errors
    console.error("Error upserting rating:", error);

    // Return generic server error (with details for debugging)
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while processing your request",
        details: error instanceof Error ? error.message : JSON.stringify(error, null, 2),
        errorObject: error,
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
