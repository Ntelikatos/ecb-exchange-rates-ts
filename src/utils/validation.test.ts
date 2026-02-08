import { describe, expect, it } from "vitest";
import { EcbValidationError } from "../errors/index.js";
import { validateQuery } from "./validation.js";

describe("validateQuery", () => {
  it("rejects empty currencies array", () => {
    expect(() => validateQuery({ currencies: [], startDate: "2025-01-15" })).toThrow(
      EcbValidationError,
    );
  });

  it("rejects 2-letter currency code", () => {
    expect(() => validateQuery({ currencies: ["US"], startDate: "2025-01-15" })).toThrow(
      EcbValidationError,
    );
  });

  it("rejects lowercase currency code", () => {
    expect(() => validateQuery({ currencies: ["usd"], startDate: "2025-01-15" })).toThrow(
      EcbValidationError,
    );
  });

  it("accepts format-valid dates without calendar validation", () => {
    // Regex only checks format, not calendar validity — by design
    expect(() => validateQuery({ currencies: ["USD"], startDate: "2025-13-01" })).not.toThrow();
  });

  it("rejects startDate after endDate", () => {
    expect(() =>
      validateQuery({ currencies: ["USD"], startDate: "2025-01-20", endDate: "2025-01-10" }),
    ).toThrow(EcbValidationError);
  });

  it("accepts valid query parameters", () => {
    expect(() =>
      validateQuery({ currencies: ["USD", "GBP"], startDate: "2025-01-01", endDate: "2025-01-31" }),
    ).not.toThrow();
  });

  it("rejects invalid date format", () => {
    expect(() => validateQuery({ currencies: ["USD"], startDate: "01-15-2025" })).toThrow(
      EcbValidationError,
    );
  });

  it("rejects invalid baseCurrency", () => {
    expect(() =>
      validateQuery({ currencies: ["USD"], startDate: "2025-01-01", baseCurrency: "eu" }),
    ).toThrow(EcbValidationError);
  });

  it("accepts valid baseCurrency", () => {
    expect(() =>
      validateQuery({ currencies: ["GBP"], startDate: "2025-01-01", baseCurrency: "USD" }),
    ).not.toThrow();
  });
});
