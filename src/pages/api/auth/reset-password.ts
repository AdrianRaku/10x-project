import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate request body
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          message: result.error.errors[0].message,
        }),
        { status: 400 }
      );
    }

    const { password } = result.data;

    // Update user password
    const { error } = await locals.supabase.auth.updateUser({
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          message: error.message || "Nie udało się zresetować hasła",
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Hasło zostało pomyślnie zresetowane",
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: "Wystąpił błąd podczas resetowania hasła",
      }),
      { status: 500 }
    );
  }
};
