import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getFirebaseAdminAuth } from "../auth/firebase-admin.js";

export type TrpcUser = {
  uid: string;
};

export type TrpcContext = {
  user: TrpcUser | null;
};

function getBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export async function createTrpcContext(
  opts: CreateExpressContextOptions,
): Promise<TrpcContext> {
  const token = getBearerToken(opts.req.headers.authorization);
  if (!token) {
    return { user: null };
  }

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
    return { user: { uid: decoded.uid } };
  } catch {
    // Treat invalid/expired tokens as unauthenticated.
    // Protected procedures will enforce auth via `protectedProcedure`.
    return { user: null };
  }
}
