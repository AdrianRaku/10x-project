import type { UserRating } from "../../repositories/RatingRepository";

/**
 * Builder for constructing AI prompts for movie recommendations.
 * Implements Builder Pattern for flexible prompt construction.
 */
export class PromptBuilder {
  private ratings: UserRating[] = [];
  private userContext: string | undefined;

  /**
   * Sets the user's rating history.
   */
  withRatings(ratings: UserRating[]): this {
    this.ratings = ratings;
    return this;
  }

  /**
   * Sets additional user context/preferences.
   */
  withUserContext(context: string | undefined): this {
    this.userContext = context;
    return this;
  }

  /**
   * Builds the system prompt for AI.
   */
  buildSystemPrompt(): string {
    const ratingsText = this.ratings.map((r) => `- TMDb ID ${r.tmdb_id}: Rating ${r.rating}/10`).join("\n");

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
   * Builds the user prompt for AI.
   */
  buildUserPrompt(): string {
    return this.userContext || "Suggest 5 great movies for me.";
  }

  /**
   * Sanitizes user input to prevent injection attacks.
   */
  static sanitize(prompt?: string): string | undefined {
    if (!prompt) return undefined;
    return prompt.replace(/[<>]/g, "").trim();
  }
}
