import {
  formatAmount,
  parseIsoCalendarDateToLocalDate,
} from "@bcv-rates/domain";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { trackOnce } from "../analytics/umami";
import { getTrpcClient } from "../lib/trpcClient";
import { useOnlineStatus } from "./useOnlineStatus";

export interface ExchangeRates {
  usd: number;
  eur: number;
  usdPrevious?: number;
  eurPrevious?: number;
  validAt: string;
  fetchedAt: string;
  nextPublishedAt?: string;
}

interface LatestRateEntry {
  rate: string;
  validAt: string;
  fetchedAt: string;
  previousRate?: string | null;
  nextPublished?: {
    rate: string;
    validAt: string;
    fetchedAt: string;
  } | null;
}

type LatestRatesResponse = {
  USD?: LatestRateEntry | null;
  EUR?: LatestRateEntry | null;
} | null;

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
    nextPublishedAt: pickSoonestUpcomingValidAt(
      latestRates.USD?.nextPublished?.validAt,
      latestRates.EUR?.nextPublished?.validAt,
    ),
  };
}

function categorizeErrorMessage(errorMessage: string) {
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

  return category;
}

export function formatRateDisplay(rate: number): string {
  return formatAmount(rate);
}

export function useExchangeRates() {
  const isOnline = useOnlineStatus();
  const [selectedDate, setSelectedDateState] = useState<string | null>(null);
  const [followCurrentDate, setFollowCurrentDate] = useState(true);

  const latestRatesQuery = useQuery({
    queryKey: ["exchangeRates", "getLatest"],
    queryFn: () => getTrpcClient().exchangeRates.getLatest.query(),
    meta: { persist: true },
  });

  const {
    data: latestRates,
    error: latestQueryError,
    isFetching: latestIsFetching,
    isLoading: latestIsLoading,
  } = latestRatesQuery;

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

  const selectedRatesQuery = useQuery({
    queryKey: [
      "exchangeRates",
      "getByDate",
      selectedDate ?? currentEffectiveDate,
    ],
    queryFn: () =>
      getTrpcClient().exchangeRates.getByDate.query({
        date: selectedDate ?? currentEffectiveDate ?? "1970-01-01",
      }),
    enabled: Boolean(
      selectedDate &&
        currentEffectiveDate &&
        selectedDate !== currentEffectiveDate,
    ),
    meta: { persist: true },
  });

  const selectedRates = deriveRates(selectedRatesQuery.data ?? null);
  const isDefaultSelection =
    !selectedDate ||
    !currentEffectiveDate ||
    selectedDate === currentEffectiveDate;
  const rates = isDefaultSelection ? currentRates : selectedRates;

  const activeQueryError = isDefaultSelection
    ? latestQueryError
    : selectedRatesQuery.error;
  const error = activeQueryError
    ? activeQueryError instanceof Error
      ? activeQueryError.message || "Error inesperado cargando las tasas."
      : "Error inesperado cargando las tasas."
    : null;

  useEffect(() => {
    if (!rates) return;
    trackOnce("rates_loaded", "rates_loaded", { online: isOnline });
  }, [isOnline, rates]);

  useEffect(() => {
    if (!activeQueryError) return;

    const errorMessage =
      activeQueryError instanceof Error
        ? activeQueryError.message
        : String(activeQueryError);

    trackOnce(
      `rates_load_error_${isOnline ? "online" : "offline"}`,
      "rates_load_error",
      {
        online: isOnline,
        category: categorizeErrorMessage(errorMessage),
        hasCachedRates: Boolean(rates),
      },
    );
  }, [activeQueryError, isOnline, rates]);

  useEffect(() => {
    if (isOnline) return;
    if (rates) return;
    trackOnce("offline_mode_shown_rates", "offline_mode_shown", {
      surface: "rates",
      hasRates: false,
    });
  }, [isOnline, rates]);

  const syncingRates =
    isOnline && (latestIsFetching || selectedRatesQuery.isFetching);
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
      if (latestIsLoading || selectedRatesQuery.isLoading || syncingRates) {
        return "Cargando tasas…";
      }
      if (error) return error;
      return "No hay tasas disponibles todavía.";
    }

    if (!isDefaultSelection && selectedDateText) {
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
    isLoading: latestIsLoading || selectedRatesQuery.isLoading,
    isFetching: latestIsFetching || selectedRatesQuery.isFetching,
    syncingRates,
    statusLine,
    secondaryStatusLine,
    isOnline,
    lastUpdated: rates?.fetchedAt ?? null,
    selectedDate,
    setSelectedDate,
    currentEffectiveDate,
    maxSelectableDate,
  };
}
