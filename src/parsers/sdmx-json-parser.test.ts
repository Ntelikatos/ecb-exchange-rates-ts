import { describe, expect, it } from "vitest";
import { MULTI_CURRENCY_RESPONSE, SINGLE_CURRENCY_RESPONSE } from "../__tests__/fixtures.js";
import { EcbParseError } from "../errors/index.js";
import type { SdmxJsonResponse } from "../types/index.js";
import { parseJsonResponse, parseSdmxJson } from "./sdmx-json-parser.js";

describe("parseJsonResponse", () => {
  it("parses a single-currency response into observations", () => {
    const obs = parseJsonResponse(SINGLE_CURRENCY_RESPONSE);

    expect(obs).toHaveLength(2);
    expect(obs[0]).toEqual({
      currency: "USD",
      baseCurrency: "EUR",
      date: "2025-01-15",
      rate: 1.03,
    });
    expect(obs[1]).toEqual({
      currency: "USD",
      baseCurrency: "EUR",
      date: "2025-01-16",
      rate: 1.0303,
    });
  });

  it("parses a multi-currency response into observations", () => {
    const obs = parseJsonResponse(MULTI_CURRENCY_RESPONSE);

    expect(obs).toHaveLength(4);

    const currencies = new Set(obs.map((o) => o.currency));
    expect(currencies).toEqual(new Set(["USD", "GBP"]));

    const usdJan15 = obs.find((o) => o.currency === "USD" && o.date === "2025-01-15");
    expect(usdJan15?.rate).toBe(1.03);

    const gbpJan15 = obs.find((o) => o.currency === "GBP" && o.date === "2025-01-15");
    expect(gbpJan15?.rate).toBe(0.8442);
  });

  it("returns empty array for empty dataSets", () => {
    const emptyResponse: SdmxJsonResponse = {
      ...SINGLE_CURRENCY_RESPONSE,
      dataSets: [],
    };
    expect(parseJsonResponse(emptyResponse)).toEqual([]);
  });

  it("throws EcbParseError for missing CURRENCY dimension", () => {
    const badResponse = {
      ...SINGLE_CURRENCY_RESPONSE,
      structure: { dimensions: { series: [], observation: [] } },
    } as SdmxJsonResponse;

    expect(() => parseJsonResponse(badResponse)).toThrow(EcbParseError);
  });
});

describe("parseSdmxJson", () => {
  it("parses valid JSON string", () => {
    const json = JSON.stringify(SINGLE_CURRENCY_RESPONSE);
    const result = parseSdmxJson(json);
    expect(result.header.id).toBe("test-single");
  });

  it("throws EcbParseError for invalid JSON", () => {
    expect(() => parseSdmxJson("not json")).toThrow(EcbParseError);
  });
});
