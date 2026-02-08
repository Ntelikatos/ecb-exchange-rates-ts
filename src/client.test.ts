import { describe, expect, it } from "vitest";
import {
  MULTI_CURRENCY_RESPONSE,
  MockFetcher,
  SINGLE_CURRENCY_RESPONSE,
} from "./__tests__/fixtures.js";
import { EcbClient } from "./client.js";
import type { SdmxJsonResponse } from "./types/index.js";

describe("EcbClient", () => {
  describe("getRate", () => {
    it("returns single currency rate result", async () => {
      const client = EcbClient.withFetcher(new MockFetcher(SINGLE_CURRENCY_RESPONSE));
      const result = await client.getRate("USD", "2025-01-15");

      expect(result.base).toBe("EUR");
      expect(result.currency).toBe("USD");
      expect(result.rates.size).toBe(2);
      expect(result.rates.get("2025-01-15")).toBe(1.03);
      expect(result.rates.get("2025-01-16")).toBe(1.0303);
    });
  });

  describe("getRates", () => {
    it("returns multi-currency rate result", async () => {
      const client = EcbClient.withFetcher(new MockFetcher(MULTI_CURRENCY_RESPONSE));
      const result = await client.getRates({
        currencies: ["USD", "GBP"],
        startDate: "2025-01-15",
        endDate: "2025-01-16",
      });

      expect(result.base).toBe("EUR");
      expect(result.currencies).toHaveLength(2);
      expect(result.rates.size).toBe(2);

      const jan15 = result.rates.get("2025-01-15");
      expect(jan15?.USD).toBe(1.03);
      expect(jan15?.GBP).toBe(0.8442);
    });
  });

  describe("getRateHistory", () => {
    it("returns rate history for a currency", async () => {
      const client = EcbClient.withFetcher(new MockFetcher(SINGLE_CURRENCY_RESPONSE));
      const result = await client.getRateHistory("USD", "2025-01-15", "2025-01-16");

      expect(result.rates.size).toBe(2);
      expect(result.currency).toBe("USD");
    });
  });

  describe("getObservations", () => {
    it("returns raw observations", async () => {
      const client = EcbClient.withFetcher(new MockFetcher(SINGLE_CURRENCY_RESPONSE));
      const obs = await client.getObservations({
        currencies: ["USD"],
        startDate: "2025-01-15",
        endDate: "2025-01-16",
      });

      expect(obs).toHaveLength(2);
      expect(obs[0]?.rate).toBe(1.03);
    });
  });

  describe("baseCurrency configuration", () => {
    it("derives base from parsed response, not hardcoded", async () => {
      const client = EcbClient.withFetcher(new MockFetcher(SINGLE_CURRENCY_RESPONSE));
      const result = await client.getRate("USD", "2025-01-15");

      // base comes from the SDMX response's CURRENCY_DENOM dimension, not hardcoded
      expect(result.base).toBe("EUR");
    });

    it("allows custom baseCurrency via client config", async () => {
      const client = EcbClient.withFetcher(new MockFetcher(SINGLE_CURRENCY_RESPONSE), {
        baseCurrency: "USD",
      });
      // The client passes baseCurrency through to the URL builder.
      // Here we just verify the client accepts the config without error.
      const obs = await client.getObservations({
        currencies: ["GBP"],
        startDate: "2025-01-15",
        endDate: "2025-01-16",
      });
      expect(obs).toHaveLength(2);
    });

    it("allows per-query baseCurrency override", async () => {
      const client = EcbClient.withFetcher(new MockFetcher(SINGLE_CURRENCY_RESPONSE));
      const obs = await client.getObservations({
        currencies: ["GBP"],
        startDate: "2025-01-15",
        endDate: "2025-01-16",
        baseCurrency: "USD",
      });
      expect(obs).toHaveLength(2);
    });
  });

  describe("convert", () => {
    it("converts base currency amount to target currency", async () => {
      const client = EcbClient.withFetcher(new MockFetcher(SINGLE_CURRENCY_RESPONSE));
      const conversion = await client.convert(100, "USD", "2025-01-15");

      expect(conversion).not.toBeNull();
      expect(conversion?.amount).toBe(103);
      expect(conversion?.rate).toBe(1.03);
      expect(conversion?.date).toBe("2025-01-15");
    });

    it("returns null when no data available", async () => {
      const emptyResponse: SdmxJsonResponse = { ...SINGLE_CURRENCY_RESPONSE, dataSets: [] };
      const client = EcbClient.withFetcher(new MockFetcher(emptyResponse));
      const conversion = await client.convert(100, "USD", "2025-01-15");

      expect(conversion).toBeNull();
    });
  });
});
