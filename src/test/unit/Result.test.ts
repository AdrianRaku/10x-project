import { describe, it, expect } from "vitest";
import { Result } from "../../lib/utils/Result";

describe("Result Pattern", () => {
  describe("ok", () => {
    it("should create successful result", () => {
      const result = Result.ok(42);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(42);
      }
    });
  });

  describe("err", () => {
    it("should create error result", () => {
      const error = new Error("Something went wrong");
      const result = Result.err(error);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe("map", () => {
    it("should map successful result", () => {
      const result = Result.ok(5);
      const mapped = Result.map(result, (x) => x * 2);

      expect(mapped.success).toBe(true);
      if (mapped.success) {
        expect(mapped.value).toBe(10);
      }
    });

    it("should not map error result", () => {
      const error = new Error("Test error");
      const result = Result.err(error);
      const mapped = Result.map(result, (x) => x * 2);

      expect(mapped.success).toBe(false);
      if (!mapped.success) {
        expect(mapped.error).toBe(error);
      }
    });
  });

  describe("mapErr", () => {
    it("should map error result", () => {
      const result = Result.err("error");
      const mapped = Result.mapErr(result, (e) => new Error(e));

      expect(mapped.success).toBe(false);
      if (!mapped.success) {
        expect(mapped.error).toBeInstanceOf(Error);
        expect(mapped.error.message).toBe("error");
      }
    });

    it("should not map successful result", () => {
      const result = Result.ok(42);
      const mapped = Result.mapErr(result, (e) => new Error(String(e)));

      expect(mapped.success).toBe(true);
      if (mapped.success) {
        expect(mapped.value).toBe(42);
      }
    });
  });

  describe("andThen", () => {
    it("should chain successful results", async () => {
      const result = Result.ok(5);
      const chained = await Result.andThen(result, async (x) => Result.ok(x * 2));

      expect(chained.success).toBe(true);
      if (chained.success) {
        expect(chained.value).toBe(10);
      }
    });

    it("should not chain error results", async () => {
      const error = new Error("Test error");
      const result = Result.err(error);
      const chained = await Result.andThen(result, async (x) => Result.ok(x * 2));

      expect(chained.success).toBe(false);
      if (!chained.success) {
        expect(chained.error).toBe(error);
      }
    });

    it("should propagate errors in chain", async () => {
      const result = Result.ok(5);
      const chainError = new Error("Chain error");
      const chained = await Result.andThen(result, async () => Result.err(chainError));

      expect(chained.success).toBe(false);
      if (!chained.success) {
        expect(chained.error).toBe(chainError);
      }
    });
  });

  describe("unwrap", () => {
    it("should unwrap successful result", () => {
      const result = Result.ok(42);
      expect(Result.unwrap(result)).toBe(42);
    });

    it("should throw on error result", () => {
      const error = new Error("Test error");
      const result = Result.err(error);
      expect(() => Result.unwrap(result)).toThrow("Test error");
    });
  });

  describe("unwrapOr", () => {
    it("should unwrap successful result", () => {
      const result = Result.ok(42);
      expect(Result.unwrapOr(result, 0)).toBe(42);
    });

    it("should return default on error result", () => {
      const result = Result.err(new Error("Test error"));
      expect(Result.unwrapOr(result, 0)).toBe(0);
    });
  });
});

