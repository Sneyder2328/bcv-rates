import {
  type ArithmeticOperation,
  calculateMixedCurrencyTotals,
  parseAmount,
  type SupportedCurrency,
} from "@bcv-rates/domain";
import { useState } from "react";
import type { ExchangeRates } from "./useExchangeRates";

export type CalculatorEntry = {
  id: string;
  amount: string;
  currency: SupportedCurrency;
  operation: ArithmeticOperation;
};

function createEntry(): CalculatorEntry {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    amount: "",
    currency: "VES",
    operation: "add",
  };
}

export function useMixedCurrencyCalculator(rates: ExchangeRates | null) {
  const [entries, setEntries] = useState<CalculatorEntry[]>(() => [
    createEntry(),
  ]);
  const [resultCurrency, setResultCurrency] =
    useState<SupportedCurrency>("VES");

  const parsedEntries = entries.flatMap((entry) => {
    const parsedAmount = parseAmount(entry.amount);

    if (parsedAmount === null) {
      return [];
    }

    return [
      {
        amount: Math.abs(parsedAmount),
        currency: entry.currency,
        operation: entry.operation,
      },
    ];
  });

  const totals = rates
    ? calculateMixedCurrencyTotals(parsedEntries, {
        usd: rates.usd,
        eur: rates.eur,
      })
    : null;

  const resultAmount = (() => {
    if (!totals) return null;

    switch (resultCurrency) {
      case "USD":
        return totals.totalUsd;
      case "EUR":
        return totals.totalEur;
      case "VES":
        return totals.totalVes;
    }
  })();

  function addEntry() {
    setEntries((current) => [...current, createEntry()]);
  }

  function updateEntry(
    id: string,
    patch: Partial<Pick<CalculatorEntry, "amount" | "currency" | "operation">>,
  ) {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    );
  }

  function removeEntry(id: string) {
    setEntries((current) => {
      if (current.length === 1) {
        return [{ ...current[0], amount: "" }];
      }

      return current.filter((entry) => entry.id !== id);
    });
  }

  function clearEntries() {
    setEntries([createEntry()]);
    setResultCurrency("VES");
  }

  return {
    entries,
    totals,
    resultAmount,
    resultCurrency,
    setResultCurrency,
    addEntry,
    updateEntry,
    removeEntry,
    clearEntries,
    validEntriesCount: parsedEntries.length,
  };
}
