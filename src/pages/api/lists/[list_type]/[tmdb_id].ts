/**
 * @fileoverview API Endpoint for Removing Movies from Lists
 *
 * @endpoint DELETE /api/lists/:list_type/:tmdb_id - Remove a movie from a list
 * @description Removes a movie from a specified user list.
 *
 * @params
 * - list_type: 'watchlist' or 'favorite'
 * - tmdb_id: The Movie Database ID (positive integer)
 *
 * @responses
 * - 204 No Content: Movie successfully removed
 * - 400 Bad Request: Invalid parameters
 * - 401 Unauthorized: User is not authenticated
 * - 404 Not Found: Movie not found in list
 * - 500 Internal Server Error: Unexpected server error
 *
 * @example Success
 * DELETE /api/lists/watchlist/456
 * Response: 204 No Content
 *
 * @security
 * - Requires authentication via middleware (Astro.locals.user)
 * - RLS policies ensure users can only remove from their own lists
 */

import type { APIRoute } from "astro";
import { z } from "zod";

import { UserListsService } from "../../../../lib/services/user-lists.service";

export const prerender = false;

/**
 * Zod schema for validating URL parameters.
 */
const paramsSchema = z.object({
  list_type: z.enum(["watchlist", "favorite"], {
    errorMap: () => ({ message: "list_type must be either 'watchlist' or 'favorite'" }),
  }),
  tmdb_id: z.string().transform((val, ctx) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "tmdb_id must be a positive integer",
      });
      return z.NEVER;
    }
    return parsed;
  }),
});

/**
 * DELETE handler for removing a movie from a list.
 *
 * @param params - URL parameters (list_type, tmdb_id)
 * @param locals - Astro locals containing Supabase client
 * @returns Empty response with 204 status or error response
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  // Validate URL parameters
  const validationResult = paramsSchema.safeParse(params);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        message: "Invalid parameters",
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

  const { list_type, tmdb_id } = validationResult.data;

  // Remove movie from list
  try {
    // First, check if the movie exists in the list
    const { data: existingEntry, error: checkError } = await locals.supabase
      .from("user_lists")
      .select("id")
      .eq("user_id", user.id)
      .eq("tmdb_id", tmdb_id)
      .eq("list_type", list_type)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (!existingEntry) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Movie not found in this list",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Perform deletion
    const userListsService = new UserListsService();
    await userListsService.removeMovieFromList(tmdb_id, list_type, user.id, locals.supabase);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error("Error removing movie from list:", error);

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
