import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility function", () => {
  it("merges class names correctly", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const condition = false;
    const result = cn("foo", condition && "bar", "baz");
    expect(result).toBe("foo baz");
  });

  it("merges tailwind classes correctly", () => {
    const result = cn("px-2 py-1", "px-4");
    // twMerge should resolve conflicting Tailwind classes
    expect(result).toBe("py-1 px-4");
  });

  it("handles arrays and objects", () => {
    const result = cn(["foo", "bar"], { baz: true, qux: false });
    expect(result).toBe("foo bar baz");
  });

  it("handles undefined and null values", () => {
    const result = cn("foo", undefined, null, "bar");
    expect(result).toBe("foo bar");
  });
});
