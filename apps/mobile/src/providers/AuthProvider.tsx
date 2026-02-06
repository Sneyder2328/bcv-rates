import auth, { type FirebaseAuthTypes } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { setAuthToken } from "../lib/trpcClient";

// ---------------------------------------------------------------------------
// Configure Google Sign-In once at module level.
// `webClientId` must match the web client ID from Google Cloud / Firebase
// console. On Android it's typically auto-detected from google-services.json
// when omitted; on iOS it reads from GoogleService-Info.plist.
// ---------------------------------------------------------------------------
GoogleSignin.configure();

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signUpWithEmailPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toAuthUser(fbUser: FirebaseAuthTypes.User | null): AuthUser | null {
  if (!fbUser) return null;
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
  };
}

async function syncToken(fbUser: FirebaseAuthTypes.User | null) {
  if (!fbUser) {
    setAuthToken(undefined);
    return;
  }
  try {
    const token = await fbUser.getIdToken();
    setAuthToken(token);
  } catch {
    // Token fetch failed — keep previous token (or undefined).
    // The tRPC call will surface a 401 if expired.
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (fbUser) => {
      setUser(toAuthUser(fbUser));
      await syncToken(fbUser);
      setLoading(false);
    });

    // Listen for token refresh events so the tRPC header stays current.
    const unsubToken = auth().onIdTokenChanged(async (fbUser) => {
      await syncToken(fbUser);
    });

    return () => {
      unsubscribe();
      unsubToken();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,

      signInWithGoogle: async () => {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
        const response = await GoogleSignin.signIn();
        if (response.type !== "success") {
          // User cancelled — caller decides whether to show a toast.
          return;
        }
        const idToken = response.data.idToken;
        if (!idToken) {
          throw new Error("Google sign-in did not return an ID token");
        }
        // Create a Firebase credential with the Google token.
        const credential = auth.GoogleAuthProvider.credential(idToken);
        await auth().signInWithCredential(credential);
        // onAuthStateChanged will fire → syncToken runs automatically.
      },

      signInWithEmailPassword: async (email, password) => {
        await auth().signInWithEmailAndPassword(email, password);
      },

      signUpWithEmailPassword: async (email, password) => {
        await auth().createUserWithEmailAndPassword(email, password);
      },

      signOut: async () => {
        // Sign out from Google (clears any cached tokens).
        if (GoogleSignin.hasPreviousSignIn()) {
          try {
            await GoogleSignin.signOut();
          } catch {
            // Non-critical — proceed with Firebase sign-out.
          }
        }
        await auth().signOut();
        setAuthToken(undefined);
        // Invalidate user-scoped caches (e.g. custom rates in Phase 6).
        // Public data (exchange rates) stays since it's not user-specific.
        queryClient.removeQueries({ queryKey: ["customRates"] });
      },
    }),
    [user, loading, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
