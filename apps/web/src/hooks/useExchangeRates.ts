import { parseIsoCalendarDateToLocalDate } from "@bcv-rates/domain";
import { useEffect } from "react";
import { trackOnce } from "@/analytics/umami";
import { trpc } from "@/trpc/client";
import { useOnlineStatus } from "@/utils/network";

export interface ExchangeRates {
  usd: number;
  eur: number;
  usdPrevious?: number;
  eurPrevious?: number;
  validAt: string;
  fetchedAt: string;
  nextPublishedAt?: string;
}

type LatestRate = {
  rate: string;
  validAt: string;
  fetchedAt: string;
  previousRate?: string | null;
  nextPublished?: {
    rate: string;
    validAt: string;
    fetchedAt: string;
  } | null;
};

function formatCalendarDate(isoString: string): string {
  const date = parseIsoCalendarDateToLocalDate(isoString);

  return Number.isNaN(date.getTime())
    ? isoString
    : date.toLocaleDateString("es-VE", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
}

function pickSoonestUpcomingValidAt(
  ...candidates: Array<string | undefined>
): string | undefined {
  return candidates
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => left.localeCompare(right))[0];
}

function deriveRates(
  latestRates: {
    USD?: LatestRate | null;
    EUR?: LatestRate | null;
  } | null,
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

  if (!Number.isFinite(usdRate) || !Number.isFinite(eurRate)) {
    return null;
  }

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
    nextPublishedAt: pickSoonestUpcomingValidAt(
      latestRates.USD?.nextPublished?.validAt,
      latestRates.EUR?.nextPublished?.validAt,
    ),
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

  return `Fecha valor vigente: ${formatCalendarDate(rates.validAt)}`;
}

function deriveUpcomingStatusLine(rates: ExchangeRates | null): string | null {
  if (!rates?.nextPublishedAt) return null;

  return `Próxima tasa publicada: ${formatCalendarDate(rates.nextPublishedAt)}`;
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

  useEffect(() => {
    if (!rates) return;
    trackOnce("rates_loaded", "rates_loaded", { online: isOnline });
  }, [isOnline, rates]);

  useEffect(() => {
    if (!queryError) return;

    // Categorize error type from message (privacy-safe)
    const errorMessage = queryError.message || "";
    let category: "network" | "timeout" | "auth" | "server" | "unknown" =
      "unknown";

    if (
      errorMessage.includes("fetch") ||
      errorMessage.includes("network") ||
      errorMessage.includes("connection")
    ) {
      category = "network";
    } else if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("aborted")
    ) {
      category = "timeout";
    } else if (
      errorMessage.includes("unauthorized") ||
      errorMessage.includes("forbidden") ||
      errorMessage.includes("auth")
    ) {
      category = "auth";
    } else if (
      errorMessage.includes("500") ||
      errorMessage.includes("internal") ||
      errorMessage.includes("server")
    ) {
      category = "server";
    }

    // Check if we have cached rates as fallback
    const hasCachedRates = !!rates;

    trackOnce(
      `rates_load_error_${isOnline ? "online" : "offline"}`,
      "rates_load_error",
      {
        online: isOnline,
        category,
        hasCachedRates,
      },
    );
  }, [isOnline, queryError, rates]);

  useEffect(() => {
    if (isOnline) return;
    if (rates) return;
    trackOnce("offline_mode_shown_rates", "offline_mode_shown", {
      surface: "rates",
      hasRates: false,
    });
  }, [isOnline, rates]);

  const syncingRates = isOnline && isFetching;

  const statusLine = deriveStatusLine(
    rates,
    isOnline,
    isLoading,
    syncingRates,
    error,
  );
  const upcomingStatusLine = deriveUpcomingStatusLine(rates);

  return {
    rates,
    error,
    isLoading,
    isFetching,
    syncingRates,
    statusLine,
    upcomingStatusLine,
    isOnline,
  };
}
