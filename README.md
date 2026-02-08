# @ecb/exchange-rates

A typed TypeScript wrapper for the **European Central Bank** exchange rates SDMX API. Zero dependencies, production-ready, fully typed.

## Features

- **Zero dependencies** — uses only `fetch` (Node.js 22+ / browser)
- **Fully typed** — strict TypeScript with exported types for everything
- **SOLID architecture** — modular, testable, extensible
- **JSON-based** — uses `Accept: application/json` header for SDMX-JSON responses
- **No API key** — ECB API is free and unlimited
- **Dependency injection** — swap HTTP fetcher for testing or custom transports

## Quick Start

```ts
import { EcbClient } from "@ecb/exchange-rates";

const ecb = new EcbClient();

// Get EUR/USD rate for a specific date
const result = await ecb.getRate("USD", "2025-01-15");
console.log(result.rates.get("2025-01-15")); // 1.03

// Convert 100 EUR to USD
const conversion = await ecb.convert(100, "USD", "2025-01-15");
console.log(conversion); // { amount: 103, rate: 1.03, date: "2025-01-15", currency: "USD" }

// Get rate history
const history = await ecb.getRateHistory("USD", "2025-01-01", "2025-01-31");
for (const [date, rate] of history.rates) {
  console.log(`${date}: 1 EUR = ${rate} USD`);
}

// Multiple currencies at once
const multi = await ecb.getRates({
  currencies: ["USD", "GBP", "JPY"],
  startDate: "2025-01-01",
  endDate: "2025-01-31",
});
for (const [date, rates] of multi.rates) {
  console.log(`${date}: USD=${rates.USD}, GBP=${rates.GBP}, JPY=${rates.JPY}`);
}

// Raw observations (full control)
const observations = await ecb.getObservations({
  currencies: ["USD"],
  startDate: "2025-01-01",
  endDate: "2025-01-31",
  frequency: "D",
});
```

## API Reference

### `EcbClient`

#### Constructor

```ts
new EcbClient(config?: EcbClientConfig)
```

| Option      | Type       | Default                                         | Description                    |
| ----------- | ---------- | ----------------------------------------------- | ------------------------------ |
| `baseUrl`   | `string`   | `https://data-api.ecb.europa.eu/service`        | ECB API base URL               |
| `timeoutMs` | `number`   | `30000`                                         | Request timeout in ms          |
| `fetchFn`   | `Function` | `globalThis.fetch`                              | Custom fetch for DI            |

#### Methods

| Method            | Description                                    | Returns                          |
| ----------------- | ---------------------------------------------- | -------------------------------- |
| `getRate`         | Single currency, single date                   | `ExchangeRateResult`             |
| `getRateHistory`  | Single currency, date range                    | `ExchangeRateResult`             |
| `getRates`        | Multiple currencies, date range                | `ExchangeRatesResult`            |
| `getObservations` | Raw observation array                          | `ExchangeRateObservation[]`      |
| `convert`         | Convert EUR amount to target currency          | `{ amount, rate, date, currency }` |

### Static Factory

```ts
// Inject a custom HTTP fetcher (useful for testing)
const client = EcbClient.withFetcher(myCustomFetcher, "https://custom-url.com");
```

## Architecture

```
src/
├── types/          # Type definitions (interfaces, SDMX-JSON shapes, branded types)
├── errors/         # Error hierarchy (EcbError → EcbApiError, EcbNetworkError, etc.)
├── parsers/        # SDMX-JSON response parser (Single Responsibility)
├── services/       # HTTP fetcher abstraction (Dependency Inversion)
├── utils/          # URL builder, query validation
├── client.ts       # Main EcbClient facade
└── index.ts        # Public API barrel export
```

### SOLID Principles Applied

- **S** — Each module has a single responsibility (parsing, fetching, validating, URL building)
- **O** — New formats/transports can be added without modifying existing code
- **L** — All error types extend `EcbError` and are interchangeable
- **I** — `HttpFetcher` interface exposes only what consumers need
- **D** — `EcbClient` depends on the `HttpFetcher` abstraction, not `fetch` directly

## Error Handling

```ts
import { EcbApiError, EcbNetworkError, EcbValidationError } from "@ecb/exchange-rates";

try {
  const result = await ecb.getRate("USD", "2025-01-15");
} catch (error) {
  if (error instanceof EcbValidationError) {
    // Invalid query parameters
  } else if (error instanceof EcbApiError) {
    // HTTP error from ECB (error.statusCode, error.statusText)
  } else if (error instanceof EcbNetworkError) {
    // Network failure / timeout
  }
}
```

## Testing

```bash
npm test   # Runs unit tests with mock HTTP fetcher
```

## Important Notes

- **Uses `Accept: application/json`** — Content negotiation via header, not URL params.
- **Base currency is always EUR** — The ECB publishes reference rates against the Euro.
- **No weekend/holiday data** — The ECB only publishes rates on business days.
- **Historical data from 1999** — Data is available from January 4, 1999.
- **Rates published at 16:00 CET** — Reference rates are set daily around 16:00 CET.

## License

MIT
