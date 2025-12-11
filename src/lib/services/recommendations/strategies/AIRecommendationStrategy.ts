import { z } from "zod";
import type { RecommendationDto } from "../../../../types";
import type { SupabaseClient } from "../../../../db/supabase.client";
import { OpenRouterService } from "../../openrouter.service";
import { PromptBuilder } from "../PromptBuilder";
import { RatingRepository } from "../../../repositories/RatingRepository";
import type { RecommendationStrategy } from "./RecommendationStrategy";

/**
 * Error thrown when AI response cannot be parsed or validated.
 */
export class AIResponseParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIResponseParsingError";
  }
}

/**
 * Schema for a single movie recommendation.
 */
const RecommendationSchema = z.object({
  tmdb_id: z.number().int().positive(),
  title: z.string().min(1),
  year: z.number().int().min(1888).max(2100),
});

/**
 * Schema for the AI response containing recommendations.
 */
const RecommendationsResponseSchema = z.object({
  recommendations: z.array(RecommendationSchema).length(5),
});

/**
 * Strategy for generating AI-powered movie recommendations.
 * Uses OpenRouter API with GPT-4o-mini model.
 */
export class AIRecommendationStrategy implements RecommendationStrategy {
  constructor(
    private supabase: SupabaseClient,
    private openRouterApiKey: string
  ) {}

  async generate(userId: string, userPrompt?: string): Promise<RecommendationDto[]> {
    // 1. Fetch user ratings
    const ratingRepository = new RatingRepository(this.supabase);
    const ratings = await ratingRepository.getUserRatings(userId);

    // 2. Build prompts
    const promptBuilder = new PromptBuilder().withRatings(ratings).withUserContext(PromptBuilder.sanitize(userPrompt));

    const systemPrompt = promptBuilder.buildSystemPrompt();
    const userPromptText = promptBuilder.buildUserPrompt();

    // 3. Call AI service
    const openRouterService = new OpenRouterService(this.openRouterApiKey);
    const aiResponse = await this.callAI(openRouterService, systemPrompt, userPromptText);

    // 4. Parse and validate response
    return this.parseAndValidateResponse(aiResponse);
  }

  /**
   * Calls OpenRouter AI to generate recommendations.
   */
  private async callAI(service: OpenRouterService, systemPrompt: string, userPrompt: string): Promise<string> {
    const responseSchema = {
      type: "object",
      properties: {
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tmdb_id: { type: "number", description: "TMDb movie ID" },
              title: { type: "string", description: "Movie title" },
              year: { type: "number", description: "Release year" },
            },
            required: ["tmdb_id", "title", "year"],
            additionalProperties: false,
          },
          minItems: 5,
          maxItems: 5,
        },
      },
      required: ["recommendations"],
      additionalProperties: false,
    };

    const response = await service.generateChatCompletion({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "movie_recommendations",
          strict: true,
          schema: responseSchema,
        },
      },
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new AIResponseParsingError("Empty response from AI");
    }

    return content;
  }

  /**
   * Parses and validates AI response.
   */
  private parseAndValidateResponse(content: string): RecommendationDto[] {
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      throw new AIResponseParsingError("Invalid JSON in AI response");
    }

    const validation = RecommendationsResponseSchema.safeParse(parsedContent);
    if (!validation.success) {
      throw new AIResponseParsingError(`AI response validation failed: ${validation.error.message}`);
    }

    return validation.data.recommendations.map(
      (rec): RecommendationDto => ({
        tmdb_id: rec.tmdb_id,
        title: rec.title,
        year: rec.year,
        posterPath: null,
      })
    );
  }
}
