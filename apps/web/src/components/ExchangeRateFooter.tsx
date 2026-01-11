type ExchangeRateFooterProps = {
  fetchedAt?: string;
};

export function ExchangeRateFooter({ fetchedAt }: ExchangeRateFooterProps) {
  return (
    <div className="mt-4 sm:mt-6 text-center space-y-1">
      <p className="text-s text-zinc-500 font-medium">
        Fuente: Banco Central de Venezuela
      </p>
      {fetchedAt && (
        <p className="text-xs text-zinc-500/70 uppercase tracking-widest">
          Actualizado:{" "}
          {new Date(fetchedAt).toLocaleString("es-VE", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>
      )}
    </div>
  );
}
