import { EcbParseError } from "../errors/index.js";
import type { ExchangeRateObservation, SdmxJsonResponse, SdmxStructure } from "../types/index.js";

/**
 * Parses an SDMX-JSON response from the ECB into typed observations.
 *
 * Single Responsibility: only concerned with SDMX-JSON → typed data transformation.
 *
 * The ECB SDMX-JSON format uses index-based keys:
 * - Series keys (e.g. "0:0:0:0:0") map to dimension value indices
 * - Observation keys (e.g. "0") map to observation-dimension value indices
 * - Observation values are tuples: [rate, ...attributeIndices]
 *
 * @see https://data.ecb.europa.eu/help/api/data
 */
export function parseJsonResponse(data: SdmxJsonResponse): ExchangeRateObservation[] {
  const dataSets = data.dataSets;
  if (!dataSets || dataSets.length === 0) {
    return [];
  }

  const structure = data.structure;
  if (!structure?.dimensions) {
    throw new EcbParseError("SDMX-JSON response missing structure.dimensions.");
  }

  const seriesDims = structure.dimensions.series;
  const obsDims = structure.dimensions.observation;

  const currencyDimIndex = findDimensionIndex(seriesDims, "CURRENCY");
  const denomDimIndex = findDimensionIndex(seriesDims, "CURRENCY_DENOM");
  const timeDimIndex = findObservationDimensionIndex(obsDims, "TIME_PERIOD");

  const currencyValues = seriesDims[currencyDimIndex]?.values;
  const denomValues = seriesDims[denomDimIndex]?.values;
  const timeValues = obsDims[timeDimIndex]?.values;

  if (!currencyValues || !denomValues || !timeValues) {
    throw new EcbParseError("SDMX-JSON response missing dimension values.");
  }

  const observations: ExchangeRateObservation[] = [];

  for (const dataSet of dataSets) {
    const series = dataSet.series;
    if (!series) continue;

    for (const [seriesKey, seriesData] of Object.entries(series)) {
      const dimIndices = seriesKey.split(":").map(Number);

      const currencyIdx = dimIndices[currencyDimIndex];
      const denomIdx = dimIndices[denomDimIndex];

      if (currencyIdx === undefined || denomIdx === undefined) {
        continue;
      }

      const currency = currencyValues[currencyIdx]?.id;
      const baseCurrency = denomValues[denomIdx]?.id;

      if (!currency || !baseCurrency) continue;

      for (const [obsKey, obsValues] of Object.entries(seriesData.observations)) {
        const timeIdx = Number(obsKey);
        const date = timeValues[timeIdx]?.id;
        const rate = obsValues[0];

        if (!date || rate === null || rate === undefined) continue;

        observations.push({ date, currency, baseCurrency, rate });
      }
    }
  }

  return observations;
}

/**
 * Safely parses a raw JSON string into an SdmxJsonResponse.
 */
export function parseSdmxJson(raw: string): SdmxJsonResponse {
  try {
    return JSON.parse(raw) as SdmxJsonResponse;
  } catch (error) {
    throw new EcbParseError("Failed to parse ECB JSON response.", error);
  }
}

// ── Private helpers ────────────────────────────────────────────────────

function findDimensionIndex(dims: SdmxStructure["dimensions"]["series"], id: string): number {
  const index = dims.findIndex((d) => d.id === id);
  if (index === -1) {
    throw new EcbParseError(`Missing series dimension "${id}" in SDMX-JSON structure.`);
  }
  return index;
}

function findObservationDimensionIndex(
  dims: SdmxStructure["dimensions"]["observation"],
  id: string,
): number {
  const index = dims.findIndex((d) => d.id === id);
  if (index === -1) {
    throw new EcbParseError(`Missing observation dimension "${id}" in SDMX-JSON structure.`);
  }
  return index;
}
