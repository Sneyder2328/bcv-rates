import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type DehydratedState,
  dehydrate,
  hydrate,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { type ReactNode, useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const CACHE_KEY = "bcv-rates-react-query-cache";

interface PersistedCache {
  timestamp: number;
  state: DehydratedState;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
});

// ---------------------------------------------------------------------------
// Manual persistence helpers
// ---------------------------------------------------------------------------

async function saveCache() {
  try {
    const state = dehydrate(queryClient, {
      shouldDehydrateQuery: (query) =>
        query.state.status === "success" && query.meta?.persist === true,
      shouldDehydrateMutation: () => false,
    });

    // Nothing to persist.
    if (state.queries.length === 0) return;

    const payload: PersistedCache = { timestamp: Date.now(), state };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Non-critical — ignore.
  }
}

async function restoreCache() {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as PersistedCache;

    // Expired?
    if (Date.now() - parsed.timestamp > THIRTY_DAYS_MS) {
      await AsyncStorage.removeItem(CACHE_KEY);
      return;
    }

    // Mark every restored query as success with its data so hydrate
    // doesn't try to resolve promises.
    for (const query of parsed.state.queries) {
      query.state.status = "success";
      query.state.fetchStatus = "idle";
    }

    hydrate(queryClient, parsed.state);
  } catch {
    // Corrupt or incompatible cache — discard silently.
    await AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function QueryProvider({ children }: { children: ReactNode }) {
  const restored = useRef(false);

  // Restore cache once on mount.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    restoreCache();
  }, []);

  // Save cache when the app goes to the background.
  useEffect(() => {
    function handleAppState(next: AppStateStatus) {
      if (next === "background" || next === "inactive") {
        saveCache();
      }
    }

    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
