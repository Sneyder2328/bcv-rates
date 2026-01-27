/**
 * Parse an ISO date-time string (from the API) into a local Date representing
 * the same calendar date.
 *
 * Example input: "2026-01-22T00:00:00.000Z"
 * The API date represents a calendar date, not a moment in time.
 */
export function parseIsoCalendarDateToLocalDate(isoString: string): Date {
  const datePart = isoString.split("T")[0]; // "YYYY-MM-DD"
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatChartDate(date: Date): {
  short: string;
  full: string;
} {
  return {
    short: date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    full: date.toLocaleDateString(),
  };
}
