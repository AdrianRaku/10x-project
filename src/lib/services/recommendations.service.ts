import { z } from 'zod';
import type { SupabaseClient } from '../../db/supabase.client';
import type { RecommendationDto } from '../../types';
import { OpenRouterService } from './openrouter.service';

// ============================================================================
// Custom Error Classes
// ============================================================================

/**
 * Error thrown when user has insufficient ratings to generate recommendations.
 */
export class InsufficientRatingsError extends Error {
  constructor(public currentCount: number, public requiredCount: number = 10) {
    super(`User has only ${currentCount} ratings, minimum ${requiredCount} required`);
    this.name = 'InsufficientRatingsError';
  }
}

/**
 * Error thrown when user exceeds daily recommendation limit.
 */
export class DailyLimitExceededError extends Error {
  constructor(
    public dailyLimit: number,
    public requestsToday: number,
    public resetTime: Date
  ) {
    super(`Daily limit of ${dailyLimit} requests exceeded`);
    this.name = 'DailyLimitExceededError';
  }
}

/**
 * Error thrown when AI response cannot be parsed or validated.
 */
export class AIResponseParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIResponseParsingError';
  }
}

// ============================================================================
// Validation Schemas
// ============================================================================

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

// ============================================================================
// Types
// ============================================================================

/**
 * Represents a user's rating for a movie.
 */
type UserRating = {
  tmdb_id: number;
  rating: number;
};

// ============================================================================
// RecommendationsService
// ============================================================================

/**
 * Service responsible for generating AI-powered movie recommendations.
 */
export class RecommendationsService {
  private readonly MINIMUM_RATINGS = 10;
  private readonly DAILY_LIMIT: number;

  constructor(dailyLimit?: number) {
    this.DAILY_LIMIT = dailyLimit || 10;
  }

  /**
   * Generates personalized movie recommendations for a user.
   *
   * @param userId - The authenticated user's ID
   * @param prompt - Optional user prompt for additional context
   * @param supabase - Supabase client instance
   * @param openRouterApiKey - OpenRouter API key
   * @returns Array of 5 movie recommendations
   * @throws {InsufficientRatingsError} When user has less than 10 ratings
   * @throws {DailyLimitExceededError} When daily limit is exceeded
   * @throws {AIResponseParsingError} When AI response is invalid
   */
  async generateRecommendations(
    userId: string,
    prompt: string | undefined,
    supabase: SupabaseClient,
    openRouterApiKey: string
  ): Promise<RecommendationDto[]> {
    // 1. Fetch user data in parallel (ratings + daily request count)
    const [ratingsData, requestsCount] = await Promise.all([
      this.getUserRatings(userId, supabase),
      this.getRequestsCountToday(userId, supabase),
    ]);

    // 2. Check minimum ratings requirement
    if (ratingsData.length < this.MINIMUM_RATINGS) {
      throw new InsufficientRatingsError(ratingsData.length, this.MINIMUM_RATINGS);
    }

    // 3. Check daily limit
    if (requestsCount >= this.DAILY_LIMIT) {
      const resetTime = new Date();
      resetTime.setUTCHours(24, 0, 0, 0);
      throw new DailyLimitExceededError(this.DAILY_LIMIT, requestsCount, resetTime);
    }

    // 4. Generate recommendations via AI
    const recommendations = await this.callAIForRecommendations(
      ratingsData,
      this.sanitizePrompt(prompt),
      openRouterApiKey
    );

    // 5. Log the request
    await this.logRecommendationRequest(userId, supabase);

    return recommendations;
  }

  /**
   * Retrieves user's rating history from the database.
   */
  private async getUserRatings(
    userId: string,
    supabase: SupabaseClient
  ): Promise<UserRating[]> {
    const { data, error } = await supabase
      .from('ratings')
      .select('tmdb_id, rating')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Counts how many recommendation requests the user made today.
   */
  private async getRequestsCountToday(
    userId: string,
    supabase: SupabaseClient
  ): Promise<number> {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('ai_recommendation_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString());

    if (error) {
      throw error;
    }

    return count || 0;
  }

  /**
   * Calls OpenRouter AI to generate movie recommendations.
   */
  private async callAIForRecommendations(
    ratings: UserRating[],
    userPrompt: string | undefined,
    apiKey: string
  ): Promise<RecommendationDto[]> {
    const openRouterService = new OpenRouterService(apiKey);

    // Build system prompt with user's rating history
    const systemPrompt = this.buildSystemPrompt(ratings);

    // Define JSON schema for structured response
    const responseSchema = {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tmdb_id: { type: 'number', description: 'TMDb movie ID' },
              title: { type: 'string', description: 'Movie title' },
              year: { type: 'number', description: 'Release year' },
            },
            required: ['tmdb_id', 'title', 'year'],
            additionalProperties: false,
          },
          minItems: 5,
          maxItems: 5,
        },
      },
      required: ['recommendations'],
      additionalProperties: false,
    };

    // Call OpenRouter API
    const aiResponse = await openRouterService.generateChatCompletion({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt || 'Suggest 5 great movies for me.' },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'movie_recommendations',
          strict: true,
          schema: responseSchema,
        },
      },
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Parse and validate AI response
    const content = aiResponse.choices[0]?.message?.content;
    if (!content) {
      throw new AIResponseParsingError('Empty response from AI');
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      throw new AIResponseParsingError('Invalid JSON in AI response');
    }

    const validation = RecommendationsResponseSchema.safeParse(parsedContent);
    if (!validation.success) {
      throw new AIResponseParsingError(
        `AI response validation failed: ${validation.error.message}`
      );
    }

    // Return recommendations with posterPath set to null (will be enriched by the endpoint)
    return validation.data.recommendations.map((rec): RecommendationDto => ({
      tmdb_id: rec.tmdb_id,
      title: rec.title,
      year: rec.year,
      posterPath: null,
    }));
  }

  /**
   * Builds the system prompt with user's rating history.
   */
  private buildSystemPrompt(ratings: UserRating[]): string {
    const ratingsText = ratings
      .map((r) => `- TMDb ID ${r.tmdb_id}: Rating ${r.rating}/10`)
      .join('\n');

    return `You are an expert movie recommendation system. Based on the user's rating history below, suggest 5 movies they would love.

Rating interpretation:
- 8-10: User loved these movies
- 5-7: User liked these movies
- 1-4: User disliked these movies

User's rating history:
${ratingsText}

Provide 5 diverse movie recommendations with valid TMDb IDs, titles, and release years. Ensure variety in genres and eras while matching user preferences.`;
  }

  /**
   * Logs the recommendation request to the database.
   */
  private async logRecommendationRequest(
    userId: string,
    supabase: SupabaseClient
  ): Promise<void> {
    const { error } = await supabase
      .from('ai_recommendation_requests')
      .insert({ user_id: userId });

    if (error) {
      // Log error but don't throw - we don't want to fail the response if logging fails
      console.error('[recommendations] Failed to log request:', error);
    }
  }

  /**
   * Sanitizes user prompt to prevent injection attacks.
   */
  private sanitizePrompt(prompt?: string): string | undefined {
    if (!prompt) return undefined;
    return prompt.replace(/[<>]/g, '').trim();
  }
}