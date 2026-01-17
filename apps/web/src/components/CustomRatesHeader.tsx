interface CustomRatesHeaderProps {
  count?: number;
}

export function CustomRatesHeader({ count }: CustomRatesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 ml-1">
        Guardadas
      </p>
      {count ? <p className="text-xs text-zinc-600">{count}</p> : null}
    </div>
  );
}
