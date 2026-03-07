import { Loader2 } from "lucide-react";
import { CardHeader, CardTitle } from "./ui/card.tsx";

type ExchangeRateHeaderProps = {
  syncing: boolean;
  statusLine: string;
  secondaryStatusLine?: string | null;
};

export function ExchangeRateHeader({
  syncing,
  statusLine,
  secondaryStatusLine,
}: ExchangeRateHeaderProps) {
  return (
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-xl sm:text-2xl font-bold bg-linear-to-br from-white to-zinc-400 bg-clip-text text-transparent">
            El Cambio - Convertidor de bolívares
          </CardTitle>
          <p className="mt-1 text-sm font-medium text-zinc-400/80">
            {syncing ? (
              <span className="inline-flex items-center gap-2">
                <Loader2
                  size={16}
                  className="animate-spin"
                  aria-hidden="true"
                />
                {statusLine}
              </span>
            ) : (
              statusLine
            )}
          </p>
          {secondaryStatusLine ? (
            <p className="mt-1 text-xs font-medium text-amber-300/80">
              {secondaryStatusLine}
            </p>
          ) : null}
        </div>
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-zinc-800/50 flex items-center justify-center ring-1 ring-white/10">
          <span className="text-lg sm:text-xl">🇻🇪</span>
        </div>
      </div>
    </CardHeader>
  );
}
