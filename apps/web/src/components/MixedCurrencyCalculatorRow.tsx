import type { ArithmeticOperation, SupportedCurrency } from "@bcv-rates/domain";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type MixedCurrencyCalculatorRowProps = {
  rowId: string;
  amount: string;
  currency: SupportedCurrency;
  operation: ArithmeticOperation;
  disableRemove: boolean;
  onAmountChange: (value: string) => void;
  onCurrencyChange: (value: SupportedCurrency) => void;
  onOperationChange: (value: ArithmeticOperation) => void;
  onRemove: () => void;
};

const selectClassName =
  "h-11 w-full rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-3 text-[16px] text-zinc-100 outline-none transition focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50";

export function MixedCurrencyCalculatorRow({
  rowId,
  amount,
  currency,
  operation,
  disableRemove,
  onAmountChange,
  onCurrencyChange,
  onOperationChange,
  onRemove,
}: MixedCurrencyCalculatorRowProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950/35 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1.5 sm:w-[116px]">
          <p className="ml-1 text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Operación
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onOperationChange("add")}
              className={`inline-flex h-11 items-center justify-center gap-1 rounded-xl border text-sm font-semibold transition-colors ${
                operation === "add"
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
                  : "border-zinc-800/80 bg-zinc-950/50 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
              }`}
              aria-label="Sumar fila"
            >
              <Plus size={14} />
              Suma
            </button>
            <button
              type="button"
              onClick={() => onOperationChange("subtract")}
              className={`inline-flex h-11 items-center justify-center gap-1 rounded-xl border text-sm font-semibold transition-colors ${
                operation === "subtract"
                  ? "border-rose-500/50 bg-rose-500/15 text-rose-200"
                  : "border-zinc-800/80 bg-zinc-950/50 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
              }`}
              aria-label="Restar fila"
            >
              <Minus size={14} />
              Resta
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          <Label
            htmlFor={`calculator-amount-${rowId}`}
            className="ml-1 text-xs font-semibold uppercase tracking-wider text-zinc-300"
          >
            Monto
          </Label>
          <Input
            id={`calculator-amount-${rowId}`}
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            className="h-11 border-zinc-800/80 bg-zinc-950/50 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>

        <div className="space-y-1.5 sm:w-[120px]">
          <Label
            htmlFor={`calculator-currency-${rowId}`}
            className="ml-1 text-xs font-semibold uppercase tracking-wider text-zinc-300"
          >
            Moneda
          </Label>
          <select
            id={`calculator-currency-${rowId}`}
            value={currency}
            onChange={(event) =>
              onCurrencyChange(event.target.value as SupportedCurrency)
            }
            className={selectClassName}
            aria-label="Selecciona la moneda de la fila"
          >
            <option value="VES">VES</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={disableRemove}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-3 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          title="Eliminar fila"
          aria-label="Eliminar fila"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
