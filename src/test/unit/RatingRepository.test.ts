import { describe, it, expect, vi, beforeEach } from "vitest";
});
  });
    });
      expect(result).toBe(0);

      const result = await repository.getRatingsCount("user-123");

      });
        }),
          }),
            error: null,
            count: null,
          eq: vi.fn().mockResolvedValue({
        select: vi.fn().mockReturnValue({
      mockSupabase.from.mockReturnValue({
    it("should return 0 when user has no ratings", async () => {

    });
      expect(result).toBe(15);

      const result = await repository.getRatingsCount("user-123");

      });
        }),
          }),
            error: null,
            count: 15,
          eq: vi.fn().mockResolvedValue({
        select: vi.fn().mockReturnValue({
      mockSupabase.from.mockReturnValue({
    it("should return count of user ratings", async () => {
  describe("getRatingsCount", () => {

  });
    });
      expect(result).toEqual([]);

      const result = await repository.getUserRatings("user-123");

      });
        }),
          }),
            }),
              error: null,
              data: [],
            order: vi.fn().mockResolvedValue({
          eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
      mockSupabase.from.mockReturnValue({
    it("should return empty array when user has no ratings", async () => {

    });
      await expect(repository.getUserRatings("user-123")).rejects.toThrow("Database error");

      });
        }),
          }),
            }),
              error: mockError,
              data: null,
            order: vi.fn().mockResolvedValue({
          eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
      mockSupabase.from.mockReturnValue({

      const mockError = new Error("Database error");
    it("should throw error when database query fails", async () => {

    });
      expect(mockSupabase.from).toHaveBeenCalledWith("ratings");
      expect(result).toEqual(mockRatings);

      const result = await repository.getUserRatings("user-123");

      });
        }),
          }),
            }),
              error: null,
              data: mockRatings,
            order: vi.fn().mockResolvedValue({
          eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
      mockSupabase.from.mockReturnValue({

      ];
        { tmdb_id: 2, rating: 9 },
        { tmdb_id: 1, rating: 8 },
      const mockRatings = [
    it("should fetch user ratings successfully", async () => {
  describe("getUserRatings", () => {

  });
    repository = new RatingRepository(mockSupabase as SupabaseClient);
    };
      from: vi.fn(),
    mockSupabase = {
  beforeEach(() => {

  let repository: RatingRepository;
  let mockSupabase: any;
describe("RatingRepository", () => {

import type { SupabaseClient } from "../../db/supabase.client";
import { RatingRepository } from "../../lib/repositories/RatingRepository";

