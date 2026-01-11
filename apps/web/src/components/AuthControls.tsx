import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider.tsx";

export function AuthControls() {
  const {
    user,
    loading,
    signInWithEmailPassword,
    signInWithGoogle,
    signOut,
    signUpWithEmailPassword,
  } = useAuth();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const userLabel = useMemo(() => {
    if (!user) return null;
    return user.email ?? user.displayName ?? user.uid;
  }, [user]);

  async function handleEmailAuth() {
    if (!email || !password) {
      toast.error("Email y contraseña son requeridos");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signIn") {
        await signInWithEmailPassword(email, password);
        toast.success("Sesión iniciada");
      } else {
        await signUpWithEmailPassword(email, password);
        toast.success("Cuenta creada");
      }
      setOpen(false);
      setPassword("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error de autenticación",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setSubmitting(true);
    try {
      await signInWithGoogle();
      toast.success("Sesión iniciada");
      setOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error autenticando con Google",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Sesión cerrada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error cerrando sesión");
    }
  }

  if (loading) {
    return <div className="text-xs text-zinc-500 font-medium">Cargando…</div>;
  }

  return (
    <div className="relative">
      {user ? (
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-300">
            <UserIcon size={14} className="text-zinc-400" />
            <span className="max-w-[160px] truncate">{userLabel}</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-200 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold transition-colors"
          >
            <LogOut size={14} />
            Salir
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-100 ring-1 ring-indigo-500/20 px-3 py-2 text-xs font-semibold transition-colors"
        >
          <LogIn size={14} />
          Entrar
        </button>
      )}

      {open && !user && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl shadow-2xl ring-1 ring-white/5 p-3 z-50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-zinc-200">
              {mode === "signIn" ? "Iniciar sesión" : "Crear cuenta"}
            </div>
            <button
              type="button"
              className="text-zinc-500 hover:text-zinc-300 text-xs"
              onClick={() => setOpen(false)}
            >
              Cerrar
            </button>
          </div>

          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setMode("signIn")}
              className={`flex-1 rounded-xl px-2 py-1 text-xs font-semibold ring-1 transition-colors ${
                mode === "signIn"
                  ? "bg-zinc-800/60 text-zinc-100 ring-white/10"
                  : "bg-transparent text-zinc-400 ring-white/5 hover:bg-zinc-900/40"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signUp")}
              className={`flex-1 rounded-xl px-2 py-1 text-xs font-semibold ring-1 transition-colors ${
                mode === "signUp"
                  ? "bg-zinc-800/60 text-zinc-100 ring-white/10"
                  : "bg-transparent text-zinc-400 ring-white/5 hover:bg-zinc-900/40"
              }`}
            >
              Crear
            </button>
          </div>

          <div className="space-y-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full h-10 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-zinc-100 placeholder:text-zinc-600 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40"
              type="email"
              autoComplete="email"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full h-10 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-zinc-100 placeholder:text-zinc-600 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40"
              type="password"
              autoComplete={
                mode === "signIn" ? "current-password" : "new-password"
              }
            />

            <button
              type="button"
              disabled={submitting}
              onClick={handleEmailAuth}
              className="w-full h-10 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 disabled:opacity-50 text-indigo-100 ring-1 ring-indigo-500/20 px-3 text-sm font-semibold transition-colors"
            >
              {mode === "signIn" ? "Entrar" : "Crear cuenta"}
            </button>

            <div className="h-px bg-zinc-800/60" />

            <button
              type="button"
              disabled={submitting}
              onClick={handleGoogle}
              className="w-full h-10 rounded-xl bg-zinc-800/40 hover:bg-zinc-800/60 disabled:opacity-50 text-zinc-100 ring-1 ring-white/10 px-3 text-sm font-semibold transition-colors"
            >
              Continuar con Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
