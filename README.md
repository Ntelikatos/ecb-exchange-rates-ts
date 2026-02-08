# ecb-exchange-rates-ts

The smallest TypeScript wrapper for the European Central Bank exchange rate API. **Zero dependencies. ~5 KB minified.**

[![npm version](https://img.shields.io/npm/v/ecb-exchange-rates-ts)](https://www.npmjs.com/package/ecb-exchange-rates-ts)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/ecb-exchange-rates-ts)](https://bundlephobia.com/package/ecb-exchange-rates-ts)
[![license](https://img.shields.io/npm/l/ecb-exchange-rates-ts)](LICENSE)

## Install

```bash
npm install ecb-exchange-rates-ts
```

## Usage

```ts
import { EcbClient } from "ecb-exchange-rates-ts";

const ecb = new EcbClient();

// Get a single rate
const { rates } = await ecb.getRate("USD", "2025-01-15");
console.log(rates.get("2025-01-15")); // 1.03

// Convert an amount
const result = await ecb.convert(100, "USD", "2025-01-15");
// { amount: 103, rate: 1.03, date: "2025-01-15", currency: "USD" }

// Rate history
const history = await ecb.getRateHistory("USD", "2025-01-01", "2025-01-31");

// Multiple currencies
const multi = await ecb.getRates({
  currencies: ["USD", "GBP", "JPY"],
  startDate: "2025-01-01",
  endDate: "2025-01-31",
});

// Raw observations
const obs = await ecb.getObservations({
  currencies: ["USD"],
  startDate: "2025-01-01",
  frequency: "M", // monthly
});
```

## Configuration

```ts
const ecb = new EcbClient({
  baseCurrency: "EUR",  // default denomination currency (configurable)
  timeoutMs: 30_000,    // request timeout
  baseUrl: "https://data-api.ecb.europa.eu/service", // API endpoint
});
```

The base currency can also be overridden per-query:

```ts
const result = await ecb.getRates({
  currencies: ["GBP", "JPY"],
  startDate: "2025-01-15",
  baseCurrency: "USD", // override for this query only
});
```

## API

| Method | Description | Returns |
|---|---|---|
| `getRate(currency, date)` | Single currency, single date | `ExchangeRateResult` |
| `getRateHistory(currency, start, end)` | Single currency, date range | `ExchangeRateResult` |
| `getRates(query)` | Multiple currencies | `ExchangeRatesResult` |
| `getObservations(query)` | Raw observation array | `ExchangeRateObservation[]` |
| `convert(amount, currency, date)` | Currency conversion | `{ amount, rate, date, currency }` |

## Error Handling

```ts
import { EcbApiError, EcbNetworkError, EcbValidationError } from "ecb-exchange-rates-ts";

try {
  await ecb.getRate("USD", "2025-01-15");
} catch (error) {
  if (error instanceof EcbValidationError) { /* invalid input */ }
  if (error instanceof EcbApiError) { /* HTTP error (error.statusCode) */ }
  if (error instanceof EcbNetworkError) { /* timeout / network failure */ }
}
```

## Why this package?

| | ecb-exchange-rates-ts | ecb-euro-exchange-rates | ecb-exchange-rates |
|---|---|---|---|
| Dependencies | **0** | 2 | 3 |
| Bundle size | **~5 KB** | ~50 KB | ~120 KB |
| TypeScript | Native | Partial | No |
| Last updated | 2026 | 2024 | 2015 |
| Configurable base currency | Yes | No | No |
| ESM + CJS | Yes | CJS only | CJS only |

## Requirements

- Node.js >= 18 (uses native `fetch`)

## License

[MIT](LICENSE)
