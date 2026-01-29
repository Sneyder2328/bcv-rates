import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { setAuthToken } from "../lib/trpcClient";

// TODO: Replace with actual Firebase user type when integrating auth
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // TODO: Implement actual Firebase authentication
  const signIn = useCallback(async (_email: string, _password: string) => {
    setLoading(true);
    try {
      // Stub: simulate sign in
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
      setUser({
        uid: "stub-user-id",
        email: _email,
        displayName: null,
      });
      // TODO: When Firebase auth is implemented, set the Bearer token here.
      // For now, keep requests anonymous.
      setAuthToken(undefined);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      // Stub: simulate sign out
      await new Promise<void>((resolve) => setTimeout(resolve, 200));
      setUser(null);
      setAuthToken(undefined);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
