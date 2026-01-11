import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { httpBatchLink } from "@trpc/client";
import { type ReactNode, useState } from "react";
import { auth } from "../auth/firebase.ts";
import { trpc } from "./client.ts";

interface TrpcProviderProps {
  children: ReactNode;
}

const inMemoryStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

const queryPersister = createSyncStoragePersister({
  storage: (() => {
    try {
      return window.localStorage;
    } catch {
      return inMemoryStorage as unknown as Storage;
    }
  })(),
  key: "bcv-rates-react-query-cache",
});

/**
 * Provider component that sets up tRPC and React Query for the app.
 * This should wrap the entire application.
 */
export function TrpcProvider({ children }: TrpcProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Don't refetch on window focus by default
            refetchOnWindowFocus: false,
            // Retry once on failure
            retry: 1,
            // Consider data stale after 30 seconds
            staleTime: 30 * 1000,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${import.meta.env.VITE_API_BASE_URL}/api/trpc`,
          headers: async () => {
            const token = await auth.currentUser?.getIdToken();
            return token ? { authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => query.meta?.persist === true,
            shouldDehydrateMutation: () => false,
          },
        }}
      >
        {children}
      </PersistQueryClientProvider>
    </trpc.Provider>
  );
}
