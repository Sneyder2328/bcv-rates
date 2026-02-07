import {
  formatChartDate,
  parseIsoCalendarDateToLocalDate,
} from "@bcv-rates/domain";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "../auth";
import { getTrpcClient } from "../lib/trpcClient";

export type HistoryCurrency = "USD" | "EUR";
export type HistoryRange = 7 | 14 | 30 | 90;

export interface ChartDataPoint {
  /** Value for the LineChart data array */
  value: number;
  /** Short label for X-axis (e.g. "Jan 22") */
  label: string;
  /** Full date for tooltip display */
  fullDate: string;
}

export function useHistoricalRates(
  currency: HistoryCurrency,
  days: HistoryRange,
) {
  const { user } = useAuth();

  const {
    data: rawData,
    isLoading,
    isFetching,
    error: queryError,
  } = useQuery({
    queryKey: ["historicalRates", "getHistory", currency, days],
    queryFn: () =>
      getTrpcClient().historicalRates.getHistory.query({
        currency,
        limit: days,
      }),
    // Require authentication — the API endpoint is protected
    enabled: !!user,
    meta: { persist: true },
  });

  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!rawData || rawData.length === 0) return [];

    // API returns data ordered by date desc; chart needs old → new (left → right)
    return [...rawData]
      .reverse()
      .map((item) => {
        const value = Number.parseFloat(item.rate);
        if (!Number.isFinite(value)) return null;

        const localDate = parseIsoCalendarDateToLocalDate(item.date);
        const { short, full } = formatChartDate(localDate);
        return {
          value,
          label: short,
          fullDate: full,
        };
      })
      .filter((p): p is ChartDataPoint => p !== null);
  }, [rawData]);

  const error =
    user && queryError
      ? queryError instanceof Error
        ? queryError.message || "Error cargando historial."
        : "Error cargando historial."
      : null;

  return {
    chartData,
    isLoading,
    isFetching,
    error,
    isEmpty: !isLoading && chartData.length === 0,
  };
}
