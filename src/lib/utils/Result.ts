/**
 * Result type for functional error handling.
 * Implements Result Pattern for better error handling without exceptions.
 */
export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * Helper functions for working with Results.
 */
export const Result = {
  /**
   * Creates a successful result.
   */
  ok<T>(value: T): Result<T, never> {
    return { success: true, value };
  },

  /**
   * Creates an error result.
   */
  err<E>(error: E): Result<never, E> {
    return { success: false, error };
  },

  /**
   * Maps a successful result to a new value.
   */
  map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    if (result.success) {
      return Result.ok(fn(result.value));
    }
    return result;
  },

  /**
   * Maps an error result to a new error.
   */
  mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    if (!result.success) {
      return Result.err(fn(result.error));
    }
    return result;
  },

  /**
   * Chains result operations (flatMap).
   */
  async andThen<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Promise<Result<U, E>>
  ): Promise<Result<U, E>> {
    if (result.success) {
      return fn(result.value);
    }
    return result;
  },

  /**
   * Unwraps a successful result or throws.
   */
  unwrap<T>(result: Result<T, unknown>): T {
    if (result.success) {
      return result.value;
    }
    throw result.error;
  },

  /**
   * Unwraps a successful result or returns default value.
   */
  unwrapOr<T>(result: Result<T, unknown>, defaultValue: T): T {
    if (result.success) {
      return result.value;
    }
    return defaultValue;
  },
};
