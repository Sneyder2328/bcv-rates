import { trpc } from "@/trpc/client";
import { useOnlineStatus } from "@/utils/network";

export interface ExchangeRates {
  usd: number;
  eur: number;
  validAt: string;
  fetchedAt: string;
}

function deriveRates(
  latestRates: {
    USD?: { rate: string; validAt: string; fetchedAt: string } | null;
    EUR?: { rate: string; validAt: string; fetchedAt: string } | null;
  } | null,
): ExchangeRates | null {
  if (!latestRates) return null;

  const usdRate = latestRates.USD
    ? Number.parseFloat(latestRates.USD.rate)
    : Number.NaN;
  const eurRate = latestRates.EUR
    ? Number.parseFloat(latestRates.EUR.rate)
    : Number.NaN;

  if (!Number.isFinite(usdRate) || !Number.isFinite(eurRate)) {
    return null;
  }

  return {
    usd: usdRate,
    eur: eurRate,
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

export function useExchangeRates() {
  const isOnline = useOnlineStatus();

  const latestRatesQuery = trpc.exchangeRates.getLatest.useQuery(undefined, {
    meta: { persist: true },
  });

  const {
    data: latestRates,
    error: queryError,
    isFetching,
    isLoading,
  } = latestRatesQuery;

  // Derive rates from the tRPC response
  const rates = deriveRates(latestRates ?? null);

  // Derive error message from tRPC error
  const error = queryError
    ? queryError.message || "Error inesperado cargando las tasas."
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
  };
}
