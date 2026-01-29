import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { NativeModules } from "react-native";

// IMPORTANT: type-only import to avoid bundling server/runtime code.
// This file should never execute API server logic in the mobile bundle.
import type { AppRouter } from "../../../api/src/trpc/app-router.type";

export type TrpcClient = ReturnType<typeof createTRPCProxyClient<AppRouter>>;

let authToken: string | undefined;
let apiBaseUrlOverride: string | undefined;
let trpcClientSingleton: TrpcClient | null = null;

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function readEnvApiBaseUrl(): string | undefined {
  // React Native doesn't guarantee `process.env`, but in some setups Metro injects it.
  const maybeProcess = (
    globalThis as unknown as { process?: { env?: Record<string, string> } }
  ).process;
  const raw = maybeProcess?.env?.API_BASE_URL;
  return raw ? normalizeBaseUrl(raw) : undefined;
}

function inferDevHostFromBundle(): string | undefined {
  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL) return undefined;
  // Example: http://192.168.0.10:8081/index.bundle?...
  const match = scriptURL.match(/^https?:\/\/([^:/?#]+)(?::\d+)?\//);
  return match?.[1];
}

export function setApiBaseUrl(url?: string) {
  apiBaseUrlOverride = url ? normalizeBaseUrl(url) : undefined;
  // Force re-create on next access so the link uses the new URL.
  trpcClientSingleton = null;
}

export function getApiBaseUrl(): string {
  const fromOverride = apiBaseUrlOverride;
  if (fromOverride) return fromOverride;

  const fromEnv = readEnvApiBaseUrl();
  if (fromEnv) return fromEnv;

  // Fallback: best-effort dev default. In real devices/emulators you likely must set
  // `API_BASE_URL` to a reachable host (LAN IP, tunnel, etc).
  const host = inferDevHostFromBundle();
  const fallback = host ? `http://${host}:3000` : "http://localhost:3000";

  if (__DEV__) {
    console.warn(
      `[bcv-rates/mobile] API_BASE_URL not set; falling back to ${fallback}. ` +
        "Set API_BASE_URL to your API origin (e.g. http://192.168.0.10:3000).",
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
