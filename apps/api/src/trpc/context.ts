import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { UmamiService } from "@/analytics/umami.service";
import { getFirebaseAdminAuth } from "@/auth/firebase-admin";

export type TrpcUser = {
  uid: string;
};

export type TrpcContext = {
  user: TrpcUser | null;
  umami: UmamiService;
};

function getBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export async function createTrpcContext(
  opts: CreateExpressContextOptions,
  umami: UmamiService,
): Promise<TrpcContext> {
  const token = getBearerToken(opts.req.headers.authorization);
  if (!token) {
    return { user: null, umami };
  }

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
    return { user: { uid: decoded.uid }, umami };
  } catch {
    // Treat invalid/expired tokens as unauthenticated.
    // Protected procedures will enforce auth via `protectedProcedure`.
    return { user: null, umami };
  }
}
