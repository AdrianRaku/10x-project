import { z } from "zod";

// Definicje schematów Zod dla walidacji
const OpenRouterRequestSchema = z.object({
  model: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    })
  ),
  response_format: z.optional(
    z.object({
      type: z.literal("json_schema"),
      json_schema: z.object({
        name: z.string(),
        strict: z.boolean().optional(),
        schema: z.record(z.unknown()),
      }),
    })
  ),
  // Inne opcjonalne parametry modelu
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
});

const OpenRouterResponseSchema = z.object({
  id: z.string(),
  choices: z.array(
    z.object({
      message: z.object({
        role: z.string(),
        content: z.string(),
      }),
    })
  ),
});

export class OpenRouterService {
  private apiKey: string;
  private readonly openRouterApiUrl = "https://openrouter.ai/api/v1/chat/completions";

  /**
   * Tworzy instancję OpenRouterService.
   * @param apiKey - Klucz API OpenRouter. Zaleca się przekazywanie go ze zmiennych środowiskowych.
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("OpenRouter API key is required.");
    }
    this.apiKey = apiKey;
  }

  /**
   * Generuje uzupełnienie czatu przy użyciu API OpenRouter.
   * @param request - Obiekt żądania zgodny z OpenRouterRequestSchema
   * @returns Promise z odpowiedzią z API
   */
  public async generateChatCompletion(
    request: z.infer<typeof OpenRouterRequestSchema>
  ): Promise<z.infer<typeof OpenRouterResponseSchema>> {
    // Walidacja danych wejściowych
    const validationResult = OpenRouterRequestSchema.safeParse(request);
    if (!validationResult.success) {
      throw new Error(`Invalid request payload: ${validationResult.error.message}`);
    }

    const response = await fetch(this.openRouterApiUrl, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(validationResult.data),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();

    // Walidacja odpowiedzi
    const responseValidation = OpenRouterResponseSchema.safeParse(data);
    if (!responseValidation.success) {
      throw new Error(`Invalid response from OpenRouter API: ${responseValidation.error.message}`);
    }

    return responseValidation.data;
  }

  /**
   * Generuje nagłówki HTTP dla żądań API.
   * @returns Obiekt z nagłówkami
   */
  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }
}
