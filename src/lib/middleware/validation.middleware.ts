import type { APIContext } from "astro";
import type { z } from "zod";

/**
 * Validation middleware using Zod schema.
 * Returns 400 Bad Request if validation fails.
 */
export const validateRequest = <T extends z.ZodTypeAny>(schema: T) => {
  return async (
    context: APIContext
  ): Promise<{ success: true; data: z.infer<T> } | { success: false; response: Response }> => {
    // Parse JSON body
    let body;
    try {
      body = await context.request.json();
    } catch {
      return {
        success: false,
        response: new Response(
          JSON.stringify({
            error: "Bad Request",
            message: "Invalid JSON in request body",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        ),
      };
    }

    // Validate against schema
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return {
        success: false,
        response: new Response(
          JSON.stringify({
            error: "Bad Request",
            message: "Invalid request data",
            details: validation.error.errors,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        ),
      };
    }

    return { success: true, data: validation.data };
  };
};

/**
 * Authentication middleware.
 * Returns 401 Unauthorized if user is not authenticated.
 */
export const requireAuth = (
  context: APIContext
): { success: true; userId: string } | { success: false; response: Response } => {
  const user = context.locals.user;

  if (!user) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "User not authenticated",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  return { success: true, userId: user.id };
};

