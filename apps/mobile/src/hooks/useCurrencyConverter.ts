import {
  foreignToVes,
  formatAmount,
  parseAmount,
  vesToForeign,
} from "@bcv-rates/domain";
import { useEffect, useEffectEvent, useState } from "react";
import { trackDebounced } from "../analytics/umami";
import type { ExchangeRates } from "./useExchangeRates";

type SourceField = "ves" | "usd" | "eur" | "custom" | null;
type ApplyOptions = {
  track?: boolean;
  customRateOverride?: number | null;
};

export function useCurrencyConverter(rates: ExchangeRates | null) {
  const [bolivars, setBolivars] = useState("");
  const [usd, setUsd] = useState("");
  const [eur, setEur] = useState("");
  const [customRate, setCustomRate] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [lastEditedField, setLastEditedField] = useState<SourceField>(null);

  function resolveCustomRate(override?: number | null) {
    return override ?? parseAmount(customRate);
  }

  function applyBolivars(next: string, options: ApplyOptions = {}) {
    const { track = true, customRateOverride } = options;
    setBolivars(next);
    if (!rates) return;

    const amount = parseAmount(next);
    if (amount === null) {
      setUsd("");
      setEur("");
      setCustomAmount("");
      return;
    }

    const customRateNum = resolveCustomRate(customRateOverride);
    if (track && amount > 0) {
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

    if (customRateNum && customRateNum > 0) {
      setCustomAmount(formatAmount(vesToForeign(amount, customRateNum)));
      return;
    }

    setCustomAmount("");
  }

  function applyUsd(next: string, options: ApplyOptions = {}) {
    const { track = true, customRateOverride } = options;
    setUsd(next);
    if (!rates) return;

    const amount = parseAmount(next);
    if (amount === null) {
      setBolivars("");
      setEur("");
      setCustomAmount("");
      return;
    }

    const customRateNum = resolveCustomRate(customRateOverride);
    if (track && amount > 0) {
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

    if (customRateNum && customRateNum > 0) {
      setCustomAmount(formatAmount(vesToForeign(ves, customRateNum)));
      return;
    }

    setCustomAmount("");
  }

  function applyEur(next: string, options: ApplyOptions = {}) {
    const { track = true, customRateOverride } = options;
    setEur(next);
    if (!rates) return;

    const amount = parseAmount(next);
    if (amount === null) {
      setBolivars("");
      setUsd("");
      setCustomAmount("");
      return;
    }

    const customRateNum = resolveCustomRate(customRateOverride);
    if (track && amount > 0) {
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

    if (customRateNum && customRateNum > 0) {
      setCustomAmount(formatAmount(vesToForeign(ves, customRateNum)));
      return;
    }

    setCustomAmount("");
  }

  function applyCustomAmount(next: string, options: ApplyOptions = {}) {
    const { track = true, customRateOverride } = options;
    setCustomAmount(next);
    if (!rates) return;

    const customRateNum = resolveCustomRate(customRateOverride);
    if (!customRateNum || customRateNum <= 0) {
      return;
    }

    const amount = parseAmount(next);
    if (amount === null) {
      setBolivars("");
      setUsd("");
      setEur("");
      return;
    }

    if (track && amount > 0) {
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

  function onBolivarsChange(next: string) {
    setLastEditedField("ves");
    applyBolivars(next);
  }

  function onUsdChange(next: string) {
    setLastEditedField("usd");
    applyUsd(next);
  }

  function onEurChange(next: string) {
    setLastEditedField("eur");
    applyEur(next);
  }

  function onCustomRateChange(next: string) {
    setCustomRate(next);
    const nextCustomRate = parseAmount(next);

    switch (lastEditedField) {
      case "usd":
        applyUsd(usd, { track: false, customRateOverride: nextCustomRate });
        return;
      case "eur":
        applyEur(eur, { track: false, customRateOverride: nextCustomRate });
        return;
      case "custom":
        applyCustomAmount(customAmount, {
          track: false,
          customRateOverride: nextCustomRate,
        });
        return;
      default:
        applyBolivars(bolivars, {
          track: false,
          customRateOverride: nextCustomRate,
        });
    }
  }

  function onCustomAmountChange(next: string) {
    setLastEditedField("custom");
    applyCustomAmount(next);
  }

  const reapplyForCurrentRates = useEffectEvent(() => {
    switch (lastEditedField) {
      case "ves":
        applyBolivars(bolivars, { track: false });
        return;
      case "usd":
        applyUsd(usd, { track: false });
        return;
      case "eur":
        applyEur(eur, { track: false });
        return;
      case "custom":
        applyCustomAmount(customAmount, { track: false });
        return;
      default:
        return;
    }
  });

  useEffect(() => {
    if (!rates) return;
    reapplyForCurrentRates();
  }, [rates]);

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
