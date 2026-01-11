import { Check, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider.tsx";
import { trpc } from "../trpc/client.ts";
import { writeCachedCustomRatesList } from "../utils/customRatesCache.ts";
import { formatRate } from "../utils/formatters.ts";
import { useOnlineStatus } from "../utils/network.ts";
import { Input } from "./ui/input.tsx";
import { Label } from "./ui/label.tsx";

type SettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const utils = trpc.useUtils();

  const listQuery = trpc.customRates.list.useQuery(undefined, {
    enabled: open && !!user && isOnline,
  });

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;
    if (!listQuery.data) return;
    writeCachedCustomRatesList(uid, listQuery.data);
  }, [listQuery.data, user?.uid]);

  const createMutation = trpc.customRates.create.useMutation({
    onSuccess: async () => {
      await utils.customRates.list.invalidate();
    },
  });

  const updateMutation = trpc.customRates.update.useMutation({
    onSuccess: async () => {
      await utils.customRates.list.invalidate();
    },
  });

  const deleteMutation = trpc.customRates.delete.useMutation({
    onSuccess: async () => {
      await utils.customRates.list.invalidate();
    },
  });

  const [label, setLabel] = useState("");
  const [rate, setRate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState("");

  const maxPerUser = listQuery.data?.maxPerUser ?? 10;
  const count = listQuery.data?.items.length ?? 0;
  const atLimit = count >= maxPerUser;

  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setEditingRate("");
    }
  }, [open]);

  if (!open) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Debes iniciar sesión para guardar tasas");
      return;
    }
    if (!isOnline) {
      toast.error("Sin conexión: modo solo lectura");
      return;
    }

    try {
      await createMutation.mutateAsync({ label, rate });
      setLabel("");
      setRate("");
      toast.success("Tasa guardada");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo guardar la tasa");
    }
  }

  async function handleDelete(id: string) {
    if (!isOnline) {
      toast.error("Sin conexión: modo solo lectura");
      return;
    }
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Tasa eliminada");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo eliminar la tasa");
    }
  }

  async function handleUpdate(id: string) {
    if (!isOnline) {
      toast.error("Sin conexión: modo solo lectura");
      return;
    }
    try {
      await updateMutation.mutateAsync({ id, rate: editingRate });
      toast.success("Tasa actualizada");
      setEditingId(null);
      setEditingRate("");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo actualizar la tasa");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-800/50 bg-zinc-900/70 backdrop-blur-xl ring-1 ring-white/5 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
          <div>
            <p className="text-sm font-semibold text-zinc-100">
              Configuraciones
            </p>
            <p className="text-xs text-zinc-500">
              Tus tasas guardadas ({count}/{maxPerUser})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 transition-colors"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {!user ? (
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 text-sm text-zinc-300">
              Debes iniciar sesión para administrar tus tasas personalizadas.
            </div>
          ) : (
            <>
              {!isOnline && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100 ring-1 ring-amber-400/10">
                  Sin conexión: modo solo lectura. Puedes ver tus tasas
                  guardadas, pero no puedes crear, editar o eliminar.
                </div>
              )}

              <form
                onSubmit={(e) => void handleCreate(e)}
                className="space-y-3"
              >
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1 space-y-1.5">
                    <Label
                      htmlFor="custom-label"
                      className="text-xs uppercase tracking-wider font-semibold text-zinc-300 ml-1"
                    >
                      Label
                    </Label>
                    <Input
                      id="custom-label"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="USDT"
                      disabled={
                        createMutation.isPending || atLimit || !isOnline
                      }
                      className="h-11 bg-zinc-950/50 border-zinc-800/80 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <Label
                      htmlFor="custom-rate"
                      className="text-xs uppercase tracking-wider font-semibold text-zinc-300 ml-1"
                    >
                      Rate (1 = X Bs)
                    </Label>
                    <Input
                      id="custom-rate"
                      inputMode="decimal"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      placeholder="0,00"
                      disabled={
                        createMutation.isPending || atLimit || !isOnline
                      }
                      className="h-11 bg-zinc-950/50 border-zinc-800/80 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    createMutation.isPending ||
                    !label.trim() ||
                    !rate.trim() ||
                    atLimit ||
                    !isOnline
                  }
                  className="w-full rounded-xl bg-indigo-600/80 border border-indigo-500/60 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-600 hover:border-indigo-400 transition-colors disabled:opacity-50"
                >
                  {!isOnline
                    ? "Modo solo lectura"
                    : atLimit
                      ? "Límite alcanzado"
                      : "Guardar tasa"}
                </button>
              </form>

              <div className="space-y-2">
                {listQuery.isLoading ? (
                  <p className="text-sm text-zinc-500">Cargando…</p>
                ) : listQuery.error ? (
                  <p className="text-sm text-red-300">
                    Error cargando tasas: {listQuery.error.message}
                  </p>
                ) : listQuery.data?.items.length ? (
                  <div className="space-y-2">
                    {listQuery.data.items.map((r) => {
                      const formatted = (() => {
                        const n = Number(r.rate);
                        return Number.isFinite(n) ? formatRate(n) : r.rate;
                      })();
                      const isEditing = editingId === r.id;

                      return (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/60 bg-zinc-950/40 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-100 truncate">
                              {r.label}
                            </p>
                            {isEditing ? (
                              <div className="mt-2 flex items-center gap-2">
                                <Input
                                  id={`edit-rate-${r.id}`}
                                  inputMode="decimal"
                                  value={editingRate}
                                  onChange={(e) =>
                                    setEditingRate(e.target.value)
                                  }
                                  placeholder="0,00"
                                  disabled={
                                    updateMutation.isPending || !isOnline
                                  }
                                  className="h-10 bg-zinc-950/50 border-zinc-800/80 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
                                />
                              </div>
                            ) : (
                              <p className="text-xs text-zinc-500 truncate">
                                1 {r.label} = {formatted} Bs
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleUpdate(r.id)}
                                  disabled={
                                    updateMutation.isPending ||
                                    !editingRate.trim() ||
                                    !isOnline
                                  }
                                  className="inline-flex items-center justify-center rounded-xl bg-zinc-950/50 border border-zinc-800/80 px-2.5 py-2 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-50"
                                  title="Guardar"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditingRate("");
                                  }}
                                  disabled={updateMutation.isPending}
                                  className="inline-flex items-center justify-center rounded-xl bg-zinc-950/50 border border-zinc-800/80 px-2.5 py-2 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-50"
                                  title="Cancelar"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(r.id);
                                  setEditingRate(formatted);
                                }}
                                disabled={
                                  deleteMutation.isPending ||
                                  updateMutation.isPending ||
                                  !isOnline
                                }
                                className="inline-flex items-center justify-center rounded-xl bg-zinc-950/50 border border-zinc-800/80 px-2.5 py-2 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-50"
                                title="Editar"
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void handleDelete(r.id)}
                              disabled={
                                deleteMutation.isPending ||
                                updateMutation.isPending ||
                                !isOnline
                              }
                              className="inline-flex items-center justify-center rounded-xl bg-zinc-950/50 border border-zinc-800/80 px-2.5 py-2 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-50"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">
                    Aún no tienes tasas guardadas.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
