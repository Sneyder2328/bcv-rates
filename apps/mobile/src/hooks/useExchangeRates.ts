import { formatRate } from "@bcv-rates/domain";
import { useQuery } from "@tanstack/react-query";
import { getTrpcClient } from "../lib/trpcClient";
import { useOnlineStatus } from "./useOnlineStatus";

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

export interface ExchangeRates {
  usd: number;
  eur: number;
  usdPrevious?: number;
  eurPrevious?: number;
  validAt: string;
  fetchedAt: string;
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

interface LatestRateEntry {
  rate: string;
  validAt: string;
  fetchedAt: string;
  previousRate?: string | null;
}

type LatestRatesResponse = {
  USD?: LatestRateEntry | null;
  EUR?: LatestRateEntry | null;
} | null;

function deriveRates(latestRates: LatestRatesResponse): ExchangeRates | null {
  if (!latestRates) return null;

  const usdRate = latestRates.USD
    ? Number.parseFloat(latestRates.USD.rate)
    : Number.NaN;
  const eurRate = latestRates.EUR
    ? Number.parseFloat(latestRates.EUR.rate)
    : Number.NaN;

  const usdPrev =
    latestRates.USD?.previousRate &&
    Number.parseFloat(latestRates.USD.previousRate);
  const eurPrev =
    latestRates.EUR?.previousRate &&
    Number.parseFloat(latestRates.EUR.previousRate);

  if (!Number.isFinite(usdRate) || !Number.isFinite(eurRate)) return null;

  return {
    usd: usdRate,
    eur: eurRate,
    usdPrevious: Number.isFinite(usdPrev) ? (usdPrev as number) : undefined,
    eurPrevious: Number.isFinite(eurPrev) ? (eurPrev as number) : undefined,
    validAt:
      latestRates.USD?.validAt ??
      latestRates.EUR?.validAt ??
      new Date().toISOString(),
    fetchedAt:
      latestRates.USD?.fetchedAt ??
      latestRates.EUR?.fetchedAt ??
      new Date().toISOString(),
  };
}

function deriveStatusLine(
  rates: ExchangeRates | null,
  isOnline: boolean,
  isLoading: boolean,
  syncingRates: boolean,
  error: string | null,
): string {
  if (!rates) {
    if (!isOnline) {
      return "Sin conexión. Abre la app una vez con internet para guardar las tasas.";
    }
    if (isLoading || syncingRates) return "Cargando tasas…";
    if (error) return error;
    return "No hay tasas disponibles todavía.";
  }

  const date = new Date(rates.validAt);
  const dateText = Number.isNaN(date.getTime())
    ? rates.validAt
    : date.toLocaleDateString("es-VE", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });

  return `Fecha Valor: ${dateText}`;
}

// -------------------------------------------------------------------
// Formatter helpers for display
// -------------------------------------------------------------------

export function formatRateDisplay(rate: number): string {
  return formatRate(rate);
}

// -------------------------------------------------------------------
// Hook
// -------------------------------------------------------------------

export function useExchangeRates() {
  const isOnline = useOnlineStatus();

  const {
    data: latestRates,
    error: queryError,
    isFetching,
    isLoading,
  } = useQuery({
    queryKey: ["exchangeRates", "getLatest"],
    queryFn: () => getTrpcClient().exchangeRates.getLatest.query(),
    meta: { persist: true },
  });

  const rates = deriveRates(latestRates ?? null);

  const error = queryError
    ? (queryError as Error).message || "Error inesperado cargando las tasas."
    : null;

  const syncingRates = isOnline && isFetching;

  const statusLine = deriveStatusLine(
    rates,
    isOnline,
    isLoading,
    syncingRates,
    error,
  );

  return {
    rates,
    error,
    isLoading,
    isFetching,
    syncingRates,
    statusLine,
    isOnline,
    lastUpdated: rates?.fetchedAt ?? null,
  };
}
