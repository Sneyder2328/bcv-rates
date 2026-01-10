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
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Convertidor BCV</CardTitle>
            <p className="mt-2 text-sm text-zinc-600">{statusLine}</p>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="ves">Bolívares (VES)</Label>
              <Input
                id="ves"
                inputMode="decimal"
                placeholder="0,00"
                value={bolivars}
                onChange={(e) => onBolivarsChange(e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usd">Dólares (USD)</Label>
              <Input
                id="usd"
                inputMode="decimal"
                placeholder="0,00"
                value={usd}
                onChange={(e) => onUsdChange(e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eur">Euros (EUR)</Label>
              <Input
                id="eur"
                inputMode="decimal"
                placeholder="0,00"
                value={eur}
                onChange={(e) => onEurChange(e.target.value)}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Fuente: Banco Central de Venezuela · Tasas oficiales (Bs por 1
          USD/EUR)
        </p>
      </div>
    </div>
  );
}

export default App;
