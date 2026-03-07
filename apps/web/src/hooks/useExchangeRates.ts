import { parseIsoCalendarDateToLocalDate } from "@bcv-rates/domain";
import { useEffect, useState } from "react";
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

function toCalendarDatePart(value: string): string {
  return value.split("T")[0] ?? value;
}

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

export function useExchangeRates() {
  const isOnline = useOnlineStatus();
  const [selectedDate, setSelectedDateState] = useState<string | null>(null);
  const [followCurrentDate, setFollowCurrentDate] = useState(true);

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
  const currentRates = deriveRates(latestRates ?? null);
  const currentEffectiveDate = currentRates
    ? toCalendarDatePart(currentRates.validAt)
    : null;
  const maxSelectableDate = currentRates
    ? toCalendarDatePart(currentRates.nextPublishedAt ?? currentRates.validAt)
    : undefined;

  useEffect(() => {
    if (!currentEffectiveDate || !followCurrentDate) return;
    setSelectedDateState(currentEffectiveDate);
  }, [currentEffectiveDate, followCurrentDate]);

  const selectedRatesQuery = trpc.exchangeRates.getByDate.useQuery(
    { date: selectedDate ?? currentEffectiveDate ?? "1970-01-01" },
    {
      enabled: Boolean(
        selectedDate &&
          currentEffectiveDate &&
          selectedDate !== currentEffectiveDate,
      ),
      meta: { persist: true },
    },
  );

  const selectedRates = deriveRates(selectedRatesQuery.data ?? null);
  const isDefaultSelection =
    !selectedDate ||
    !currentEffectiveDate ||
    selectedDate === currentEffectiveDate;
  const rates = isDefaultSelection ? currentRates : selectedRates;

  const activeQueryError = isDefaultSelection
    ? queryError
    : selectedRatesQuery.error;

  // Derive error message from tRPC error
  const error = activeQueryError
    ? activeQueryError.message || "Error inesperado cargando las tasas."
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

  const syncingRates =
    isOnline && (isFetching || selectedRatesQuery.isFetching);
  const selectedDateText = selectedDate ?? currentEffectiveDate;

  const statusLine = (() => {
    if (!rates) {
      if (!isOnline) {
        return "Sin conexión. Abre la app una vez con internet para guardar las tasas.";
      }
      if (
        !isDefaultSelection &&
        selectedDateText &&
        !selectedRatesQuery.isLoading &&
        !selectedRatesQuery.error
      ) {
        return "No hay tasas disponibles para la fecha seleccionada.";
      }
      if (isLoading || selectedRatesQuery.isLoading || syncingRates) {
        return "Cargando tasas…";
      }
      if (error) return error;
      return "No hay tasas disponibles todavía.";
    }

    if (selectedDateText) {
      return `Fecha seleccionada: ${formatCalendarDate(selectedDateText)}`;
    }

    return `Fecha valor vigente: ${formatCalendarDate(rates.validAt)}`;
  })();

  const secondaryStatusLine = (() => {
    if (!rates || !selectedDateText) return null;

    const appliedDate = toCalendarDatePart(rates.validAt);
    if (selectedDateText !== appliedDate) {
      return `Tasa aplicada: ${formatCalendarDate(rates.validAt)}`;
    }

    if (isDefaultSelection && currentRates?.nextPublishedAt) {
      return `Próxima tasa publicada: ${formatCalendarDate(
        currentRates.nextPublishedAt,
      )}`;
    }

    return null;
  })();

  function setSelectedDate(nextDate: string) {
    setSelectedDateState(nextDate);
    setFollowCurrentDate(nextDate === currentEffectiveDate);
  }

  return {
    rates,
    error,
    isLoading: isLoading || selectedRatesQuery.isLoading,
    isFetching: isFetching || selectedRatesQuery.isFetching,
    syncingRates,
    statusLine,
    secondaryStatusLine,
    isOnline,
    selectedDate,
    setSelectedDate,
    maxSelectableDate,
    currentEffectiveDate,
  };
}
