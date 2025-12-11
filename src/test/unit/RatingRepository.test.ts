
import { RatingRepository } from "../../lib/repositories/RatingRepository";
import type { SupabaseClient } from "../../db/supabase.client";

describe("RatingRepository", () => {
  let mockSupabase: any;
  let repository: RatingRepository;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    };
    repository = new RatingRepository(mockSupabase as SupabaseClient);
  });

  describe("getUserRatings", () => {
    it("should fetch user ratings successfully", async () => {
      const mockRatings = [
        { tmdb_id: 1, rating: 8 },
        { tmdb_id: 2, rating: 9 },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockRatings,
              error: null,
            }),
          }),
        }),
      });

      const result = await repository.getUserRatings("user-123");

      expect(result).toEqual(mockRatings);
      expect(mockSupabase.from).toHaveBeenCalledWith("ratings");
    });

    it("should throw error when database query fails", async () => {
      const mockError = new Error("Database error");

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      await expect(repository.getUserRatings("user-123")).rejects.toThrow("Database error");
    });

    it("should return empty array when user has no ratings", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const result = await repository.getUserRatings("user-123");

      expect(result).toEqual([]);
    });
  });

  describe("getRatingsCount", () => {
    it("should return count of user ratings", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: 15,
            error: null,
          }),
        }),
      });

      const result = await repository.getRatingsCount("user-123");

      expect(result).toBe(15);
    });

    it("should return 0 when user has no ratings", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: null,
            error: null,
          }),
        }),
      });

      const result = await repository.getRatingsCount("user-123");

      expect(result).toBe(0);
    });
  });
});
import { describe, it, expect, vi, beforeEach } from "vitest";
