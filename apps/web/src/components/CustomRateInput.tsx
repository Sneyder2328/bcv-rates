import { Input } from "./ui/input.tsx";
import { Label } from "./ui/label.tsx";
import { formatAmount, parseAmount } from "../utils/formatters.ts";

type CustomRateInputProps = {
    rateValue: string;
    amountValue: string;
    onRateChange: (value: string) => void;
    onAmountChange: (value: string) => void;
    disabled?: boolean;
};

export function CustomRateInput({
    rateValue,
    amountValue,
    onRateChange,
    onAmountChange,
    disabled = false,
}: CustomRateInputProps) {
    const parsedRate = parseAmount(rateValue);
    const formattedRate = parsedRate !== null && parsedRate > 0 ? formatAmount(parsedRate) : null;

    return (
        <div className="space-y-3 sm:space-y-4">
            {/* Rate Input */}
            <div className="space-y-1 sm:space-y-2">
                <Label
                    htmlFor="custom-rate"
                    className="text-xs uppercase tracking-wider font-semibold text-zinc-300 ml-1"
                >
                    Tasa Personalizada (1 = X Bs)
                </Label>
                <div className="relative group">
                    <Input
                        id="custom-rate"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={rateValue}
                        onChange={(e) => onRateChange(e.target.value)}
                        disabled={disabled}
                        className="h-12 bg-zinc-950/50 border-zinc-800/80 text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 rounded-xl transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-focus-within:text-violet-400 transition-colors">
                        Bs.
                    </div>
                </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-1 sm:space-y-2">
                <Label
                    htmlFor="custom-amount"
                    className="text-xs uppercase tracking-wider font-semibold text-zinc-300 ml-1"
                >
                    Cantidad Personalizada
                </Label>
                <div className="relative group">
                    <Input
                        id="custom-amount"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={amountValue}
                        onChange={(e) => onAmountChange(e.target.value)}
                        disabled={disabled}
                        className="h-12 bg-zinc-950/50 border-zinc-800/80 text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 rounded-xl transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-focus-within:text-violet-400 transition-colors">
                        ★
                    </div>
                </div>
                {formattedRate && (
                    <p className="text-[14px] font-medium text-zinc-400 text-right px-1">
                        1 = {formattedRate} Bs
                    </p>
                )}
            </div>
        </div>
    );
}
