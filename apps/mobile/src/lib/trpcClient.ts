import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

// Type-only import — no server code is bundled.
import type { AppRouter } from "../../../api/src/trpc/app-router.type";

export type TrpcClient = ReturnType<typeof createTRPCProxyClient<AppRouter>>;

const API_BASE_URL = "https://api.cambio.sneyderangulo.com";

let authToken: string | undefined;
let trpcClientSingleton: TrpcClient | null = null;

export function getApiBaseUrl(): string {
  return API_BASE_URL;
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
