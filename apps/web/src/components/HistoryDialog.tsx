import { ChartColumn, X } from "lucide-react";
import { HistoryChart } from "./HistoryChart";

type HistoryDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function HistoryDialog({ open, onClose }: HistoryDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar historico"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-zinc-800/50 bg-zinc-900/80 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-950/50 text-emerald-400">
              <ChartColumn size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">Histórico</p>
              <p className="text-xs text-zinc-500">
                Consulta la evolución reciente de USD y EUR.
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

        <div className="p-4">
          <HistoryChart />
        </div>
      </div>
    </div>
  );
}
