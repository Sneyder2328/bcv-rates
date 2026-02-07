import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onIdTokenChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { setAuthToken } from "../lib/trpcClient";
import { queryClient } from "../providers/QueryProvider";
import { auth } from "./firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Sign in with a Google id_token obtained via Expo AuthSession. */
  signInWithGoogle: (idToken: string) => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signUpWithEmailPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to token changes — this fires on sign-in, sign-out, AND automatic
  // token refresh, so it's the single place to keep the tRPC auth header in
  // sync with Firebase.
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (nextUser) => {
      if (nextUser) {
        const token = await nextUser.getIdToken();
        setAuthToken(token);
      } else {
        setAuthToken(undefined);
      }
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,

      signInWithGoogle: async (idToken: string) => {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      },

      signInWithEmailPassword: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },

      signUpWithEmailPassword: async (email, password) => {
        await createUserWithEmailAndPassword(auth, email, password);
      },

      signOut: async () => {
        await firebaseSignOut(auth);
        setAuthToken(undefined);
        // Clear all user-scoped caches so the next user starts fresh.
        queryClient.removeQueries();
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
