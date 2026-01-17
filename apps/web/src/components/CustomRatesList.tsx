import { formatRate } from "@/utils/formatters";

interface CustomRate {
  id: string;
  label: string;
  rate: string;
}

interface CustomRatesQuery {
  isLoading: boolean;
  error: { message: string } | null;
  data: { items: CustomRate[] } | null | undefined;
}

interface CustomRatesListProps {
  customRatesQuery: CustomRatesQuery;
  customUnitLabel: string;
  onRateSelect: (label: string, formattedRate: string) => void;
}

export function CustomRatesList({
  customRatesQuery,
  customUnitLabel,
  onRateSelect,
}: CustomRatesListProps) {
  if (customRatesQuery.isLoading) {
    return <p className="text-sm text-zinc-500">Cargando…</p>;
  }

  if (customRatesQuery.error) {
    return (
      <p className="text-sm text-red-300">
        Error cargando tasas: {customRatesQuery.error.message}
      </p>
    );
  }

  if (customRatesQuery.data?.items.length) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {customRatesQuery.data.items.map((r) => {
          const n = Number(r.rate);
          const formatted = Number.isFinite(n) ? formatRate(n) : r.rate;
          const isActive = customUnitLabel === r.label;

          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onRateSelect(r.label, formatted)}
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
    );
  }

  return (
    <p className="text-sm text-zinc-500">
      Aún no tienes tasas guardadas. Abre Configuraciones para crear una.
    </p>
  );
}
