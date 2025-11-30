/**
 * Health check endpoint to verify middleware and Supabase connection
 *
 * @endpoint GET /api/health
 */

import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Check if Supabase client is available from middleware
    if (!locals.supabase) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Supabase client not available in locals",
          middleware: "not working"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Test database connection by querying ratings table
    const { data, error } = await locals.supabase
      .from("ratings")
      .select("count")
      .limit(1);

    if (error) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Database connection failed",
          error: error.message,
          middleware: "working",
          database: "not reachable"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "healthy",
        message: "All systems operational",
        middleware: "working",
        database: "connected",
        supabase_client_type: typeof locals.supabase,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Unexpected error",
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
