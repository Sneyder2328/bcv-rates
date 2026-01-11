import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider.tsx";
import { Input } from "./ui/input.tsx";
import { Label } from "./ui/label.tsx";

type AuthDialogProps = {
  open: boolean;
  mode: "login" | "signup";
  onClose: () => void;
  onModeChange: (mode: "login" | "signup") => void;
};

export function AuthDialog({
  open,
  mode,
  onClose,
  onModeChange,
}: AuthDialogProps) {
  const { signInWithGoogle, signInWithEmailPassword, signUpWithEmailPassword } =
    useAuth();

  const title = useMemo(
    () => (mode === "login" ? "Iniciar sesión" : "Crear cuenta"),
    [mode],
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleEmailPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        await signInWithEmailPassword(email, password);
      } else {
        await signUpWithEmailPassword(email, password);
      }
      toast.success("Sesión iniciada");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo completar la autenticación");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setSubmitting(true);
    try {
      await signInWithGoogle();
      toast.success("Sesión iniciada");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo iniciar sesión con Google");
    } finally {
      setSubmitting(false);
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

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-zinc-800/50 bg-zinc-900/70 backdrop-blur-xl ring-1 ring-white/5 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
          <div>
            <p className="text-sm font-semibold text-zinc-100">{title}</p>
            <p className="text-xs text-zinc-500">
              Guarda tasas personalizadas por usuario
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

        <div className="p-4 space-y-4">
          <button
            type="button"
            onClick={() => void handleGoogle()}
            disabled={submitting}
            className="w-full rounded-xl bg-zinc-950/50 border border-zinc-800/80 px-3 py-2 text-sm font-semibold text-zinc-100 hover:border-zinc-700 transition-colors disabled:opacity-50"
          >
            Continuar con Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800/60" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-zinc-900/70 px-2 text-xs text-zinc-500">
                o con email
              </span>
            </div>
          </div>

          <form
            onSubmit={(e) => void handleEmailPasswordSubmit(e)}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="auth-email"
                className="text-xs uppercase tracking-wider font-semibold text-zinc-300 ml-1"
              >
                Email
              </Label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete={mode === "login" ? "email" : "email"}
                disabled={submitting}
                className="bg-zinc-950/50 border-zinc-800/80 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="auth-password"
                className="text-xs uppercase tracking-wider font-semibold text-zinc-300 ml-1"
              >
                Password
              </Label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                disabled={submitting}
                className="bg-zinc-950/50 border-zinc-800/80 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="w-full rounded-xl bg-indigo-600/80 border border-indigo-500/60 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-600 hover:border-indigo-400 transition-colors disabled:opacity-50"
            >
              {mode === "login" ? "Login" : "Sign up"}
            </button>
          </form>

          <p className="text-xs text-zinc-500">
            {mode === "login" ? (
              <>
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  className="text-zinc-200 hover:text-white underline underline-offset-4"
                  onClick={() => onModeChange("signup")}
                >
                  Crear cuenta
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  className="text-zinc-200 hover:text-white underline underline-offset-4"
                  onClick={() => onModeChange("login")}
                >
                  Iniciar sesión
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
