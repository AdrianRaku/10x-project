import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const registerSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu e-mail"),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate request body
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          message: result.error.errors[0].message,
        }),
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Attempt to sign up with Supabase
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Handle specific error cases
      if (error.message.includes("already registered")) {
        return new Response(
          JSON.stringify({
            message: "Ten adres e-mail jest już zarejestrowany",
          }),
          { status: 409 }
        );
      }

      return new Response(
        JSON.stringify({
          message: error.message || "Nie udało się utworzyć konta",
        }),
        { status: 400 }
      );
    }

    // Email confirmation is now required - inform user to check their inbox
    return new Response(
      JSON.stringify({
        message: "Sprawdź swoją skrzynkę email. Wysłaliśmy link aktywacyjny na adres " + email,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: "Wystąpił błąd podczas rejestracji",
      }),
      { status: 500 }
    );
  }
};
