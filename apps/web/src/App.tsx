import { useMemo, useState } from "react";
import { Toaster } from "sonner";
import { Card, CardContent } from "./components/ui/card.tsx";
import { BackgroundDecoration } from "./components/BackgroundDecoration.tsx";
import { CurrencyInput } from "./components/CurrencyInput.tsx";
import { CustomRateInput } from "./components/CustomRateInput.tsx";
import { ExchangeRateFooter } from "./components/ExchangeRateFooter.tsx";
import { ExchangeRateHeader } from "./components/ExchangeRateHeader.tsx";
import {
  formatAmount,
  parseAmount,
} from "./utils/formatters.ts";
import { trpc } from "./trpc/client.ts";

function App() {
  // Use tRPC to fetch the latest exchange rates with React Query
  const {
    data: latestRates,
    isLoading: loading,
    error: queryError,
  } = trpc.exchangeRates.getLatest.useQuery();

  // Derive rates from the tRPC response
  const rates = useMemo(() => {
    if (!latestRates) return null;

    const usdRate = latestRates.USD
      ? Number.parseFloat(latestRates.USD.rate)
      : Number.NaN;
    const eurRate = latestRates.EUR
      ? Number.parseFloat(latestRates.EUR.rate)
      : Number.NaN;

    if (!Number.isFinite(usdRate) || !Number.isFinite(eurRate)) {
      return null;
    }

    return {
      usd: usdRate,
      eur: eurRate,
      validAt:
        latestRates.USD?.validAt ??
        latestRates.EUR?.validAt ??
        new Date().toISOString(),
      fetchedAt:
        latestRates.USD?.fetchedAt ??
        latestRates.EUR?.fetchedAt ??
        new Date().toISOString(),
    };
  }, [latestRates]);

  // Derive error message from tRPC error
  const error = useMemo(() => {
    if (!queryError) return null;
    return queryError.message || "Error inesperado cargando las tasas.";
  }, [queryError]);

  const [bolivars, setBolivars] = useState("");
  const [usd, setUsd] = useState("");
  const [eur, setEur] = useState("");
  const [customRate, setCustomRate] = useState("");
  const [customAmount, setCustomAmount] = useState("");

  const statusLine = useMemo(() => {
    if (loading) return "Cargando tasas…";
    if (error) return error;
    if (!rates) return "No hay tasas disponibles todavía.";

    const date = new Date(rates.validAt);
    const dateText = Number.isNaN(date.getTime())
      ? rates.validAt
      : date.toLocaleDateString("es-VE", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });

    return `Fecha Valor: ${dateText}`;
  }, [error, loading, rates]);

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

  const disabled = loading || !rates;

  return (
    <div className="relative min-h-screen w-full bg-[#09090b] text-zinc-100 flex items-center justify-center p-2 sm:p-4 font-sans overflow-hidden selection:bg-indigo-500/30">
      <BackgroundDecoration />

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <Card className="border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/5">
          {/* Decorative Top Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />

          <ExchangeRateHeader loading={loading} statusLine={statusLine} />

          <CardContent className="space-y-4 pt-4 sm:space-y-6 sm:pt-6">
            {/* VES Input */}
            <CurrencyInput
              id="ves"
              label="Bolívares (VES)"
              value={bolivars}
              onChange={onBolivarsChange}
              disabled={disabled}
              symbol="Bs."
              focusColor="indigo"
              inputSize="lg"
            />

            {/* Divider */}
            <div className="relative py-1 sm:py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800/50"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#121215] px-2 text-zinc-600 font-medium">
                  Tasas de Cambio
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              {/* USD Input */}
              <CurrencyInput
                id="usd"
                label="Dólares (USD)"
                value={usd}
                onChange={onUsdChange}
                disabled={disabled}
                symbol="$"
                focusColor="emerald"
                exchangeRate={
                  rates ? `1 USD = ${formatAmount(rates.usd)} Bs` : undefined
                }
              />

              {/* EUR Input */}
              <CurrencyInput
                id="eur"
                label="Euros (EUR)"
                value={eur}
                onChange={onEurChange}
                disabled={disabled}
                symbol="€"
                focusColor="blue"
                exchangeRate={
                  rates ? `1 EUR = ${formatAmount(rates.eur)} Bs` : undefined
                }
              />
            </div>

            {/* Custom Rate Divider */}
            <div className="relative py-1 sm:py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800/50"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#121215] px-2 text-zinc-600 font-medium">
                  Tasa Personalizada
                </span>
              </div>
            </div>

            {/* Custom Rate Input */}
            <CustomRateInput
              rateValue={customRate}
              amountValue={customAmount}
              onRateChange={onCustomRateChange}
              onAmountChange={onCustomAmountChange}
              disabled={disabled}
            />
          </CardContent>
        </Card>

        <ExchangeRateFooter fetchedAt={rates?.fetchedAt} />
      </div>
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}

export default App;
