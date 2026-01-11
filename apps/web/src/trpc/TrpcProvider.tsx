import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { type ReactNode, useState } from "react";
import { auth } from "../auth/firebase.ts";
import { trpc } from "./client.ts";

interface TrpcProviderProps {
  children: ReactNode;
}

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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
