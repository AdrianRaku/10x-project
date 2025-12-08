import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({
          message: error.message || "Nie udało się wylogować",
        }),
        { status: 400 }
      );
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: "Wystąpił błąd podczas wylogowywania",
      }),
      { status: 500 }
    );
  }
};
