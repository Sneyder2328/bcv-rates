import {
  formatChartDate,
  parseIsoCalendarDateToLocalDate,
} from "@bcv-rates/domain";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
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
    enabled: true,
    meta: { persist: true },
  });

  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!rawData || rawData.length === 0) return [];

    // API returns data ordered by date desc; chart needs old → new (left → right)
    return [...rawData].reverse().map((item) => {
      const localDate = parseIsoCalendarDateToLocalDate(item.date);
      const { short, full } = formatChartDate(localDate);
      return {
        value: Number.parseFloat(item.rate),
        label: short,
        fullDate: full,
      };
    });
  }, [rawData]);

  const error = queryError
    ? (queryError as Error).message || "Error cargando historial."
    : null;

  return {
    chartData,
    isLoading,
    isFetching,
    error,
    isEmpty: !isLoading && chartData.length === 0,
  };
}
