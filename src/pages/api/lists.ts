/**
 * @fileoverview API Endpoint for User Lists
 *
 * @endpoint GET /api/lists - Get all user's lists
 * @endpoint POST /api/lists - Add a movie to a list
 * @description Manages user's movie lists (watchlist and favorites).
 *
 * @requestBody (POST)
 * {
 *   "tmdb_id": number,  // The Movie Database ID (positive integer)
 *   "list_type": string // List type ('watchlist' or 'favorite')
 * }
 *
 * @responses
 * GET:
 * - 200 OK: Returns user's lists
 * - 401 Unauthorized: User is not authenticated
 * - 500 Internal Server Error: Unexpected server error
 *
 * POST:
 * - 201 Created: Movie added to list
 * - 400 Bad Request: Invalid input data
 * - 401 Unauthorized: User is not authenticated
 * - 409 Conflict: Movie already in list
 * - 422 Unprocessable Entity: Database constraint violation
 * - 500 Internal Server Error: Unexpected server error
 *
 * @example Success (GET)
 * GET /api/lists
 * Response: 200 OK
 * {
 *   "data": {
 *     "watchlist": [
 *       { "tmdb_id": 456, "created_at": "2025-11-20T10:00:00Z" }
 *     ],
 *     "favorite": [
 *       { "tmdb_id": 789, "created_at": "2025-11-19T10:00:00Z" }
 *     ]
 *   }
 * }
 *
 * @example Success (POST)
 * POST /api/lists
 * Body: { "tmdb_id": 456, "list_type": "watchlist" }
 * Response: 201 Created
 * {
 *   "data": {
 *     "tmdb_id": 456,
 *     "list_type": "watchlist",
 *     "created_at": "2025-11-21T11:00:00Z"
 *   }
 * }
 *
 * @security
 * - Requires authentication via middleware (Astro.locals.user)
 * - RLS policies ensure users can only access their own lists
 * - Input validation via Zod schema
 */

import type { APIRoute } from "astro";
import { z } from "zod";

import { UserListsService } from "../../lib/services/user-lists.service";

export const prerender = false;

/**
 * Zod schema for validating the POST request body.
 */
const addMovieToListSchema = z.object({
  tmdb_id: z.number().int().positive({
    message: "tmdb_id must be a positive integer",
  }),
  list_type: z.enum(["watchlist", "favorite"], {
    errorMap: () => ({ message: "list_type must be either 'watchlist' or 'favorite'" }),
  }),
});

/**
 * GET handler for retrieving all user's lists.
 *
 * @param locals - Astro locals containing Supabase client
 * @returns JSON response with user's lists
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get authenticated user from middleware
    const user = locals.user;

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "User not authenticated",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Fetch user's lists
    const userListsService = new UserListsService();
    const lists = await userListsService.getUserLists(user.id, locals.supabase);

    return new Response(
      JSON.stringify({
        data: lists,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/lists:", error);
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
 * POST handler for adding a movie to a list.
 *
 * @param request - Astro API request object
 * @param locals - Astro locals containing Supabase client
 * @returns JSON response with added movie data
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
  const validationResult = addMovieToListSchema.safeParse(body);

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

  // Get authenticated user from middleware
  const user = locals.user;

  if (!user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "User not authenticated",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Add movie to list
  try {
    const userListsService = new UserListsService();
    const result = await userListsService.addMovieToList(validationResult.data, user.id, locals.supabase);

    return new Response(
      JSON.stringify({
        data: result,
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Handle database constraint violations
    if (error && typeof error === "object" && "code" in error) {
      const pgError = error as { code: string; message: string };

      // PostgreSQL unique constraint violation (duplicate entry)
      if (pgError.code === "23505") {
        return new Response(
          JSON.stringify({
            error: "Conflict",
            message: "Movie already exists in this list",
          }),
          {
            status: 409,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // PostgreSQL check constraint violation
      if (pgError.code === "23514") {
        return new Response(
          JSON.stringify({
            error: "Unprocessable Entity",
            message: "Data does not meet database constraints",
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
    console.error("Error adding movie to list:", error);

    // Return generic server error
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
