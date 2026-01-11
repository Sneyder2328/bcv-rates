import { LogOut, Settings } from "lucide-react";
import { useAuth } from "../auth/AuthProvider.tsx";

type NavbarProps = {
  onOpenSettings: () => void;
  onOpenAuth: (mode: "login" | "signup") => void;
};

function getUserLabel(user: {
  displayName: string | null;
  email: string | null;
}) {
  return user.displayName?.trim() || user.email?.trim() || "Usuario";
}

function getUserInitial(label: string) {
  const first = label.trim().charAt(0);
  return first ? first.toUpperCase() : "U";
}

export function Navbar({ onOpenSettings, onOpenAuth }: NavbarProps) {
  const { user, loading, signOut } = useAuth();

  return (
    <div className="mb-3 sm:mb-4 flex items-center justify-between rounded-2xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl px-3 py-2 ring-1 ring-white/5">
      <div className="min-w-0 flex items-center gap-2">
        {user ? (
          <>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={getUserLabel(user)}
                className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/10"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-zinc-800/60 ring-1 ring-white/10 flex items-center justify-center text-sm font-semibold text-zinc-200">
                {getUserInitial(getUserLabel(user))}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-100">
                {getUserLabel(user)}
              </p>
              <p className="truncate text-xs text-zinc-500">Sesión activa</p>
            </div>
          </>
        ) : (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-100">
              El Cambio
            </p>
            <p className="truncate text-xs text-zinc-500">
              {loading ? "Cargando…" : "No hay sesión activa"}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {user ? (
          <>
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center justify-center rounded-xl bg-zinc-950/50 border border-zinc-800/80 px-2.5 py-2 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-50"
              title="Settings"
            >
              <Settings size={18} />
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center justify-center rounded-xl bg-zinc-950/50 border border-zinc-800/80 px-2.5 py-2 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onOpenAuth("login")}
              className="rounded-xl bg-zinc-950/50 border border-zinc-800/80 px-3 py-2 text-xs font-semibold text-zinc-200 hover:text-white hover:border-zinc-700 transition-colors"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth("signup")}
              className="rounded-xl bg-indigo-600/80 border border-indigo-500/60 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-600 hover:border-indigo-400 transition-colors"
            >
              Sign up
            </button>
          </>
        )}
      </div>
    </div>
  );
}
