import {
  foreignToVes,
  formatAmount,
  parseAmount,
  vesToForeign,
} from "@bcv-rates/domain";
import { useState } from "react";
import { trackDebounced } from "@/analytics/umami";
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

    const customRateNum = parseAmount(customRate);
    if (amount > 0) {
      trackDebounced(
        "convert",
        "convert",
        {
          input: "ves",
          hasCustomRate: Boolean(customRateNum && customRateNum > 0),
        },
        800,
      );
    }

    setUsd(formatAmount(vesToForeign(amount, rates.usd)));
    setEur(formatAmount(vesToForeign(amount, rates.eur)));

    // Also update custom amount if custom rate is set
    if (customRateNum && customRateNum > 0) {
      setCustomAmount(formatAmount(vesToForeign(amount, customRateNum)));
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

    const customRateNum = parseAmount(customRate);
    if (amount > 0) {
      trackDebounced(
        "convert",
        "convert",
        {
          input: "usd",
          hasCustomRate: Boolean(customRateNum && customRateNum > 0),
        },
        800,
      );
    }

    const ves = foreignToVes(amount, rates.usd);
    setBolivars(formatAmount(ves));
    setEur(formatAmount(vesToForeign(ves, rates.eur)));

    // Also update custom amount if custom rate is set
    if (customRateNum && customRateNum > 0) {
      setCustomAmount(formatAmount(vesToForeign(ves, customRateNum)));
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

    const customRateNum = parseAmount(customRate);
    if (amount > 0) {
      trackDebounced(
        "convert",
        "convert",
        {
          input: "eur",
          hasCustomRate: Boolean(customRateNum && customRateNum > 0),
        },
        800,
      );
    }

    const ves = foreignToVes(amount, rates.eur);
    setBolivars(formatAmount(ves));
    setUsd(formatAmount(vesToForeign(ves, rates.usd)));

    // Also update custom amount if custom rate is set
    if (customRateNum && customRateNum > 0) {
      setCustomAmount(formatAmount(vesToForeign(ves, customRateNum)));
    }
  }

  function onCustomRateChange(next: string) {
    setCustomRate(next);
    // Recalculate custom amount if VES has a value
    const vesAmount = parseAmount(bolivars);
    const rateValue = parseAmount(next);

    if (vesAmount !== null && rateValue !== null && rateValue > 0) {
      setCustomAmount(formatAmount(vesToForeign(vesAmount, rateValue)));
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

    if (amount > 0) {
      trackDebounced(
        "convert",
        "convert",
        { input: "custom", hasCustomRate: true },
        800,
      );
    }

    const ves = foreignToVes(amount, customRateNum);
    setBolivars(formatAmount(ves));
    setUsd(formatAmount(vesToForeign(ves, rates.usd)));
    setEur(formatAmount(vesToForeign(ves, rates.eur)));
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
