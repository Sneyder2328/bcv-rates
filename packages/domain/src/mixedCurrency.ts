import { foreignToVes, vesToForeign } from "./conversion.js";

export type SupportedCurrency = "VES" | "USD" | "EUR";
export type ArithmeticOperation = "add" | "subtract";

export interface MixedCurrencyRates {
  usd: number;
  eur: number;
}

export interface MixedCurrencyEntry {
  amount: number;
  currency: SupportedCurrency;
  operation: ArithmeticOperation;
}

export interface MixedCurrencyTotals {
  totalVes: number;
  totalUsd: number;
  totalEur: number;
}

export function toVesAmount(
  amount: number,
  currency: SupportedCurrency,
  rates: MixedCurrencyRates,
): number {
  switch (currency) {
    case "VES":
      return amount;
    case "USD":
      return foreignToVes(amount, rates.usd);
    case "EUR":
      return foreignToVes(amount, rates.eur);
  }
}

export function fromVesAmount(
  amount: number,
  currency: SupportedCurrency,
  rates: MixedCurrencyRates,
): number {
  switch (currency) {
    case "VES":
      return amount;
    case "USD":
      return vesToForeign(amount, rates.usd);
    case "EUR":
      return vesToForeign(amount, rates.eur);
  }
}

export function calculateMixedCurrencyTotals(
  entries: MixedCurrencyEntry[],
  rates: MixedCurrencyRates,
): MixedCurrencyTotals {
  const totalVes = entries.reduce((sum, entry) => {
    const amountInVes = toVesAmount(entry.amount, entry.currency, rates);
    return sum + (entry.operation === "subtract" ? -amountInVes : amountInVes);
  }, 0);

  return {
    totalVes,
    totalUsd: fromVesAmount(totalVes, "USD", rates),
    totalEur: fromVesAmount(totalVes, "EUR", rates),
  };
}
