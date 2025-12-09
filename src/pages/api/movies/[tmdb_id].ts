/**
 * @fileoverview API Endpoint for Movie Details
 *
 * @endpoint GET /api/movies/:tmdb_id - Get movie details by TMDb ID
 * @description Fetches movie details from TMDb API by movie ID.
 *              Acts as a proxy to hide the API key.
 *
 * @params
 * - tmdb_id: The Movie Database ID (positive integer)
 *
 * @responses
 * - 200 OK: Returns movie details
 * - 400 Bad Request: Invalid movie ID
 * - 404 Not Found: Movie not found
 * - 500 Internal Server Error: TMDb API error
 *
 * @example Success
 * GET /api/movies/278
 * Response: 200 OK
 * {
 *   "data": {
 *     "tmdb_id": 278,
 *     "title": "The Shawshank Redemption",
 *     "posterPath": "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
 *     "releaseDate": "1994-09-23"
 *   }
 * }
 *
 * @security
 * - No authentication required (public endpoint)
 * - API key is hidden from client
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { MoviesService } from "../../../lib/services/movies.service";

export const prerender = false;

/**
 * Zod schema for validating URL parameters.
 */
const paramsSchema = z.object({
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
 * GET handler for fetching movie details.
 *
 * @param params - URL parameters (tmdb_id)
 * @returns JSON response with movie details
 */
export const GET: APIRoute = async ({ params }) => {
  // Validate URL parameters
  const validationResult = paramsSchema.safeParse(params);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        message: "Invalid movie ID",
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

  const { tmdb_id } = validationResult.data;

  try {
    // Get TMDb API key from environment
    const tmdbApiKey = import.meta.env.TMDB_API_KEY;

    if (!tmdbApiKey) {
      console.error("TMDB_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Movie service is not configured properly",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Fetch movie details from TMDb
    const moviesService = new MoviesService(tmdbApiKey);
    const movie = await moviesService.getMovieDetails(tmdb_id);

    return new Response(
      JSON.stringify({
        data: movie,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(`Error fetching movie details for ID ${tmdb_id}:`, error);

    // Check if it's a 404 error from TMDb
    if (error instanceof Error && error.message.includes("404")) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Movie not found",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to fetch movie details",
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
