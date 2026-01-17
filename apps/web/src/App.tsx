//import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { AuthDialog } from "@/components/AuthDialog";
import { BackgroundDecoration } from "@/components/BackgroundDecoration";
import { CurrencyInput } from "@/components/CurrencyInput";
import { CustomRateInput } from "@/components/CustomRateInput";
import { CustomRatesComponent } from "@/components/CustomRatesComponent";
import { ExchangeRateFooter } from "@/components/ExchangeRateFooter";
import { ExchangeRateHeader } from "@/components/ExchangeRateHeader";
import { Navbar } from "@/components/Navbar";
import { SectionDivider } from "@/components/SectionDivider";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  useCurrencyConverter,
  useCustomRatesCache,
  useExchangeRates,
} from "@/hooks";
import { formatAmount } from "@/utils/formatters";

function App() {
  const { user } = useAuth();

  const { rates, syncingRates, statusLine } = useExchangeRates();

  const {
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
  } = useCurrencyConverter(rates);

  const [customUnitLabel, setCustomUnitLabel] = useState("★");

  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const customRatesQuery = useCustomRatesCache(user?.uid);

  useEffect(() => {
    if (!user) {
      setCustomUnitLabel("★");
    }
  }, [user]);

  /*
  const fetchedAtText = (() => {
    if (!rates?.fetchedAt) return null;
    const date = new Date(rates.fetchedAt);
    if (Number.isNaN(date.getTime())) return rates.fetchedAt;
    return date.toLocaleString("es-VE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  })();
  */

  /*
  const showStaleRatesBanner = (() => {
    if (!rates) return false;
    const fetchedAtMs = Date.parse(rates.fetchedAt);
    if (!Number.isFinite(fetchedAtMs)) return false;
    const ageMs = Date.now() - fetchedAtMs;
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    return ageMs > twelveHoursMs;
  })();

  const staleRatesBannerDescription = (() => {
    if (syncingRates) {
      return "Usando tasas guardadas mientras se intenta actualizar…";
    }
    if (!isOnline) return "Sin conexión: usando tasas guardadas.";
    if (queryError)
      return "No se pudo actualizar la tasa; usando valor guardado.";
    return "Han pasado más de 12 horas desde la última actualización.";
  })();
  */

  const disabled = !rates;

  return (
    <div className="relative min-h-screen w-full bg-[#09090b] text-zinc-100 flex items-center justify-center p-1 sm:p-4 font-sans overflow-hidden selection:bg-indigo-500/30">
      <BackgroundDecoration />

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        {/**
        {showStaleRatesBanner && (
          <div className="mb-3 flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 ring-1 ring-amber-400/10">
            <AlertTriangle
              size={16}
              className="mt-0.5 shrink-0 text-amber-300"
              aria-hidden="true"
            />
             * <p className="min-w-0">
              <span className="font-semibold">Tasa desactualizada.</span>{" "}
              {staleRatesBannerDescription}{" "}
              {fetchedAtText ? `Última actualización: ${fetchedAtText}.` : null}
            </p>
          </div>
        )}
             */}

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

          <ExchangeRateHeader syncing={syncingRates} statusLine={statusLine} />

          <CardContent className="space-y-3 pt-3 sm:space-y-6 sm:pt-6">
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
            <SectionDivider label="Tasas de Cambio" />

            <div className="grid gap-2 sm:gap-4 sm:grid-cols-2">
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
            <SectionDivider label="Tasas Personalizadas" />

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
              <CustomRatesComponent
                customRatesQuery={customRatesQuery}
                customUnitLabel={customUnitLabel}
                onRateSelect={(label, formattedRate) => {
                  setCustomUnitLabel(label);
                  onCustomRateChange(formattedRate);
                }}
              />
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
