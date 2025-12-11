import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu e-mail"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate request body
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          message: result.error.errors[0].message,
        }),
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Attempt to sign in with Supabase
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          message: "Nieprawidłowe dane logowania",
        }),
        { status: 401 }
      );
    }

    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      { status: 200 }
    );
  } catch {
    return new Response(
      JSON.stringify({
        message: "Wystąpił błąd podczas logowania",
      }),
      { status: 500 }
    );
  }
};
