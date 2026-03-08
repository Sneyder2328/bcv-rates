import { formatAmount, type SupportedCurrency } from "@bcv-rates/domain";
import { Calculator, Equal, Plus, RefreshCcw, X } from "lucide-react";
import { track } from "@/analytics/umami";
import type { ExchangeRates } from "@/hooks/useExchangeRates";
import { useMixedCurrencyCalculator } from "@/hooks/useMixedCurrencyCalculator";
import { MixedCurrencyCalculatorRow } from "./MixedCurrencyCalculatorRow";

type MixedCurrencyCalculatorDialogProps = {
  open: boolean;
  rates: ExchangeRates | null;
  statusLine: string;
  secondaryStatusLine: string | null;
  onClose: () => void;
};

const currencyMeta: Record<
  SupportedCurrency,
  { label: string; symbol: string }
> = {
  VES: { label: "Bolívares", symbol: "Bs." },
  USD: { label: "Dólares", symbol: "$" },
  EUR: { label: "Euros", symbol: "€" },
};

export function MixedCurrencyCalculatorDialog({
  open,
  rates,
  statusLine,
  secondaryStatusLine,
  onClose,
}: MixedCurrencyCalculatorDialogProps) {
  const {
    entries,
    totals,
    resultAmount,
    resultCurrency,
    setResultCurrency,
    addEntry,
    updateEntry,
    removeEntry,
    clearEntries,
    validEntriesCount,
  } = useMixedCurrencyCalculator(rates);

  if (!open) return null;

  const resultMeta = currencyMeta[resultCurrency];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar calculadora"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/80 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-zinc-800/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-950/50 text-indigo-300">
              <Calculator size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">
                Calculadora mixta
              </p>
              <p className="text-xs text-zinc-500">
                Suma y resta montos en VES, USD y EUR usando la tasa BCV
                seleccionada.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 transition-colors hover:bg-zinc-800/40 hover:text-zinc-100"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950/40 p-4">
              <p className="text-sm font-medium text-zinc-200">{statusLine}</p>
              {secondaryStatusLine ? (
                <p className="mt-1 text-xs text-zinc-500">
                  {secondaryStatusLine}
                </p>
              ) : (
                <p className="mt-1 text-xs text-zinc-500">
                  El resultado siempre se calcula llevando cada fila a bolívares
                  antes de aplicar la suma o resta.
                </p>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.45fr,0.95fr]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">
                      Operación
                    </p>
                    <p className="text-xs text-zinc-500">
                      Las filas vacías se ignoran automáticamente.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      track("calculator_add_line", { source: "dialog" });
                      addEntry();
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-3 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-700 hover:text-white"
                  >
                    <Plus size={15} />
                    Agregar fila
                  </button>
                </div>

                <div className="space-y-3">
                  {entries.map((entry) => (
                    <MixedCurrencyCalculatorRow
                      key={entry.id}
                      rowId={entry.id}
                      amount={entry.amount}
                      currency={entry.currency}
                      operation={entry.operation}
                      disableRemove={entries.length === 1}
                      onAmountChange={(value) =>
                        updateEntry(entry.id, { amount: value })
                      }
                      onCurrencyChange={(value) =>
                        updateEntry(entry.id, { currency: value })
                      }
                      onOperationChange={(value) =>
                        updateEntry(entry.id, { operation: value })
                      }
                      onRemove={() => removeEntry(entry.id)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950/40 p-4">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Equal size={16} />
                    <p className="text-sm font-semibold">Resultado</p>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {(["VES", "USD", "EUR"] as SupportedCurrency[]).map(
                      (currency) => (
                        <button
                          key={currency}
                          type="button"
                          onClick={() => setResultCurrency(currency)}
                          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                            resultCurrency === currency
                              ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-100"
                              : "border-zinc-800/80 bg-zinc-950/50 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
                          }`}
                        >
                          {currency}
                        </button>
                      ),
                    )}
                  </div>

                  {rates ? (
                    validEntriesCount > 0 && totals && resultAmount !== null ? (
                      <div className="mt-5 space-y-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            Total en {resultMeta.label}
                          </p>
                          <p className="mt-2 text-3xl font-semibold text-zinc-50">
                            {formatAmount(resultAmount)}{" "}
                            <span className="text-lg text-zinc-400">
                              {resultMeta.symbol}
                            </span>
                          </p>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                          <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/45 p-3">
                            <p className="text-xs uppercase tracking-wider text-zinc-500">
                              VES
                            </p>
                            <p className="mt-1 text-sm font-semibold text-zinc-100">
                              {formatAmount(totals.totalVes)} Bs.
                            </p>
                          </div>
                          <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/45 p-3">
                            <p className="text-xs uppercase tracking-wider text-zinc-500">
                              USD
                            </p>
                            <p className="mt-1 text-sm font-semibold text-zinc-100">
                              {formatAmount(totals.totalUsd)} $
                            </p>
                          </div>
                          <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/45 p-3">
                            <p className="text-xs uppercase tracking-wider text-zinc-500">
                              EUR
                            </p>
                            <p className="mt-1 text-sm font-semibold text-zinc-100">
                              {formatAmount(totals.totalEur)} €
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/30 p-4 text-sm text-zinc-400">
                        Agrega al menos un monto para ver el total en la moneda
                        que prefieras.
                      </div>
                    )
                  ) : (
                    <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100 ring-1 ring-amber-400/10">
                      La calculadora necesita que las tasas estén cargadas para
                      convertir cada fila correctamente.
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    track("calculator_clear", { source: "dialog" });
                    clearEntries();
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-3 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-700 hover:text-white"
                >
                  <RefreshCcw size={15} />
                  Limpiar operación
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
