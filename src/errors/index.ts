/**
 * Base error for all ECB client errors.
 * Follows the Liskov Substitution Principle — all subtypes are interchangeable.
 */
export class EcbError extends Error {
  public readonly code: string;

  constructor(message: string, code: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "EcbError";
    this.code = code;
  }
}

/**
 * Thrown when the ECB API returns an HTTP error.
 */
export class EcbApiError extends EcbError {
  public readonly statusCode: number;
  public readonly statusText: string;

  constructor(statusCode: number, statusText: string, body?: string) {
    const message = `ECB API returned ${statusCode} ${statusText}${body ? `: ${body}` : ""}`;
    super(message, "ECB_API_ERROR");
    this.name = "EcbApiError";
    this.statusCode = statusCode;
    this.statusText = statusText;
  }
}

/**
 * Thrown when the network request fails (timeout, DNS, connection refused, etc.).
 */
export class EcbNetworkError extends EcbError {
  constructor(message: string, cause?: unknown) {
    super(message, "ECB_NETWORK_ERROR", { cause });
    this.name = "EcbNetworkError";
  }
}

/**
 * Thrown when the API response cannot be parsed.
 */
export class EcbParseError extends EcbError {
  constructor(message: string, cause?: unknown) {
    super(message, "ECB_PARSE_ERROR", { cause });
    this.name = "EcbParseError";
  }
}

/**
 * Thrown when query parameters are invalid.
 */
export class EcbValidationError extends EcbError {
  constructor(message: string) {
    super(message, "ECB_VALIDATION_ERROR");
    this.name = "EcbValidationError";
  }
}
