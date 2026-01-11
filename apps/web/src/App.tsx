import { useEffect, useMemo, useState } from "react";
import { Toaster } from "sonner";
import { useAuth } from "./auth/AuthProvider.tsx";
import { AuthDialog } from "./components/AuthDialog.tsx";
import { BackgroundDecoration } from "./components/BackgroundDecoration.tsx";
import { CurrencyInput } from "./components/CurrencyInput.tsx";
import { CustomRateInput } from "./components/CustomRateInput.tsx";
import { ExchangeRateFooter } from "./components/ExchangeRateFooter.tsx";
import { ExchangeRateHeader } from "./components/ExchangeRateHeader.tsx";
import { Navbar } from "./components/Navbar.tsx";
import { SettingsDialog } from "./components/SettingsDialog.tsx";
import { Card, CardContent } from "./components/ui/card.tsx";
import { trpc } from "./trpc/client.ts";
import { formatAmount, formatRate, parseAmount } from "./utils/formatters.ts";

function App() {
  const { user } = useAuth();

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
  const [customUnitLabel, setCustomUnitLabel] = useState("★");

  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const customRatesQuery = trpc.customRates.list.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) {
      setCustomUnitLabel("★");
    }
  }, [user]);

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
        <Navbar
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenAuth={(mode) => {
            setAuthMode(mode);
            setAuthDialogOpen(true);
          }}
        />

        <Card className="border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/5">
          {/* Decorative Top Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />

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
                  Tasas Personalizadas
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
              unitLabel={customUnitLabel}
            />

            {user && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 ml-1">
                    Guardadas
                  </p>
                  {customRatesQuery.data?.items.length ? (
                    <p className="text-xs text-zinc-600">
                      {customRatesQuery.data.items.length}
                    </p>
                  ) : null}
                </div>

                {customRatesQuery.isLoading ? (
                  <p className="text-sm text-zinc-500">Cargando…</p>
                ) : customRatesQuery.error ? (
                  <p className="text-sm text-red-300">
                    Error cargando tasas: {customRatesQuery.error.message}
                  </p>
                ) : customRatesQuery.data?.items.length ? (
                  <div className="grid grid-cols-2 gap-2">
                    {customRatesQuery.data.items.map((r) => {
                      const n = Number(r.rate);
                      const formatted = Number.isFinite(n)
                        ? formatRate(n)
                        : r.rate;
                      const isActive = customUnitLabel === r.label;

                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            setCustomUnitLabel(r.label);
                            onCustomRateChange(formatted);
                          }}
                          className={[
                            "rounded-xl border px-3 py-2 text-left transition-colors",
                            isActive
                              ? "border-indigo-500/50 bg-indigo-500/10"
                              : "border-zinc-800/60 bg-zinc-950/40 hover:border-zinc-700/70",
                          ].join(" ")}
                          title={`Usar ${r.label}`}
                        >
                          <p className="text-sm font-semibold text-zinc-100 truncate">
                            {r.label}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            1 {r.label} = {formatted} Bs
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">
                    Aún no tienes tasas guardadas. Abre Configuraciones para
                    crear una.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <ExchangeRateFooter fetchedAt={rates?.fetchedAt} />
      </div>
      <Toaster position="top-center" theme="dark" />

      <AuthDialog
        open={authDialogOpen}
        mode={authMode}
        onClose={() => setAuthDialogOpen(false)}
        onModeChange={(m) => setAuthMode(m)}
      />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
