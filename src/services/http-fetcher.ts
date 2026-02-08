import { EcbApiError, EcbNetworkError } from "../errors/index.js";

/**
 * Contract for HTTP fetching — enables dependency inversion.
 * Consumers depend on this abstraction, not on concrete fetch implementations.
 */
export interface HttpFetcher {
  get(url: string, signal?: AbortSignal): Promise<string>;
}

/**
 * Default HTTP fetcher using the global `fetch` API.
 * Single Responsibility: only concerned with HTTP GET and error mapping.
 *
 * Dependency Inversion: Accepts `fetch` as a constructor parameter,
 * allowing tests or consumers to inject alternatives.
 */
export class FetchHttpFetcher implements HttpFetcher {
  private readonly fetchFn: typeof globalThis.fetch;
  private readonly timeoutMs: number;

  constructor(
    fetchFn: typeof globalThis.fetch = globalThis.fetch.bind(globalThis),
    timeoutMs = 30_000,
  ) {
    this.fetchFn = fetchFn;
    this.timeoutMs = timeoutMs;
  }

  async get(url: string, externalSignal?: AbortSignal): Promise<string> {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), this.timeoutMs);

    // Combine external abort signal with our timeout signal
    const signal = externalSignal
      ? AbortSignal.any([externalSignal, timeoutController.signal])
      : timeoutController.signal;

    try {
      const response = await this.fetchFn(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new EcbApiError(response.status, response.statusText, body);
      }

      return await response.text();
    } catch (error) {
      if (error instanceof EcbApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new EcbNetworkError(`Request timed out after ${this.timeoutMs}ms: ${url}`, error);
      }

      throw new EcbNetworkError(
        `Network request failed for ${url}: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
