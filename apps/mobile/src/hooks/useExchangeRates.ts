import { useQuery } from "@tanstack/react-query";
import { getTrpcClient } from "../lib/trpcClient";
import { useOnlineStatus } from "./useOnlineStatus";

// Shape assumption:
// Matches `apps/api/src/trpc/app-router.type.ts` output for `exchangeRates.getLatest`.
type LatestRate = {
  rate: string;
  validAt: string;
  fetchedAt: string;
  previousRate?: string | null;
} | null;

type LatestRatesResponse = {
  USD: LatestRate;
  EUR: LatestRate;
};

export interface ExchangeRates {
  usd: number;
  eur: number;
  usdPrevious?: number;
  eurPrevious?: number;
  validAt: string;
  fetchedAt: string;
}

function deriveRates(
  latestRates: LatestRatesResponse | null,
): ExchangeRates | null {
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
): string | undefined {
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

export function useExchangeRates() {
  const isOnline = useOnlineStatus();

  const latestRatesQuery = useQuery({
    queryKey: ["exchangeRates.getLatest"],
    queryFn: async () => {
      // NOTE: this uses the mobile tRPC client (httpBatchLink to `/api/trpc`).
      return (await getTrpcClient().exchangeRates.getLatest.query()) as LatestRatesResponse;
    },
    meta: { persist: true },
    // Prefer cached data when offline; when online, it will refetch as needed.
    networkMode: "offlineFirst",
  });

  const {
    data,
    error: queryError,
    isFetching,
    isLoading,
    dataUpdatedAt,
  } = latestRatesQuery;

  const rates = deriveRates((data ?? null) as LatestRatesResponse | null);
  const error = queryError instanceof Error ? queryError.message : null;

  const syncingRates = isOnline && isFetching;
  const statusLine = deriveStatusLine(
    rates,
    isOnline,
    isLoading,
    syncingRates,
    error,
  );

  // `dataUpdatedAt` is a stable "last cache update" timestamp, useful even offline.
  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toISOString()
    : null;

  return {
    rates,
    statusLine,
    syncingRates,
    lastUpdated,
    isOnline,
    isLoading,
    isFetching,
    error,
  };
}
