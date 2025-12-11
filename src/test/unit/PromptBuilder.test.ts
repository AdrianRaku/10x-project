import { describe, it, expect } from "vitest";
import { PromptBuilder } from "../../lib/services/recommendations/PromptBuilder";

describe("PromptBuilder", () => {
  describe("buildSystemPrompt", () => {
    it("should build system prompt with ratings", () => {
      const ratings = [
        { tmdb_id: 1, rating: 9 },
        { tmdb_id: 2, rating: 5 },
        { tmdb_id: 3, rating: 2 },
      ];

      const prompt = new PromptBuilder()
        .withRatings(ratings)
        .buildSystemPrompt();

      expect(prompt).toContain("TMDb ID 1: Rating 9/10");
      expect(prompt).toContain("TMDb ID 2: Rating 5/10");
      expect(prompt).toContain("TMDb ID 3: Rating 2/10");
      expect(prompt).toContain("8-10: User loved these movies");
    });

    it("should build system prompt with empty ratings", () => {
      const prompt = new PromptBuilder()
        .withRatings([])
        .buildSystemPrompt();

      expect(prompt).toContain("User's rating history:");
      expect(prompt).not.toContain("- TMDb ID");
    });
  });

  describe("buildUserPrompt", () => {
    it("should return user context when provided", () => {
      const builder = new PromptBuilder().withUserContext("I love sci-fi movies");
      const prompt = builder.buildUserPrompt();

      expect(prompt).toBe("I love sci-fi movies");
    });

    it("should return default prompt when no context provided", () => {
      const builder = new PromptBuilder();
      const prompt = builder.buildUserPrompt();

      expect(prompt).toBe("Suggest 5 great movies for me.");
    });
  });

  describe("sanitize", () => {
    it("should remove HTML tags", () => {
      const result = PromptBuilder.sanitize("<script>alert('xss')</script>");
      expect(result).toBe("scriptalert('xss')/script");
    });

    it("should trim whitespace", () => {
      const result = PromptBuilder.sanitize("  test  ");
      expect(result).toBe("test");
    });

    it("should return undefined for empty input", () => {
      const result = PromptBuilder.sanitize(undefined);
      expect(result).toBeUndefined();
    });

    it("should handle empty string", () => {
      const result = PromptBuilder.sanitize("");
      expect(result).toBeUndefined();
    });
  });

  describe("chaining", () => {
    it("should allow method chaining", () => {
      const ratings = [{ tmdb_id: 1, rating: 8 }];

      const builder = new PromptBuilder()
        .withRatings(ratings)
        .withUserContext("test");

      expect(builder).toBeInstanceOf(PromptBuilder);

      const systemPrompt = builder.buildSystemPrompt();
      const userPrompt = builder.buildUserPrompt();

      expect(systemPrompt).toContain("TMDb ID 1: Rating 8/10");
      expect(userPrompt).toBe("test");
    });
  });
});

