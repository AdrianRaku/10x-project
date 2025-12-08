import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const passwordRecoverySchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu e-mail"),
});

export const POST: APIRoute = async ({ request, locals, url }) => {
  try {
    const body = await request.json();

    // Validate request body
    const result = passwordRecoverySchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          message: result.error.errors[0].message,
        }),
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Construct the redirect URL for password reset
    const redirectUrl = `${url.origin}/password-reset`;

    // Send password recovery email
    const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    // Always return success to prevent user enumeration
    // Even if the email doesn't exist, we return 200
    if (error) {
      console.error("Password recovery error:", error);
    }

    return new Response(
      JSON.stringify({
        message: "Jeśli konto o podanym adresie e-mail istnieje, wysłaliśmy instrukcje resetowania hasła",
      }),
      { status: 200 }
    );
  } catch (error) {
    // Still return success to prevent user enumeration
    console.error("Password recovery exception:", error);
    return new Response(
      JSON.stringify({
        message: "Jeśli konto o podanym adresie e-mail istnieje, wysłaliśmy instrukcje resetowania hasła",
      }),
      { status: 200 }
    );
  }
};
