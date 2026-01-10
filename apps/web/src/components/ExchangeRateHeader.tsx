import { CardHeader, CardTitle } from "./ui/card.tsx";

type ExchangeRateHeaderProps = {
    loading: boolean;
    statusLine: string;
};

export function ExchangeRateHeader({
    loading,
    statusLine,
}: ExchangeRateHeaderProps) {
    return (
        <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">
                        Convertidor (tasas del BCV)
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
    );
}
