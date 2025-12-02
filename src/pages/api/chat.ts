import type { APIRoute } from "astro";
import { OpenRouterService } from "../../lib/services/openrouter.service";
import { z } from "zod";

// Wyłączenie prerenderingu dla API endpoint
export const prerender = false;

// Schemat walidacji dla ciała żądania przychodzącego do naszego API
const ApiRequestSchema = z.object({
  userMessage: z.string(),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const validation = ApiRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: validation.error.flatten() }), {
        status: 400,
      });
    }

    const { userMessage } = validation.data;

    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OpenRouter API key not configured" }), { status: 500 });
    }

    const model = import.meta.env.OPENROUTER_DEFAULT_MODEL || "google/gemini-flash-1.5";

    const openRouterService = new OpenRouterService(apiKey);

    // Przykład użycia z formatowaniem JSON
    const movieSchema = {
      type: "object",
      properties: {
        title: { type: "string", description: "Tytuł filmu." },
        year: { type: "number", description: "Rok produkcji." },
        director: { type: "string", description: "Reżyser filmu." },
      },
      required: ["title", "year", "director"],
    };

    const openRouterRequest = {
      model,
      messages: [
        { role: "system" as const, content: "Jesteś ekspertem od filmów. Odpowiadaj w formacie JSON." },
        { role: "user" as const, content: `Podaj informacje o filmie: ${userMessage}` },
      ],
      response_format: {
        type: "json_schema" as const,
        json_schema: {
          name: "movie_info",
          strict: true,
          schema: movieSchema,
        },
      },
      temperature: 0.7,
    };

    const result = await openRouterService.generateChatCompletion(openRouterRequest);

    // Parsowanie odpowiedzi JSON z contentu
    const content = result.choices[0].message.content;
    const parsedContent = JSON.parse(content);

    return new Response(JSON.stringify(parsedContent), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: "Internal Server Error", message: errorMessage }), { status: 500 });
  }
};
