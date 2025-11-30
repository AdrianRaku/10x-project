/**
 * @fileoverview API Endpoint for Movie Ratings
 *
 * @endpoint POST /api/ratings - Create or update a rating
 * @endpoint GET /api/ratings - Get all ratings for the authenticated user
 * @description Creates a new movie rating or updates an existing one for the authenticated user.
 *              Uses upsert logic to simplify client-side operations.
 *
 * @requestBody
 * {
 *   "tmdb_id": number,  // The Movie Database ID (positive integer)
 *   "rating": number    // User rating (integer between 1-10)
 * }
 *
 * @responses
 * - 201 Created: New rating was created
 * - 200 OK: Existing rating was updated
 * - 400 Bad Request: Invalid input data or malformed JSON
 * - 401 Unauthorized: User is not authenticated
 *   TODO: Currently using DEFAULT_USER_ID for development. Implement proper JWT authentication via middleware.
 * - 422 Unprocessable Entity: Database constraint violation
 * - 500 Internal Server Error: Unexpected server error
 *
 * @example Success (Created)
 * POST /api/ratings
 * Body: { "tmdb_id": 808, "rating": 8 }
 * Response: 201 Created
 * {
 *   "data": {
 *     "tmdb_id": 808,
 *     "rating": 8,
 *     "created_at": "2025-11-28T10:09:41.549719+00:00",
 *     "updated_at": "2025-11-28T10:09:41.549719+00:00"
 *   }
 * }
 *
 * @example Success (Updated)
 * POST /api/ratings
 * Body: { "tmdb_id": 808, "rating": 9 }
 * Response: 200 OK
 * {
 *   "data": {
 *     "tmdb_id": 808,
 *     "rating": 9,
 *     "created_at": "2025-11-28T10:09:41.549719+00:00",
 *     "updated_at": "2025-11-28T10:09:50.883092+00:00"
 *   }
 * }
 *
 * @example Error (Validation)
 * POST /api/ratings
 * Body: { "tmdb_id": -1, "rating": 8 }
 * Response: 400 Bad Request
 * {
 *   "error": "Bad Request",
 *   "message": "Invalid request data",
 *   "details": [...]
 * }
 *
 * @security
 * - Requires authentication
 *   TODO: Currently using DEFAULT_USER_ID for development. Replace with:
 *         const session = await locals.supabase.auth.getSession();
 *         if (!session.data.session) { return 401 Unauthorized }
 *         const userId = session.data.session.user.id;
 * - RLS policies ensure users can only modify their own ratings
 * - Input validation via Zod schema
 * - Database constraints enforce rating range (1-10)
 */

import type { APIRoute } from "astro";
import { z } from "zod";

import { RatingsService } from "../../lib/services/ratings.service";

export const prerender = false;

/**
 * Zod schema for validating the request body.
 * Ensures tmdb_id is a positive integer and rating is between 1-10.
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
 * POST handler for creating or updating a movie rating.
 *
 * @param request - Astro API request object
 * @param locals - Astro locals containing Supabase client
 * @returns JSON response with rating data or error message
 */
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

  // Get default user ID from environment (temporary development solution)
  // TODO: Replace with proper session-based authentication:
  //       const session = await locals.supabase.auth.getSession();
  //       if (!session.data.session) {
  //         return new Response(JSON.stringify({ error: "Unauthorized", message: "User not authenticated" }), { status: 401 });
  //       }
  //       const userId = session.data.session.user.id;
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

    // Log unexpected errors (full details for debugging)
    console.error("Error upserting rating:", error);

    // Return generic server error (without exposing internal details)
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
 * GET handler for retrieving all ratings for the authenticated user.
 *
 * @param locals - Astro locals containing Supabase client
 * @returns JSON response with array of ratings
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get default user ID from environment (temporary development solution)
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

    // Fetch all ratings for the user
    const { data, error } = await locals.supabase
      .from("ratings")
      .select("tmdb_id, rating, created_at, updated_at")
      .eq("user_id", defaultUserId)
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
