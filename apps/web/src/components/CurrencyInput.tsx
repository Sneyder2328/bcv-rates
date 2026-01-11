import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "./ui/input.tsx";
import { Label } from "./ui/label.tsx";

type CurrencyInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  symbol: string;
  focusColor: "indigo" | "emerald" | "blue";
  exchangeRate?: string;
  inputSize?: "sm" | "lg";
};

const focusColorClasses = {
  indigo: {
    border: "focus:border-indigo-500/50",
    ring: "focus:ring-indigo-500/10",
    symbol: "group-focus-within:text-indigo-400",
  },
  emerald: {
    border: "focus:border-emerald-500/50",
    ring: "focus:ring-emerald-500/10",
    symbol: "group-focus-within:text-emerald-400",
  },
  blue: {
    border: "focus:border-blue-500/50",
    ring: "focus:ring-blue-500/10",
    symbol: "group-focus-within:text-blue-400",
  },
};

export function CurrencyInput({
  id,
  label,
  value,
  onChange,
  disabled,
  symbol,
  focusColor,
  exchangeRate,
  inputSize = "sm",
}: CurrencyInputProps) {
  const [copied, setCopied] = useState(false);
  const colors = focusColorClasses[focusColor];
  const height = inputSize === "lg" ? "h-12 sm:h-14" : "h-12";
  const fontSize = inputSize === "lg" ? "text-lg" : "";
  const padding = inputSize === "lg" ? "pl-4 pr-12" : "";

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${value} ${symbol} copiado al portapapeles`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Error al copiar");
    }
  };

  return (
    <div className="space-y-1 sm:space-y-2">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className="text-xs uppercase tracking-wider font-semibold text-zinc-300 ml-1"
        >
          {label}
        </Label>
        <button
          onClick={handleCopy}
          disabled={!value}
          className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors p-1 -mr-1"
          title="Copiar cantidad"
          type="button"
        >
          {copied ? (
            <Check size={14} className="text-emerald-500" />
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>
      <div className="relative group">
        <Input
          id={id}
          inputMode="decimal"
          placeholder="0,00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${height} ${fontSize} ${padding} bg-zinc-950/50 border-zinc-800/80 text-zinc-100 placeholder:text-zinc-600 ${colors.border} focus:ring-4 ${colors.ring} rounded-xl transition-all`}
        />
        <div
          className={`absolute ${inputSize === "lg" ? "right-4" : "right-3"} top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 font-medium ${colors.symbol} transition-colors`}
        >
          {symbol}
        </div>
      </div>
      {exchangeRate && (
        <p className="text-[14px] font-medium text-zinc-400 text-right px-1">
          {exchangeRate}
        </p>
      )}
    </div>
  );
}
