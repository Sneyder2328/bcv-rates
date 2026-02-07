import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import Constants from "expo-constants";

// Type-only import — no server code is bundled.
import type { AppRouter } from "../../../api/src/trpc/app-router.type";

export type TrpcClient = ReturnType<typeof createTRPCProxyClient<AppRouter>>;

let authToken: string | undefined;
let trpcClientSingleton: TrpcClient | null = null;

export function getApiBaseUrl(): string {
  const url = String(
    (Constants.expoConfig?.extra as { apiBaseUrl?: unknown })?.apiBaseUrl ??
      "https://api.cambio.sneyderangulo.com",
  ).trim();
  return url.replace(/\/$/, "");
}

export function setAuthToken(token?: string) {
  authToken = token;
}

export function getTrpcClient(): TrpcClient {
  if (trpcClientSingleton) return trpcClientSingleton;

  trpcClientSingleton = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        headers: () => {
          const token = authToken;
          return token ? { authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });

  return trpcClientSingleton;
}
