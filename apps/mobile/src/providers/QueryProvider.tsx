import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from "@tanstack/react-query-persist-client";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const PERSISTENCE_MAX_AGE_MS = 2_592_000_000; // 30 days
const STORAGE_KEY = "bcv-rates-react-query-cache";

const dehydrateOptions = {
  shouldDehydrateQuery: (query: { meta?: unknown }) =>
    (query.meta as { persist?: boolean } | undefined)?.persist === true,
  shouldDehydrateMutation: () => false,
};

function LoadingState() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator />
      <Text style={styles.loadingText}>Inicializando cache…</Text>
    </View>
  );
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: __DEV__ ? 0 : 1,
            staleTime: 30 * 1000,
          },
        },
      }),
  );

  const persister = useMemo(
    () =>
      createAsyncStoragePersister({
        storage: AsyncStorage,
        key: STORAGE_KEY,
      }),
    [],
  );

  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    async function restore() {
      try {
        await persistQueryClientRestore({
          queryClient,
          persister,
          maxAge: PERSISTENCE_MAX_AGE_MS,
        });
      } catch (err) {
        // If the persisted cache is corrupted, clear it and proceed.
        try {
          await persister.removeClient();
        } catch {
          // ignore
        }
        if (__DEV__) {
          console.warn("[bcv-rates/mobile] Failed to restore query cache", err);
        }
      }

      if (cancelled) return;
      unsubscribe = persistQueryClientSubscribe({
        queryClient,
        persister,
        dehydrateOptions,
      });
      setIsRestored(true);
    }

    void restore();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [persister, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {isRestored ? children : <LoadingState />}
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  loadingText: {
    color: "#6b7280",
  },
});
