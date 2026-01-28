export function parseAmount(raw: string): number | null {
  // Remove spaces and handle both formats:
  // - European/Latin: 1.234,56 (thousands: ., decimal: ,)
  // - US: 1,234.56 (thousands: ,, decimal: .)
  const cleaned = raw.trim().replace(/\s+/g, "");

  // Remove thousand separators (both . and ,) and convert decimal separator
  // If the last occurrence of , or . is the decimal separator, keep it
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  let normalized: string;

  if (lastComma > lastDot) {
    // Format is likely European: 1.234,56
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // Format is likely US: 1,234.56
    normalized = cleaned.replace(/,/g, "");
  } else {
    // No decimal separator found
    normalized = cleaned.replace(/[.,]/g, "");
  }

  if (!normalized) return null;
  const n = Number(normalized);
  if (Number.isNaN(n)) return null;
  return n;
}

export function formatAmount(n: number) {
  // Use es-VE locale for consistent formatting (thousands: ., decimal: ,)
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatRate(n: number) {
  return new Intl.NumberFormat("es-VE", {
    maximumFractionDigits: 8,
    minimumFractionDigits: 2,
  }).format(n);
}
