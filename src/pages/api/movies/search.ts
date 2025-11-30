import type { APIRoute } from "astro";
import { z } from "zod";

import { MoviesService } from "../../../lib/services/movies.service";

export const prerender = false;

// Zod schema for validating the query parameter
const searchQuerySchema = z.object({
  query: z.string().min(1, { message: "query parameter cannot be empty" }).trim(),
});

export const GET: APIRoute = async ({ url }) => {
  // Extract query parameter from URL
  const queryParam = url.searchParams.get("query");

  // Validate query parameter
  const validationResult = searchQuerySchema.safeParse({ query: queryParam });

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        message: "Missing or invalid query parameter",
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

  // Get TMDb API key from environment
  const tmdbApiKey = import.meta.env.TMDB_API_KEY;

  if (!tmdbApiKey) {
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "TMDB_API_KEY environment variable is not set",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Execute search operation
  try {
    const moviesService = new MoviesService(tmdbApiKey);
    const results = await moviesService.searchMovies(validationResult.data.query);

    return new Response(
      JSON.stringify({
        data: results,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Log unexpected errors
    console.error("Error searching movies:", error);

    // Return generic server error (with details for debugging)
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while searching for movies",
        details: error instanceof Error ? error.message : JSON.stringify(error),
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
