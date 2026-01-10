import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./components/ui/card.tsx";
import { Input } from "./components/ui/input.tsx";
import { Label } from "./components/ui/label.tsx";

type LatestRate = {
  rate: string;
  validAt: string;
  fetchedAt: string;
};

type LatestRatesResponse = {
  USD: LatestRate | null;
  EUR: LatestRate | null;
};

function parseAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s+/g, "").replace(/,/g, ".");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (Number.isNaN(n)) return null;
  return n;
}

function formatAmount(n: number) {
  // Keep it simple for inputs; just show 2 decimals.
  return n.toFixed(2);
}

function formatRate(n: number) {
  return new Intl.NumberFormat("es-VE", {
    maximumFractionDigits: 8,
    minimumFractionDigits: 2,
  }).format(n);
}

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<{
    usd: number;
    eur: number;
    validAt: string;
  } | null>(null);

  const [bolivars, setBolivars] = useState("");
  const [usd, setUsd] = useState("");
  const [eur, setEur] = useState("");

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

    return `BCV ${dateText} · 1 USD = ${formatRate(rates.usd)} Bs · 1 EUR = ${formatRate(rates.eur)} Bs`;
  }, [error, loading, rates]);

  useEffect(() => {
    let cancelled = false;

    async function loadRates() {
      try {
        setError(null);
        setLoading(true);

        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${apiBaseUrl}/api/exchange-rates/latest`);
        if (!res.ok) {
          throw new Error(
            `No se pudieron cargar las tasas (HTTP ${res.status})`,
          );
        }

        const data = (await res.json()) as LatestRatesResponse;
        const usdRate = data.USD
          ? Number.parseFloat(String(data.USD.rate))
          : Number.NaN;
        const eurRate = data.EUR
          ? Number.parseFloat(String(data.EUR.rate))
          : Number.NaN;

        if (!Number.isFinite(usdRate) || !Number.isFinite(eurRate)) {
          throw new Error("La API devolvió tasas inválidas.");
        }

        if (!cancelled) {
          setRates({
            usd: usdRate,
            eur: eurRate,
            validAt:
              data.USD?.validAt ??
              data.EUR?.validAt ??
              new Date().toISOString(),
          });
        }
      } catch (err) {
        if (!cancelled) {
          setRates(null);
          setError(
            err instanceof Error
              ? err.message
              : "Error inesperado cargando las tasas.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRates();
    return () => {
      cancelled = true;
    };
  }, []);

  function onBolivarsChange(next: string) {
    setBolivars(next);
    if (!rates) return;

    const amount = parseAmount(next);
    if (amount === null) {
      setUsd("");
      setEur("");
      return;
    }

    setUsd(formatAmount(amount / rates.usd));
    setEur(formatAmount(amount / rates.eur));
  }

  function onUsdChange(next: string) {
    setUsd(next);
    if (!rates) return;

    const amount = parseAmount(next);
    if (amount === null) {
      setBolivars("");
      setEur("");
      return;
    }

    const ves = amount * rates.usd;
    setBolivars(formatAmount(ves));
    setEur(formatAmount(ves / rates.eur));
  }

  function onEurChange(next: string) {
    setEur(next);
    if (!rates) return;

    const amount = parseAmount(next);
    if (amount === null) {
      setBolivars("");
      setUsd("");
      return;
    }

    const ves = amount * rates.eur;
    setBolivars(formatAmount(ves));
    setUsd(formatAmount(ves / rates.usd));
  }

  const disabled = loading || !rates;

  return (
    <div className="relative min-h-screen w-full bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 font-sans overflow-hidden selection:bg-indigo-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70vh] h-[70vh] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute bottom-[0%] right-[0%] w-[60vh] h-[60vh] rounded-full bg-purple-900/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <Card className="border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/5">
          {/* Decorative Top Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />

          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">
                  Convertidor BCV
                </CardTitle>
                <p className="mt-1 text-sm font-medium text-zinc-400/80">
                  {loading ? (
                    <span className="animate-pulse">Sincronizando tasas...</span>
                  ) : (
                    statusLine
                  )}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-zinc-800/50 flex items-center justify-center ring-1 ring-white/10">
                <span className="text-xl">🇻🇪</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* VES Input */}
            <div className="space-y-2">
              <Label
                htmlFor="ves"
                className="text-xs uppercase tracking-wider font-semibold text-zinc-500 ml-1"
              >
                Bolívares (VES)
              </Label>
              <div className="relative group">
                <Input
                  id="ves"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={bolivars}
                  onChange={(e) => onBolivarsChange(e.target.value)}
                  disabled={disabled}
                  className="h-14 pl-4 pr-12 bg-zinc-950/50 border-zinc-800/80 text-lg text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 font-medium group-focus-within:text-indigo-400 transition-colors">
                  Bs.
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800/50"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#121215] px-2 text-zinc-600 font-medium">
                  Tasas de Cambio
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* USD Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="usd"
                  className="text-xs uppercase tracking-wider font-semibold text-zinc-500 ml-1"
                >
                  Dólares (USD)
                </Label>
                <div className="relative group">
                  <Input
                    id="usd"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={usd}
                    onChange={(e) => onUsdChange(e.target.value)}
                    disabled={disabled}
                    className="h-12 bg-zinc-950/50 border-zinc-800/80 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 rounded-xl transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-focus-within:text-emerald-400 transition-colors">
                    $
                  </div>
                </div>
              </div>

              {/* EUR Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="eur"
                  className="text-xs uppercase tracking-wider font-semibold text-zinc-500 ml-1"
                >
                  Euros (EUR)
                </Label>
                <div className="relative group">
                  <Input
                    id="eur"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={eur}
                    onChange={(e) => onEurChange(e.target.value)}
                    disabled={disabled}
                    className="h-12 bg-zinc-950/50 border-zinc-800/80 text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-focus-within:text-blue-400 transition-colors">
                    €
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-zinc-600 font-medium">
          Fuente: Banco Central de Venezuela
        </p>
      </div>
    </div>
  );
}

export default App;
