import type { APIRoute } from "astro";
import { z } from "zod";
import { validateRequest, requireAuth } from "../../lib/middleware/validation.middleware";
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
 * GET /api/lists - Refactored with middleware pattern
 */
export const GET: APIRoute = async (context) => {
  // 1. Validate authentication
  const authResult = requireAuth(context);
  if (!authResult.success) {
    return authResult.response;
  }

  // 2. Fetch user's lists
  try {
    const userListsService = new UserListsService();
    const lists = await userListsService.getUserLists(authResult.userId, context.locals.supabase);

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
 * POST /api/lists - Refactored with middleware pattern
 */
export const POST: APIRoute = async (context) => {
  // 1. Validate authentication
  const authResult = requireAuth(context);
  if (!authResult.success) {
    return authResult.response;
  }

  // 2. Validate request body
  const validationResult = await validateRequest(addMovieToListSchema)(context);
  if (!validationResult.success) {
    return validationResult.response;
  }

  // 3. Add movie to list
  try {
    const userListsService = new UserListsService();
    const result = await userListsService.addMovieToList(
      validationResult.data,
      authResult.userId,
      context.locals.supabase
    );

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

    console.error("Error adding movie to list:", error);

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

