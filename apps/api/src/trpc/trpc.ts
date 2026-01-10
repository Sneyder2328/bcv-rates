import { initTRPC } from "@trpc/server";

/**
 * Initialization of tRPC backend.
 * This is where the tRPC API is initialized, connecting the context and transformer.
 */
const t = initTRPC.create();

/**
 * Export reusable router and procedure helpers.
 */
export const router = t.router;
export const publicProcedure = t.procedure;
