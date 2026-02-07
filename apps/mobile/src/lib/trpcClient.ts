import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { NativeModules, Platform } from "react-native";

// Type-only import — no server code is bundled.
import type { AppRouter } from "../../../api/src/trpc/app-router.type";

export type TrpcClient = ReturnType<typeof createTRPCProxyClient<AppRouter>>;

let authToken: string | undefined;
let apiBaseUrlOverride: string | undefined;
let trpcClientSingleton: TrpcClient | null = null;

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function inferDevHostFromBundle(): string | undefined {
  const scriptURL: string | undefined = (
    NativeModules?.SourceCode as { scriptURL?: string } | undefined
  )?.scriptURL;
  if (!scriptURL) return undefined;
  const match = scriptURL.match(/^https?:\/\/([^:/?#]+)(?::\d+)?\//);
  return match?.[1];
}

export function setApiBaseUrl(url?: string) {
  apiBaseUrlOverride = url ? normalizeBaseUrl(url) : undefined;
  trpcClientSingleton = null;
}

export function getApiBaseUrl(): string {
  if (apiBaseUrlOverride) return apiBaseUrlOverride;

  // Platform-aware defaults for dev.
  const host = inferDevHostFromBundle();

  if (host) {
    return `http://${host}:3006`;
  }

  // Fallback per platform.
  const fallback =
    Platform.OS === "android"
      ? "http://10.0.2.2:3006"
      : "http://localhost:3006";

  if (__DEV__) {
    console.warn(
      `[bcv-rates/mobile] API_BASE_URL not set; falling back to ${fallback}.`,
    );
  }

  return fallback;
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
