/**
 * Simple HTTP client wrapper.
 */
export class HttpClient {
  /**
   * Performs a GET request.
   */
  async get<T>(url: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      throw new Error(
        `Failed to connect: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to parse response: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}

