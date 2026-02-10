import { timingSafeEqual } from "node:crypto";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getFirebaseAdminAuth } from "@/auth/firebase-admin";

export type TrpcUser = {
  uid: string;
};

export type TrpcServer = {
  trusted: true;
};

export type TrpcContext = {
  user: TrpcUser | null;
  server: TrpcServer | null;
};

const DEFAULT_INTERNAL_API_KEY_HEADER = "x-internal-api-key";

function getBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

function getInternalApiKeyHeaderName(): string {
  const configured = process.env.INTERNAL_API_KEY_HEADER?.trim().toLowerCase();
  return configured && configured.length > 0
    ? configured
    : DEFAULT_INTERNAL_API_KEY_HEADER;
}

function getHeaderValue(
  headers: CreateExpressContextOptions["req"]["headers"],
  headerName: string,
): string | null {
  const value = headers[headerName];
  if (Array.isArray(value)) {
    const first = value.find((entry) => entry.trim().length > 0);
    return first ? first.trim() : null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hasMatchingApiKey(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

function getTrustedServerIdentity(
  opts: CreateExpressContextOptions,
): TrpcServer | null {
  const expectedApiKey = process.env.INTERNAL_API_KEY?.trim();
  if (!expectedApiKey) return null;

  const headerName = getInternalApiKeyHeaderName();
  const providedApiKey = getHeaderValue(opts.req.headers, headerName);
  if (!providedApiKey) return null;

  return hasMatchingApiKey(providedApiKey, expectedApiKey)
    ? { trusted: true }
    : null;
}

async function getAuthenticatedUser(
  opts: CreateExpressContextOptions,
): Promise<TrpcUser | null> {
  const token = getBearerToken(opts.req.headers.authorization);
  if (!token) return null;

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    // Treat invalid/expired tokens as unauthenticated.
    return null;
  }
}

export async function createTrpcContext(
  opts: CreateExpressContextOptions,
): Promise<TrpcContext> {
  const [user, server] = await Promise.all([
    getAuthenticatedUser(opts),
    Promise.resolve(getTrustedServerIdentity(opts)),
  ]);

  return { user, server };
}
