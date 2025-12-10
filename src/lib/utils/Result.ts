/**
};
  },
    return defaultValue;
    }
      return result.value;
    if (result.success) {
  unwrapOr<T>(result: Result<T, unknown>, defaultValue: T): T {
   */
   * Unwraps a successful result or returns default value.
  /**

  },
    throw result.error;
    }
      return result.value;
    if (result.success) {
  unwrap<T>(result: Result<T, unknown>): T {
   */
   * Unwraps a successful result or throws.
  /**

  },
    return result;
    }
      return fn(result.value);
    if (result.success) {
  ): Promise<Result<U, E>> {
    fn: (value: T) => Promise<Result<U, E>>
    result: Result<T, E>,
  async andThen<T, U, E>(
   */
   * Chains result operations (flatMap).
  /**

  },
    return result;
    }
      return Result.err(fn(result.error));
    if (!result.success) {
  mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
   */
   * Maps an error result to a new error.
  /**

  },
    return result;
    }
      return Result.ok(fn(result.value));
    if (result.success) {
  map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
   */
   * Maps a successful result to a new value.
  /**

  },
    return { success: false, error };
  err<E>(error: E): Result<never, E> {
   */
   * Creates an error result.
  /**

  },
    return { success: true, value };
  ok<T>(value: T): Result<T, never> {
   */
   * Creates a successful result.
  /**
export const Result = {
 */
 * Helper functions for working with Results.
/**

  | { success: false; error: E };
  | { success: true; value: T }
export type Result<T, E = Error> =
 */
 * Implements Result Pattern for better error handling without exceptions.
 * Result type for functional error handling.

