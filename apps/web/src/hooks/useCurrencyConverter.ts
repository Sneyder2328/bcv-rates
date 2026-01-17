import { useState } from "react";
import { formatAmount, parseAmount } from "@/utils/formatters";
import type { ExchangeRates } from "./useExchangeRates";

export function useCurrencyConverter(rates: ExchangeRates | null) {
  const [bolivars, setBolivars] = useState("");
  const [usd, setUsd] = useState("");
  const [eur, setEur] = useState("");
  const [customRate, setCustomRate] = useState("");
  const [customAmount, setCustomAmount] = useState("");

  function onBolivarsChange(next: string) {
    setBolivars(next);
    if (!rates) return;

    const amount = parseAmount(next);
    if (amount === null) {
      setUsd("");
      setEur("");
      setCustomAmount("");
      return;
    }

    setUsd(formatAmount(amount / rates.usd));
    setEur(formatAmount(amount / rates.eur));

    // Also update custom amount if custom rate is set
    const customRateNum = parseAmount(customRate);
    if (customRateNum && customRateNum > 0) {
      setCustomAmount(formatAmount(amount / customRateNum));
    }
  }

  function onUsdChange(next: string) {
    setUsd(next);
    if (!rates) return;

    const amount = parseAmount(next);
    if (amount === null) {
      setBolivars("");
      setEur("");
      setCustomAmount("");
      return;
    }

    const ves = amount * rates.usd;
    setBolivars(formatAmount(ves));
    setEur(formatAmount(ves / rates.eur));

    // Also update custom amount if custom rate is set
    const customRateNum = parseAmount(customRate);
    if (customRateNum && customRateNum > 0) {
      setCustomAmount(formatAmount(ves / customRateNum));
    }
  }

  function onEurChange(next: string) {
    setEur(next);
    if (!rates) return;

    const amount = parseAmount(next);
    if (amount === null) {
      setBolivars("");
      setUsd("");
      setCustomAmount("");
      return;
    }

    const ves = amount * rates.eur;
    setBolivars(formatAmount(ves));
    setUsd(formatAmount(ves / rates.usd));

    // Also update custom amount if custom rate is set
    const customRateNum = parseAmount(customRate);
    if (customRateNum && customRateNum > 0) {
      setCustomAmount(formatAmount(ves / customRateNum));
    }
  }

  function onCustomRateChange(next: string) {
    setCustomRate(next);
    // Recalculate custom amount if VES has a value
    const vesAmount = parseAmount(bolivars);
    const rateValue = parseAmount(next);

    if (vesAmount !== null && rateValue !== null && rateValue > 0) {
      setCustomAmount(formatAmount(vesAmount / rateValue));
    } else {
      setCustomAmount("");
    }
  }

  function onCustomAmountChange(next: string) {
    setCustomAmount(next);
    if (!rates) return;

    const customRateNum = parseAmount(customRate);
    if (!customRateNum || customRateNum <= 0) return;

    const amount = parseAmount(next);
    if (amount === null) {
      setBolivars("");
      setUsd("");
      setEur("");
      return;
    }

    const ves = amount * customRateNum;
    setBolivars(formatAmount(ves));
    setUsd(formatAmount(ves / rates.usd));
    setEur(formatAmount(ves / rates.eur));
  }

  return {
    bolivars,
    usd,
    eur,
    customRate,
    customAmount,
    onBolivarsChange,
    onUsdChange,
    onEurChange,
    onCustomRateChange,
    onCustomAmountChange,
  };
}
